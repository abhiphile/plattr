import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User, Send, Mic, MicOff, Square } from "lucide-react";
import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface ChatInterfaceProps {
  context: "offers" | "promotions" | "settings" | "analytics";
  placeholder?: string;
  className?: string;
}

export default function ChatInterface({ 
  context, 
  placeholder = "Type your message...",
  className = ""
}: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load conversation history
  const { data: conversation } = useQuery({
    queryKey: ["/api/conversations", context],
  });

  useEffect(() => {
    if (conversation?.messages) {
      setMessages(conversation.messages);
    }
  }, [conversation]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  const formatMessageContent = (content: string) => {
    // Split the content into math blocks (\[...\]) and normal text
    const parts = content.split(/(\\\[.*?\\\])/gs); // Match \[...\] blocks
  
    return parts.map((part, index) => {
      // Render LaTeX block math
      if (part.startsWith('\\[') && part.endsWith('\\]')) {
        const mathContent = part.slice(2, -2).trim();
        return <BlockMath key={index} math={mathContent} />;
      }
  
      // Process bold and italics in normal text
      const processed = part
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **bold**
        .replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>'); // *italic*
  
      // Split lines and add <br />
      const lines = processed.split('\n');
      return (
        <span key={index}>
          {lines.map((line, i) => (
            <span key={i}>
              <span dangerouslySetInnerHTML={{ __html: line }} />
              {i < lines.length - 1 && <br />}
            </span>
          ))}
        </span>
      );
    });
  };
  
  

  const sendMessageMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const response = await apiRequest("POST", "/api/ai/chat", {
        message: userMessage,
        context,
        conversationId: conversation?.id
      });
      return response.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [
        ...prev,
        {
          role: "user",
          content: message,
          timestamp: new Date().toISOString()
        },
        {
          role: "assistant", 
          content: data.message,
          timestamp: new Date().toISOString()
        }
      ]);
      setMessage("");
    },
    onError: () => {
      setMessages(prev => [
        ...prev,
        {
          role: "user",
          content: message,
          timestamp: new Date().toISOString()
        },
        {
          role: "assistant",
          content: "I'm sorry, I'm experiencing some technical difficulties. Please try again.",
          timestamp: new Date().toISOString()
        }
      ]);
      setMessage("");
    }
  });

  const sendAudioMutation = useMutation({
    mutationFn: async (audioBlob: Blob) => {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('context', context);
      if (conversation?.id) {
        formData.append('conversationId', conversation.id);
      }

      const response = await fetch('/api/ai/voice-chat', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to send audio');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [
        ...prev,
        {
          role: "user",
          content: data.transcription || "[Voice message]",
          timestamp: new Date().toISOString()
        },
        {
          role: "assistant", 
          content: data.message,
          timestamp: new Date().toISOString()
        }
      ]);
      setAudioBlob(null);
    },
    onError: () => {
      setMessages(prev => [
        ...prev,
        {
          role: "user",
          content: "[Voice message - failed to process]",
          timestamp: new Date().toISOString()
        },
        {
          role: "assistant",
          content: "I'm sorry, I couldn't process your voice message. Please try again or type your message.",
          timestamp: new Date().toISOString()
        }
      ]);
      setAudioBlob(null);
    }
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        
        // Clean up stream
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioBlob(null);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };

  const sendAudio = () => {
    if (audioBlob) {
      sendAudioMutation.mutate(audioBlob);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(message);
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getContextPrompt = () => {
    switch (context) {
      case "offers":
        return "Hi! I can help you create, update, or manage offers across all your platforms. What would you like to do?";
      case "promotions":
        return "I can help you plan and execute marketing campaigns. What type of promotion are you thinking about?";
      case "settings":
        return "I can help you update store timings, delivery areas, menu availability, and other settings across all platforms. What would you like to change?";
      case "analytics":
        return "I can help you interpret your performance data and suggest improvements. What insights are you looking for?";
      default:
        return "How can I help you today?";
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {/* Initial AI message */}
          {messages.length === 0 && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="chat-message-assistant">
                <p className="text-sm">{getContextPrompt()}</p>
              </div>
            </div>
          )}
          
          {/* Conversation messages */}
          {messages.map((msg, index) => (
            <div 
              key={index}
              className={`flex items-start space-x-3 ${
                msg.role === "user" ? "justify-end" : ""
              }`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div className={
                msg.role === "user" ? "chat-message-user" : "chat-message-assistant"
              }>
                <div className="text-sm">
                  {msg.role === "assistant" ? formatMessageContent(msg.content) : msg.content}
                </div>
              </div>
              
              {msg.role === "user" && (
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              )}
            </div>
          ))}
          
          {/* Loading indicator */}
          {(sendMessageMutation.isPending || sendAudioMutation.isPending) && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Recording status */}
      {isRecording && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-red-700">Recording... {formatRecordingTime(recordingTime)}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={cancelRecording}
            className="text-red-600 hover:text-red-700"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Audio preview */}
      {audioBlob && !isRecording && (
        <div className="px-4 py-2 bg-green-50 border-t border-green-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-green-700">Voice message recorded</span>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAudioBlob(null)}
              className="text-gray-600 hover:text-gray-700"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={sendAudio}
              disabled={sendAudioMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Send
            </Button>
          </div>
        </div>
      )}
      
      {/* Message input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex space-x-3">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={placeholder}
            className="flex-1"
            disabled={sendMessageMutation.isPending || isRecording}
          />
          
          {/* Voice input button */}
          <Button
            type="button"
            variant={isRecording ? "destructive" : "outline"}
            size="icon"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={sendMessageMutation.isPending || sendAudioMutation.isPending || !!audioBlob}
          >
            {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
          
          <Button 
            type="submit" 
            disabled={!message.trim() || sendMessageMutation.isPending || isRecording}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
