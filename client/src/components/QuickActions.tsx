import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Power, 
  Clock, 
  MapPin, 
  Volume2, 
  VolumeX,
  ShieldCheck,
  Utensils,
  Pizza,
  Wand2,
  Calendar
} from "lucide-react";

interface QuickActionsProps {
  platforms: any[];
  merchant: any;
}

export default function QuickActions({ platforms, merchant }: QuickActionsProps) {
  const [statusStates, setStatusStates] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const platformConfig = {
    swiggy: { name: "Swiggy", icon: Utensils, color: "bg-red-500" },
    zomato: { name: "Zomato", icon: Pizza, color: "bg-red-600" },
    magicpin: { name: "Magicpin", icon: Wand2, color: "bg-purple-500" }
  };

  const platformActionMutation = useMutation({
    mutationFn: async ({ platform, action, data }: { platform: string; action: string; data?: any }) => {
      await apiRequest("POST", "/api/platforms/action", {
        platformName: platform,
        action: { type: action, data }
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/platforms"] });
      toast({
        title: "Action Completed",
        description: `Successfully executed ${variables.action} on ${variables.platform}`,
      });
    },
    onError: (_, variables) => {
      toast({
        title: "Action Failed",
        description: `Failed to execute ${variables.action} on ${variables.platform}`,
        variant: "destructive",
      });
    },
  });

  const toggleRestaurantStatus = (platformName: string, isOnline: boolean) => {
    setStatusStates(prev => ({ ...prev, [platformName]: !isOnline }));
    platformActionMutation.mutate({
      platform: platformName,
      action: "toggle_status",
      data: { status: isOnline ? "offline" : "online" }
    });
  };

  const updateTimings = (platformName: string, type: "close_early" | "extend_hours") => {
    const action = type === "close_early" ? "Close 2 hours early today" : "Extend hours by 2 hours";
    platformActionMutation.mutate({
      platform: platformName,
      action: "update_timing",
      data: { type, description: action }
    });
  };

  const enableHolidayMode = () => {
    const connectedPlatforms = platforms.filter(p => p.isConnected);
    connectedPlatforms.forEach(platform => {
      platformActionMutation.mutate({
        platform: platform.name,
        action: "toggle_status",
        data: { status: "holiday", duration: "24h" }
      });
    });
  };

  return (
    <div className="space-y-6">
      {/* Platform Quick Controls */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Restaurant Status</h3>
          <div className="space-y-4">
            {platforms?.map((platform) => {
              const config = platformConfig[platform.name as keyof typeof platformConfig];
              if (!config || !platform.isConnected) return null;

              const Icon = config.icon;
              const isOnline = statusStates[platform.name] ?? true;

              return (
                <div 
                  key={platform.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 ${config.color} rounded flex items-center justify-center`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">{config.name}</span>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className={`w-2 h-2 rounded-full ${isOnline ? 'status-online' : 'status-offline'}`}></div>
                        <span className="text-sm text-gray-500">
                          {isOnline ? "Online" : "Offline"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={isOnline}
                    onCheckedChange={() => toggleRestaurantStatus(platform.name, isOnline)}
                    disabled={platformActionMutation.isPending}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Grid */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="quick-action-btn flex-col space-y-2 h-20"
              onClick={() => updateTimings("all", "close_early")}
              disabled={platformActionMutation.isPending}
            >
              <Clock className="w-5 h-5 text-orange-600" />
              <span className="text-xs font-medium text-center">Close Early</span>
            </Button>

            <Button
              variant="outline"
              className="quick-action-btn flex-col space-y-2 h-20"
              onClick={() => updateTimings("all", "extend_hours")}
              disabled={platformActionMutation.isPending}
            >
              <Clock className="w-5 h-5 text-green-600" />
              <span className="text-xs font-medium text-center">Extend Hours</span>
            </Button>

            <Button
              variant="outline"
              className="quick-action-btn flex-col space-y-2 h-20"
              onClick={enableHolidayMode}
              disabled={platformActionMutation.isPending}
            >
              <Calendar className="w-5 h-5 text-purple-600" />
              <span className="text-xs font-medium text-center">Holiday Mode</span>
            </Button>

            <Button
              variant="outline"
              className="quick-action-btn flex-col space-y-2 h-20"
              onClick={() => platformActionMutation.mutate({
                platform: "all",
                action: "update_delivery_area",
                data: { action: "expand", radius: 7 }
              })}
              disabled={platformActionMutation.isPending}
            >
              <MapPin className="w-5 h-5 text-blue-600" />
              <span className="text-xs font-medium text-center">Expand Area</span>
            </Button>

            <Button
              variant="outline"
              className="quick-action-btn flex-col space-y-2 h-20"
              onClick={() => platformActionMutation.mutate({
                platform: "all",
                action: "emergency_mode",
                data: { reason: "technical_issues" }
              })}
              disabled={platformActionMutation.isPending}
            >
              <ShieldCheck className="w-5 h-5 text-red-600" />
              <span className="text-xs font-medium text-center">Emergency</span>
            </Button>

            <Button
              variant="outline"
              className="quick-action-btn flex-col space-y-2 h-20"
              onClick={() => platformActionMutation.mutate({
                platform: "all",
                action: "bulk_update",
                data: { type: "menu_availability" }
              })}
              disabled={platformActionMutation.isPending}
            >
              <Utensils className="w-5 h-5 text-gray-600" />
              <span className="text-xs font-medium text-center">Update Menu</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Actions */}
      {/* <Card className="border-red-200">
        <CardContent className="p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Emergency Controls</h3>
          <p className="text-sm text-red-600 mb-4">
            Use these controls only in emergency situations
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => {
                platforms.filter(p => p.isConnected).forEach(platform => {
                  platformActionMutation.mutate({
                    platform: platform.name,
                    action: "emergency_shutdown",
                    data: { reason: "manual_emergency" }
                  });
                });
              }}
              disabled={platformActionMutation.isPending}
            >
              <Power className="w-4 h-4 mr-2" />
              Emergency Shutdown
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
              onClick={() => {
                platforms.filter(p => p.isConnected).forEach(platform => {
                  platformActionMutation.mutate({
                    platform: platform.name,
                    action: "pause_orders",
                    data: { duration: "1h", reason: "kitchen_issue" }
                  });
                });
              }}
              disabled={platformActionMutation.isPending}
            >
              <VolumeX className="w-4 h-4 mr-2" />
              Pause Orders (1h)
            </Button>
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
}