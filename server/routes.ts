import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { aiAssistant } from "./services/ai";
import { platformService } from "./services/platforms";
import { browserService } from "./services/browser";
import { z } from "zod";
import { insertOfferSchema, insertCampaignSchema, insertConversationSchema } from "@shared/schema";
import multer from "multer";
import FormData from "form-data";
import fetch from "node-fetch";
import fs from "fs";
import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Default merchant ID for demo (in real app, this would come from authentication)
  const DEFAULT_MERCHANT_ID = 1;
  const SARVAM_API_KEY = "202915e6-ae8a-467c-ba53-898c50147591"; // Move to environment variables
  const SARVAM_STT_URL = "https://api.sarvam.ai/speech-to-text";

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      // Accept audio files
      if (file.mimetype.startsWith('audio/')) {
        cb(null, true);
      } else {
        cb(new Error('Only audio files are allowed'), false);
      }
    }
  });

  function getFileExtension(mimeType) {
    const mimeToExt = {
      'audio/webm': 'webm',
      'audio/wav': 'wav',
      'audio/mp3': 'mp3',
      'audio/mpeg': 'mp3',
      'audio/mp4': 'mp4',
      'audio/ogg': 'ogg',
      'audio/flac': 'flac'
    };
    return mimeToExt[mimeType] || 'audio';
  }

  // Get merchant profile
  app.get("/api/merchant", async (req, res) => {
    try {
      const merchant = await storage.getMerchant(DEFAULT_MERCHANT_ID);
      if (!merchant) {
        return res.status(404).json({ message: "Merchant not found" });
      }
      res.json(merchant);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch merchant profile" });
    }
  });

  // Get platform connections
  app.get("/api/platforms", async (req, res) => {
    try {
      const platforms = await storage.getPlatformsByMerchant(DEFAULT_MERCHANT_ID);
      res.json(platforms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch platform connections" });
    }
  });

  // Connect to platform
  app.post("/api/platforms/connect", async (req, res) => {
    try {
      const { platformName, credentials } = req.body;
      
      if (!platformName || !credentials?.username || !credentials?.password) {
        return res.status(400).json({ message: "Platform name and credentials are required" });
      }

      const result = await platformService.authenticatePlatform(
        DEFAULT_MERCHANT_ID,
        platformName,
        credentials
      );

      if (result.success) {
        res.json({ message: result.message, platform: result.platform });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to connect platform" });
    }
  });

  // Disconnect platform
  app.post("/api/platforms/disconnect", async (req, res) => {
    try {
      const { platformName } = req.body;
      
      if (!platformName) {
        return res.status(400).json({ message: "Platform name is required" });
      }

      const result = await platformService.disconnectPlatform(DEFAULT_MERCHANT_ID, platformName);
      
      if (result.success) {
        res.json({ message: result.message });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to disconnect platform" });
    }
  });

  // Refresh platform connection
  app.post("/api/platforms/refresh", async (req, res) => {
    try {
      const { platformName } = req.body;
      
      if (!platformName) {
        return res.status(400).json({ message: "Platform name is required" });
      }

      const result = await platformService.refreshConnection(DEFAULT_MERCHANT_ID, platformName);
      
      if (result.success) {
        res.json({ message: result.message });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to refresh platform connection" });
    }
  });

  // Get offers
  app.get("/api/offers", async (req, res) => {
    try {
      const { active } = req.query;
      let offers;
      
      if (active === "true") {
        offers = await storage.getActiveOffers(DEFAULT_MERCHANT_ID);
      } else {
        offers = await storage.getOffersByMerchant(DEFAULT_MERCHANT_ID);
      }
      
      res.json(offers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch offers" });
    }
  });

  // Create offer
  app.post("/api/offers", async (req, res) => {
    try {
      const offerData = insertOfferSchema.parse({
        ...req.body,
        merchantId: DEFAULT_MERCHANT_ID
      });
      
      const offer = await storage.createOffer(offerData);
      
      // Execute on connected platforms
      const platforms = await storage.getPlatformsByMerchant(DEFAULT_MERCHANT_ID);
      const connectedPlatforms = platforms.filter(p => p.isConnected && offerData.platforms?.includes(p.name));
      
      for (const platform of connectedPlatforms) {
        await platformService.executePlatformAction(DEFAULT_MERCHANT_ID, platform.name, {
          type: "create_offer",
          data: offer
        });
      }
      
      res.json(offer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid offer data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create offer" });
      }
    }
  });

  // Get campaigns
  app.get("/api/campaigns", async (req, res) => {
    try {
      const { active } = req.query;
      let campaigns;
      
      if (active === "true") {
        campaigns = await storage.getActiveCampaigns(DEFAULT_MERCHANT_ID);
      } else {
        campaigns = await storage.getCampaignsByMerchant(DEFAULT_MERCHANT_ID);
      }
      
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  // Create campaign
  app.post("/api/campaigns", async (req, res) => {
    try {
      const campaignData = insertCampaignSchema.parse({
        ...req.body,
        merchantId: DEFAULT_MERCHANT_ID
      });
      
      const campaign = await storage.createCampaign(campaignData);
      res.json(campaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid campaign data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create campaign" });
      }
    }
  });

  // Update campaign
  app.put("/api/campaigns/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const campaign = await storage.updateCampaign(id, updates);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      res.json(campaign);
    } catch (error) {
      res.status(500).json({ message: "Failed to update campaign" });
    }
  });

  // Get analytics
  app.get("/api/analytics", async (req, res) => {
    try {
      const { platform, days } = req.query;
      let analytics;
      
      if (platform && platform !== "all") {
        analytics = await storage.getAnalyticsByPlatform(
          DEFAULT_MERCHANT_ID, 
          platform as string, 
          days ? parseInt(days as string) : 7
        );
      } else {
        analytics = await storage.getAnalyticsByMerchant(
          DEFAULT_MERCHANT_ID, 
          days ? parseInt(days as string) : 7
        );
      }
      
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // AI Assistant endpoints
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, context, conversationId } = req.body;
      
      if (!message || !context) {
        return res.status(400).json({ message: "Message and context are required" });
      }

      // Get conversation history
      let conversation = null;
      if (conversationId) {
        conversation = await storage.getConversation(DEFAULT_MERCHANT_ID, context);
      }

      // Get merchant data for context
      const merchant = await storage.getMerchant(DEFAULT_MERCHANT_ID);
      
      const response = await aiAssistant.processMessage(message, {
        context,
        merchantData: merchant,
        conversationHistory: conversation?.messages || []
      });

      const output = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that provides short, concise, human-like responses in proper simple sentences."
          },
          {
            role: "user",
            content: `Question: ${message}\n\nSource Data: ${fs.readFileSync('output.txt', 'utf8')}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });
  
      // Extract the response
      const result = output.choices[0].message.content;

      // Handle browser automation response
      if (response.needsRealTimeData && response.browserTaskId) {
        // Return immediate response with task ID for polling
        res.json({
          ...response,
          polling: true,
          taskId: response.browserTaskId,
          // message: "I'm fetching the latest data from your platforms. This will take a moment..."
          message: result
        });
        return;
      }

      // Update conversation for regular responses
      if (conversation) {
        const updatedMessages = [
          ...(conversation.messages || []),
          { role: "user" as const, content: message, timestamp: new Date().toISOString() },
          { role: "assistant" as const, content: response.message, timestamp: new Date().toISOString() }
        ];
        
        await storage.updateConversation(conversation.id, {
          messages: updatedMessages
        });
      } else {
        // Create new conversation
        await storage.createConversation({
          merchantId: DEFAULT_MERCHANT_ID,
          context,
          messages: [
            { role: "user", content: message, timestamp: new Date().toISOString() },
            { role: "assistant", content: response.message, timestamp: new Date().toISOString() }
          ]
        });
      }

      res.json(response);
    } catch (error) {
      console.error("AI chat error:", error);
      res.status(500).json({ message: "Failed to process AI request" });
    }
  });

  app.post("/api/ai/voice-chat", upload.single('audio'), async (req, res) => {
    try {
      const { context, conversationId } = req.body;
      
      if (!req.file) {
        return res.status(400).json({ 
          message: "Audio file is required",
          error: "NO_AUDIO_FILE"
        });
      }
  
      if (!context) {
        return res.status(400).json({ 
          message: "Context is required",
          error: "NO_CONTEXT"
        });
      }
  
      console.log(`Processing voice message for context: ${context}`);
      console.log(`Audio file size: ${req.file.size} bytes, type: ${req.file.mimetype}`);
  
      // Step 1: Convert speech to text using Sarvam AI API
      let transcription = "";
      try {
        const formData = new FormData();
        formData.append('file', req.file.buffer, {
          filename: `audio.${getFileExtension(req.file.mimetype)}`,
          contentType: req.file.mimetype
        });
        formData.append('model', 'saarika:v2');
        formData.append('language_code', 'en-IN');
  
        const sarvamResponse = await fetch(SARVAM_STT_URL, {
          method: 'POST',
          headers: {
            'api-subscription-key': SARVAM_API_KEY,
            ...formData.getHeaders()
          },
          body: formData
        });
  
        if (!sarvamResponse.ok) {
          const errorText = await sarvamResponse.text();
          console.error("Sarvam API error:", sarvamResponse.status, errorText);
          throw new Error(`Sarvam API error: ${sarvamResponse.status} - ${errorText}`);
        }
  
        const sarvamData = await sarvamResponse.json();
        console.log("Sarvam API response:", sarvamData);
  
        // Extract transcription from Sarvam response
        transcription = sarvamData.transcript || sarvamData.text || "";
        
        if (!transcription || transcription.trim() === "") {
          return res.status(400).json({ 
            message: "Could not transcribe audio. Please try speaking more clearly.",
            error: "TRANSCRIPTION_FAILED"
          });
        }
  
        console.log("Transcribed text:", transcription);
  
      } catch (sarvamError) {
        console.error("Speech-to-text error:", sarvamError);
        return res.status(500).json({ 
          message: "Failed to process audio. Please try again.",
          error: "STT_ERROR",
          details: sarvamError.message
        });
      }
  
      // Step 2: Process transcribed text through existing AI assistant (same as /ai/chat)
      try {
        // Get conversation history
        let conversation = null;
        if (conversationId) {
          conversation = await storage.getConversation(DEFAULT_MERCHANT_ID, context);
        }
  
        // Get merchant data for context
        const merchant = await storage.getMerchant(DEFAULT_MERCHANT_ID);
        
        const response = await aiAssistant.processMessage(transcription, {
          context,
          merchantData: merchant,
          conversationHistory: conversation?.messages || []
        });
  
        // Get OpenAI response (same as /ai/chat)
        const output = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that provides short, concise, human-like responses in proper simple sentences."
            },
            {
              role: "user",
              content: `Question: ${transcription}\n\nSource Data: ${fs.readFileSync('output.txt', 'utf8')}`
            }
          ],
          temperature: 0.7,
          max_tokens: 1500
        });
  
        // Extract the response (same as /ai/chat)
        const result = output.choices[0].message.content;
  
        // Handle browser automation response (same as /ai/chat)
        if (response.needsRealTimeData && response.browserTaskId) {
          // Return immediate response with task ID for polling
          res.json({
            ...response,
            transcription, // Only difference: include transcription
            polling: true,
            taskId: response.browserTaskId,
            message: result // Use the OpenAI result, not the output object
          });
          return;
        }
  
        // Update conversation for regular responses (same as /ai/chat)
        if (conversation) {
          const updatedMessages = [
            ...(conversation.messages || []),
            { role: "user" as const, content: transcription, timestamp: new Date().toISOString() },
            { role: "assistant" as const, content: response.message, timestamp: new Date().toISOString() }
          ];
          
          await storage.updateConversation(conversation.id, {
            messages: updatedMessages
          });
        } else {
          // Create new conversation
          await storage.createConversation({
            merchantId: DEFAULT_MERCHANT_ID,
            context,
            messages: [
              { role: "user", content: transcription, timestamp: new Date().toISOString() },
              { role: "assistant", content: response.message, timestamp: new Date().toISOString() }
            ]
          });
        }
  
        // Return response with transcription (same structure as /ai/chat but with transcription)
        res.json({
          ...response,
          transcription // Only difference: include transcription
        });
  
      } catch (aiError) {
        console.error("AI processing error:", aiError);
        return res.status(500).json({ 
          message: "Failed to process your request. Please try again.",
          error: "AI_PROCESSING_ERROR",
          transcription // Still return transcription even if AI fails
        });
      }
  
    } catch (error) {
      console.error("Voice chat error:", error);
      res.status(500).json({ 
        message: "Failed to process voice message",
        error: "GENERAL_ERROR",
        details: error.message
      });
    }
  });

  // Poll browser task status for AI
  app.get("/api/ai/chat/poll/:taskId", async (req, res) => {
    try {
      const { taskId } = req.params;
      const { message, context, conversationId } = req.query;
      
      if (!taskId || !message || !context) {
        return res.status(400).json({ message: "Task ID, message, and context are required" });
      }

      const task = browserService.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      if (task.status === 'pending' || task.status === 'running') {
        return res.json({
          status: 'processing',
          message: task.status === 'running' 
            ? "Still gathering data from your platforms..." 
            : "Task is queued for processing...",
          taskStatus: task.status
        });
      }

      if (task.status === 'failed') {
        return res.json({
          status: 'error',
          message: "I encountered an issue while fetching the latest data. Let me help you with the information I have available.",
          error: task.error
        });
      }

      // Task completed - process with real-time data
      const merchant = await storage.getMerchant(DEFAULT_MERCHANT_ID);
      let conversation = null;
      
      if (conversationId) {
        conversation = await storage.getConversation(DEFAULT_MERCHANT_ID, context as string);
      }

      const response = await aiAssistant.processWithRealTimeData(
        message as string, 
        {
          context: context as string,
          merchantData: merchant,
          conversationHistory: conversation?.messages || []
        },
        taskId
      );

      // Update conversation with both user message and AI response
      if (conversation) {
        const updatedMessages = [
          ...(conversation.messages || []),
          { role: "user" as const, content: message as string, timestamp: new Date().toISOString() },
          { role: "assistant" as const, content: response.message, timestamp: new Date().toISOString() }
        ];
        
        await storage.updateConversation(conversation.id, {
          messages: updatedMessages
        });
      } else {
        // Create new conversation
        await storage.createConversation({
          merchantId: DEFAULT_MERCHANT_ID,
          context: context as string,
          messages: [
            { role: "user", content: message as string, timestamp: new Date().toISOString() },
            { role: "assistant", content: response.message, timestamp: new Date().toISOString() }
          ]
        });
      }

      res.json({
        status: 'completed',
        ...response
      });

    } catch (error) {
      console.error("AI polling error:", error);
      res.status(500).json({ message: "Failed to process AI request" });
    }
  });

  // Handle completed browser task for AI
  app.post("/api/ai/chat/complete", async (req, res) => {
    try {
      const { taskId, originalMessage, context, conversationId } = req.body;
      
      if (!taskId || !originalMessage || !context) {
        return res.status(400).json({ message: "Task ID, original message, and context are required" });
      }

      const merchant = await storage.getMerchant(DEFAULT_MERCHANT_ID);
      let conversation = null;
      
      if (conversationId) {
        conversation = await storage.getConversation(DEFAULT_MERCHANT_ID, context);
      }

      const response = await aiAssistant.handleBrowserTaskCompletion(
        taskId,
        originalMessage,
        {
          context,
          merchantData: merchant,
          conversationHistory: conversation?.messages || []
        }
      );

      // Update conversation
      if (conversation) {
        const updatedMessages = [
          ...(conversation.messages || []),
          { role: "user" as const, content: originalMessage, timestamp: new Date().toISOString() },
          { role: "assistant" as const, content: response.message, timestamp: new Date().toISOString() }
        ];
        
        await storage.updateConversation(conversation.id, {
          messages: updatedMessages
        });
      } else {
        // Create new conversation
        await storage.createConversation({
          merchantId: DEFAULT_MERCHANT_ID,
          context,
          messages: [
            { role: "user", content: originalMessage, timestamp: new Date().toISOString() },
            { role: "assistant", content: response.message, timestamp: new Date().toISOString() }
          ]
        });
      }

      res.json(response);
    } catch (error) {
      console.error("AI completion error:", error);
      res.status(500).json({ message: "Failed to complete AI request" });
    }
  });

  // Get AI insights with real-time data
  app.get("/api/ai/insights", async (req, res) => {
    try {
      const { context } = req.query;
      
      // Get relevant stored data based on context
      let storedData;
      switch (context) {
        case "analytics":
          storedData = await storage.getAnalyticsByMerchant(DEFAULT_MERCHANT_ID, 30);
          break;
        case "offers":
          storedData = await storage.getActiveOffers(DEFAULT_MERCHANT_ID);
          break;
        case "campaigns":
          storedData = await storage.getActiveCampaigns(DEFAULT_MERCHANT_ID);
          break;
        default:
          storedData = await storage.getAnalyticsByMerchant(DEFAULT_MERCHANT_ID, 7);
      }

      // Try to get real-time data to enhance insights
      let enhancedData = storedData;
      // try {
      //   const platforms = await storage.getPlatformsByMerchant(DEFAULT_MERCHANT_ID);
      //   const connectedPlatforms = platforms.filter(p => p.isConnected);
        
      //   if (connectedPlatforms.length > 0) {
      //     // Get real-time data for better insights
      //     const platformNames = connectedPlatforms.map(p => p.name);
      //     const browserTaskId = await browserService.executeTask(
      //       `Extract comprehensive business insights data from ${platformNames.join(', ')} platforms for analytics and insights generation.`,
      //       {
      //         merchantId: DEFAULT_MERCHANT_ID,
      //         platforms: platformNames,
      //         dataTypes: ['analytics', 'orders', 'ratings', 'dashboard'],
      //         action: 'extract_insights_data'
      //       }
      //     );

      //     // Wait for task completion (with timeout)
      //     const taskCompleted = await aiAssistant.waitForBrowserTask(browserTaskId, 15000);
          
      //     if (taskCompleted) {
      //       const task = browserService.getTask(browserTaskId);
      //       if (task && task.result) {
      //         const realTimeData = JSON.parse(task.result);
      //         enhancedData = { stored: storedData, realTime: realTimeData };
      //       }
      //     }
      //   }
      // } catch (error) {
      //   console.log("Could not fetch real-time data for insights:", error.message);
      //   // Continue with stored data only
      // }

      const insights = await aiAssistant.generateInsights(enhancedData, context as string || "general");
      res.json(insights);
    } catch (error) {
      console.error("AI insights error:", error);
      res.status(500).json({ message: "Failed to generate insights" });
    }
  });

  // Get conversation history
  app.get("/api/conversations/:context", async (req, res) => {
    try {
      const { context } = req.params;
      const conversation = await storage.getConversation(DEFAULT_MERCHANT_ID, context);
      res.json(conversation || { messages: [] });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  // Browser task status endpoint
  app.get("/api/browser/tasks/:taskId", async (req, res) => {
    try {
      const { taskId } = req.params;
      const task = browserService.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.json({
        id: task.id,
        status: task.status,
        startTime: task.startTime,
        endTime: task.endTime,
        error: task.error,
        hasResult: !!task.result
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task status" });
    }
  });

  // Get all browser tasks
  app.get("/api/browser/tasks", async (req, res) => {
    try {
      const tasks = browserService.getAllTasks();
      res.json(tasks.map(task => ({
        id: task.id,
        task: task.task.substring(0, 100) + (task.task.length > 100 ? '...' : ''),
        status: task.status,
        startTime: task.startTime,
        endTime: task.endTime,
        error: task.error
      })));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  // Alerts and Notifications
  app.get("/api/alerts", async (req, res) => {
    try {
      // Mock alerts for demo - in production, this would come from a real alert system
      const alerts = [
        {
          id: "revenue-drop-1",
          type: "critical",
          title: "Significant Revenue Drop Detected",
          message: "Revenue dropped by 22.5% compared to yesterday (₹9,650 vs ₹12,450)",
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          platform: "all",
          isRead: false,
          actionRequired: true
        },
        {
          id: "rating-alert-1",
          type: "warning",
          title: "Rating Drop Alert",
          message: "Your Swiggy rating dropped from 4.6 to 4.3 in the last 24 hours. Check recent reviews.",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          platform: "swiggy",
          isRead: false,
          actionRequired: true
        },
        {
          id: "delay-alert-1",
          type: "warning", 
          title: "Order Delays Detected",
          message: "Average delivery time increased to 45 minutes on Zomato. Consider optimizing kitchen operations.",
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          platform: "zomato",
          isRead: true,
          actionRequired: false
        },
        {
          id: "connection-alert-1",
          type: "info",
          title: "Platform Sync Completed",
          message: "Successfully reconnected to Magicpin after temporary connection issue.",
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          platform: "magicpin",
          isRead: true,
          actionRequired: false
        }
      ];
      
      res.json(alerts);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/alerts/:id/read", async (req, res) => {
    try {
      // Mock implementation - in production, would update alert status in database
      res.json({ success: true, message: "Alert marked as read" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/notifications/settings", async (req, res) => {
    try {
      const settings = req.body;
      // Mock implementation - in production, would save to database
      console.log("Notification settings saved:", settings);
      res.json({ success: true, message: "Notification settings saved successfully" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/notifications/test", async (req, res) => {
    try {
      const { type, recipient } = req.body;
      
      if (type === "email" && recipient) {
        // Mock email test - in production, would use SendGrid
        console.log(`Test email would be sent to: ${recipient}`);
        res.json({ success: true, message: "Test email sent successfully" });
      } else if (type === "telegram" && recipient) {
        // Mock Telegram test - in production, would use Telegram Bot API
        console.log(`Test Telegram message would be sent to chat ID: ${recipient}`);
        res.json({ success: true, message: "Test Telegram message sent successfully" });
      } else {
        res.status(400).json({ error: "Invalid notification type or missing recipient" });
      }
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Platform Actions with Browser Automation
  app.post("/api/platforms/action", async (req, res) => {
    try {
      const { platformName, action } = req.body;
      
      if (!platformName || !action) {
        return res.status(400).json({ message: "Platform name and action are required" });
      }

      // Use browser automation to execute the action
      const browserTaskId = await browserService.executePlatformAction(platformName, action.type, action.data);
      
      // Wait for task completion with shorter timeout for actions
      const taskCompleted = await aiAssistant.waitForBrowserTask(browserTaskId, 20000);
      
      if (!taskCompleted) {
        return res.json({
          success: false,
          message: `Action initiated but taking longer than expected. Task ID: ${browserTaskId}`,
          taskId: browserTaskId,
          polling: true
        });
      }

      const task = browserService.getTask(browserTaskId);
      
      if (task?.status === 'completed') {
        res.json({
          success: true,
          message: `Action executed successfully on ${platformName}`,
          result: task.result,
          timestamp: new Date().toISOString()
        });
      } else {
        res.json({
          success: false,
          message: `Failed to execute action on ${platformName}`,
          error: task?.error,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error: any) {
      console.error("Platform action error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Poll platform action status
  app.get("/api/platforms/action/poll/:taskId", async (req, res) => {
    try {
      const { taskId } = req.params;
      const task = browserService.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      if (task.status === 'pending' || task.status === 'running') {
        return res.json({
          status: 'processing',
          message: "Action is being executed...",
          taskStatus: task.status
        });
      }

      if (task.status === 'completed') {
        return res.json({
          status: 'completed',
          success: true,
          message: "Action executed successfully",
          result: task.result,
          timestamp: new Date().toISOString()
        });
      }

      if (task.status === 'failed') {
        return res.json({
          status: 'failed',
          success: false,
          message: "Action failed to execute",
          error: task.error,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error("Platform action polling error:", error);
      res.status(500).json({ message: "Failed to check action status" });
    }
  });

  // Database test endpoint
  app.get("/api/db-test", async (req, res) => {
    try {
      const merchant = await storage.getMerchant(1);
      if (merchant) {
        res.json({ 
          message: "Database connected successfully!", 
          merchant: merchant.name 
        });
      } else {
        res.json({ 
          message: "Database connected but no data found. Use /api/seed to add sample data." 
        });
      }
    } catch (error) {
      res.status(500).json({ 
        error: "Database connection failed", 
        details: error.message 
      });
    }
  });

  // Seed database endpoint
  app.post("/api/seed", async (req, res) => {
    try {
      const { seedDatabase } = await import("./seed");
      await seedDatabase();
      res.json({ message: "Database seeded successfully!" });
    } catch (error) {
      res.status(500).json({ 
        error: "Seeding failed", 
        details: error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
