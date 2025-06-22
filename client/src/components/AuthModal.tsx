import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, X } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  platformName: string;
  onClose: () => void;
}

export default function AuthModal({ isOpen, platformName, onClose }: AuthModalProps) {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const { toast } = useToast();

  const connectMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/platforms/connect", {
        platformName,
        credentials
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platforms"] });
      toast({
        title: "Platform Connected",
        description: `Successfully connected to ${platformName}`,
      });
      setCredentials({ username: "", password: "" });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || `Failed to connect to ${platformName}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentials.username || !credentials.password) {
      toast({
        title: "Missing Information",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }
    connectMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Connect to {platformName}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username/Email</Label>
            <Input
              id="username"
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
              placeholder="Enter your username or email"
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Enter your password"
              className="w-full"
            />
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <Shield className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Security Notice</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Your credentials are encrypted and stored securely. We only use them to perform actions on your behalf.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={onClose}
              disabled={connectMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={connectMutation.isPending}
            >
              {connectMutation.isPending ? "Connecting..." : "Connect"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
