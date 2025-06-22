import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  RefreshCw, 
  Unlink,
  Link,
  Utensils,
  Pizza,
  Wand2,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

interface PlatformsTabProps {
  onConnect: (platformName: string) => void;
}

export default function PlatformsTab({ onConnect }: PlatformsTabProps) {
  const { toast } = useToast();

  const { data: platforms, isLoading } = useQuery({
    queryKey: ["/api/platforms"],
  });

  const refreshMutation = useMutation({
    mutationFn: async (platformName: string) => {
      await apiRequest("POST", "/api/platforms/refresh", { platformName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platforms"] });
      toast({
        title: "Connection Refreshed",
        description: "Platform connection has been refreshed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh platform connection.",
        variant: "destructive",
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (platformName: string) => {
      await apiRequest("POST", "/api/platforms/disconnect", { platformName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platforms"] });
      toast({
        title: "Platform Disconnected",
        description: "Platform has been disconnected successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Disconnect Failed",
        description: "Failed to disconnect platform.",
        variant: "destructive",
      });
    },
  });

  const platformConfig = {
    swiggy: {
      name: "Swiggy",
      description: "Food Delivery",
      icon: Utensils,
      color: "bg-red-500"
    },
    zomato: {
      name: "Zomato", 
      description: "Food Delivery",
      icon: Pizza,
      color: "bg-red-600"
    },
    magicpin: {
      name: "Magicpin",
      description: "Local Discovery", 
      icon: Wand2,
      color: "bg-purple-500"
    }
  };

  const connectionHistory = [
    // {
    //   action: "Swiggy connection refreshed",
    //   time: "2 minutes ago",
    //   status: "success"
    // },
    // {
    //   action: "Zomato credentials updated",
    //   time: "1 hour ago", 
    //   status: "success"
    // },
    // {
    //   action: "Magicpin connection failed",
    //   time: "2 days ago",
    //   status: "error"
    // }
  ];

  if (isLoading) {
    return <div>Loading platforms...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Platform Connections */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Connections</h3>
          <p className="text-gray-600 mb-6">
            Connect your restaurant to delivery platforms to manage all operations from one place.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {platforms?.map((platform: any) => {
              const config = platformConfig[platform.name as keyof typeof platformConfig];
              if (!config) return null;
              
              const Icon = config.icon;
              const isConnected = platform.isConnected;
              const lastSync = platform.lastSync 
                ? new Date(platform.lastSync).toLocaleString() 
                : "Never connected";

              return (
                <div key={platform.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 ${config.color} rounded-lg flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{config.name}</h4>
                        <p className="text-sm text-gray-500">{config.description}</p>
                      </div>
                    </div>
                    <Badge 
                      variant={isConnected ? "default" : "secondary"}
                      className={isConnected ? "bg-green-600" : "bg-gray-400"}
                    >
                      {isConnected ? "Connected" : "Disconnected"}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    Last sync: {isConnected ? lastSync : "Never connected"}
                  </p>
                  
                  <div className="space-y-2">
                    {isConnected ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => refreshMutation.mutate(platform.name)}
                          disabled={refreshMutation.isPending}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Refresh Connection
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-red-600 border-red-300 hover:bg-red-50"
                          onClick={() => disconnectMutation.mutate(platform.name)}
                          disabled={disconnectMutation.isPending}
                        >
                          <Unlink className="w-4 h-4 mr-2" />
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => onConnect(platform.name)}
                      >
                        <Link className="w-4 h-4 mr-2" />
                        Connect Platform
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Connection History */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Connection Activity</h3>
          <div className="space-y-4">
            {connectionHistory.map((item, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center
                    ${item.status === "success" ? "bg-green-100" : "bg-red-100"}
                  `}>
                    {item.status === "success" ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{item.action}</p>
                    <p className="text-sm text-gray-500">{item.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
