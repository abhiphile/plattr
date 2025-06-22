import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertTriangle, 
  Bell, 
  BellOff,
  Mail, 
  MessageSquare,
  TrendingDown,
  Star,
  Clock,
  DollarSign,
  Settings,
  X,
  CheckCircle
} from "lucide-react";

interface Alert {
  id: string;
  type: "critical" | "warning" | "info";
  title: string;
  message: string;
  timestamp: string;
  platform?: string;
  isRead: boolean;
  actionRequired: boolean;
}

interface NotificationSettings {
  emailEnabled: boolean;
  telegramEnabled: boolean;
  emailAddress: string;
  telegramChatId: string;
  alertThresholds: {
    revenueDropPercent: number;
    ratingDropPoints: number;
    orderDelayMinutes: number;
    lowStockItems: number;
  };
}

export default function AlertMonitor() {
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    emailEnabled: true,
    telegramEnabled: false,
    emailAddress: "",
    telegramChatId: "",
    alertThresholds: {
      revenueDropPercent: 20,
      ratingDropPoints: 0.3,
      orderDelayMinutes: 30,
      lowStockItems: 5
    }
  });
  const { toast } = useToast();

  const { data: alerts } = useQuery({
    queryKey: ["/api/alerts"],
    refetchInterval: 30000, // Check every 30 seconds
  });

  const { data: analytics } = useQuery({
    queryKey: ["/api/analytics", { platform: "all", days: 1 }],
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: NotificationSettings) => {
      await apiRequest("POST", "/api/notifications/settings", newSettings);
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "Notification settings have been updated successfully.",
      });
      setShowSettings(false);
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Failed to save notification settings.",
        variant: "destructive",
      });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (alertId: string) => {
      await apiRequest("PUT", `/api/alerts/${alertId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
    }
  });

  const testNotificationMutation = useMutation({
    mutationFn: async (type: "email" | "telegram") => {
      await apiRequest("POST", "/api/notifications/test", { 
        type, 
        recipient: type === "email" ? settings.emailAddress : settings.telegramChatId 
      });
    },
    onSuccess: (_, type) => {
      toast({
        title: "Test Notification Sent",
        description: `Test ${type} notification has been sent successfully.`,
      });
    },
    onError: (_, type) => {
      toast({
        title: "Test Failed",
        description: `Failed to send test ${type} notification. Please check your settings.`,
        variant: "destructive",
      });
    },
  });

  // Mock alerts based on analytics data (in real app, this would come from API)
  const generateMockAlerts = (): Alert[] => {
    const mockAlerts: Alert[] = [];
    const now = new Date();

    // Check revenue drop
    if (analytics && analytics.length >= 2) {
      const today = analytics[analytics.length - 1];
      const yesterday = analytics[analytics.length - 2];
      const todayRevenue = parseFloat(today.revenue || "0");
      const yesterdayRevenue = parseFloat(yesterday.revenue || "0");
      
      if (yesterdayRevenue > 0) {
        const dropPercent = ((yesterdayRevenue - todayRevenue) / yesterdayRevenue) * 100;
        if (dropPercent > settings.alertThresholds.revenueDropPercent) {
          mockAlerts.push({
            id: "revenue-drop-1",
            type: "critical",
            title: "Significant Revenue Drop Detected",
            message: `Revenue dropped by ${dropPercent.toFixed(1)}% compared to yesterday (₹${todayRevenue.toLocaleString()} vs ₹${yesterdayRevenue.toLocaleString()})`,
            timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
            platform: "all",
            isRead: false,
            actionRequired: true
          });
        }
      }
    }

    // Rating alert
    mockAlerts.push({
      id: "rating-alert-1",
      type: "warning",
      title: "Rating Drop Alert",
      message: "Your Swiggy rating dropped from 4.6 to 4.3 in the last 24 hours. Check recent reviews.",
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      platform: "swiggy",
      isRead: false,
      actionRequired: true
    });

    // Order delay alert
    mockAlerts.push({
      id: "delay-alert-1", 
      type: "warning",
      title: "Order Delays Detected",
      message: "Average delivery time increased to 45 minutes on Zomato. Consider optimizing kitchen operations.",
      timestamp: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
      platform: "zomato",
      isRead: true,
      actionRequired: false
    });

    // Platform connection issue
    mockAlerts.push({
      id: "connection-alert-1",
      type: "info",
      title: "Platform Sync Completed",
      message: "Successfully reconnected to Magicpin after temporary connection issue.",
      timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
      platform: "magicpin", 
      isRead: true,
      actionRequired: false
    });

    return mockAlerts;
  };

  const currentAlerts = alerts || generateMockAlerts();
  const unreadCount = currentAlerts.filter(alert => !alert.isRead).length;
  const criticalCount = currentAlerts.filter(alert => alert.type === "critical" && !alert.isRead).length;

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "critical": return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case "warning": return <Clock className="w-4 h-4 text-yellow-600" />;
      case "info": return <CheckCircle className="w-4 h-4 text-blue-600" />;
      default: return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getAlertStyle = (type: string) => {
    switch (type) {
      case "critical": return "alert-critical";
      case "warning": return "alert-warning";
      case "info": return "alert-info";
      default: return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold text-gray-900">Alert Monitor</h3>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount} new
                </Badge>
              )}
              {criticalCount > 0 && (
                <Badge className="bg-red-600 text-xs animate-pulse">
                  {criticalCount} critical
                </Badge>
              )}
            </div>
            
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Notification Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center space-x-2">
                        <Mail className="w-4 h-4" />
                        <span>Email Notifications</span>
                      </Label>
                      <Switch
                        checked={settings.emailEnabled}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, emailEnabled: checked }))
                        }
                      />
                    </div>
                    {settings.emailEnabled && (
                      <div className="space-y-2">
                        <Input
                          placeholder="Email address"
                          value={settings.emailAddress}
                          onChange={(e) => 
                            setSettings(prev => ({ ...prev, emailAddress: e.target.value }))
                          }
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testNotificationMutation.mutate("email")}
                          disabled={!settings.emailAddress || testNotificationMutation.isPending}
                        >
                          Test Email
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4" />
                        <span>Telegram Notifications</span>
                      </Label>
                      <Switch
                        checked={settings.telegramEnabled}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, telegramEnabled: checked }))
                        }
                      />
                    </div>
                    {settings.telegramEnabled && (
                      <div className="space-y-2">
                        <Input
                          placeholder="Telegram Chat ID"
                          value={settings.telegramChatId}
                          onChange={(e) => 
                            setSettings(prev => ({ ...prev, telegramChatId: e.target.value }))
                          }
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testNotificationMutation.mutate("telegram")}
                          disabled={!settings.telegramChatId || testNotificationMutation.isPending}
                        >
                          Test Telegram
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label>Alert Thresholds</Label>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <Label>Revenue Drop %</Label>
                        <Input
                          type="number"
                          value={settings.alertThresholds.revenueDropPercent}
                          onChange={(e) => 
                            setSettings(prev => ({
                              ...prev,
                              alertThresholds: {
                                ...prev.alertThresholds,
                                revenueDropPercent: Number(e.target.value)
                              }
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label>Rating Drop</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={settings.alertThresholds.ratingDropPoints}
                          onChange={(e) => 
                            setSettings(prev => ({
                              ...prev,
                              alertThresholds: {
                                ...prev.alertThresholds,
                                ratingDropPoints: Number(e.target.value)
                              }
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => saveSettingsMutation.mutate(settings)}
                    disabled={saveSettingsMutation.isPending}
                    className="w-full"
                  >
                    Save Settings
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {currentAlerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p>All good! No active alerts.</p>
              </div>
            ) : (
              currentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`
                    p-3 rounded-lg border transition-all
                    ${getAlertStyle(alert.type)}
                    ${!alert.isRead ? "shadow-sm" : "opacity-75"}
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="mt-0.5">
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="text-sm font-medium truncate">{alert.title}</p>
                          {!alert.isRead && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                          )}
                        </div>
                        <p className="text-xs text-current opacity-80 mb-2">{alert.message}</p>
                        <div className="flex items-center space-x-3 text-xs opacity-60">
                          <span>{new Date(alert.timestamp).toLocaleString()}</span>
                          {alert.platform && (
                            <Badge variant="outline" className="text-xs py-0">
                              {alert.platform}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {!alert.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsReadMutation.mutate(alert.id)}
                        className="ml-2 h-6 w-6 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  {alert.actionRequired && !alert.isRead && (
                    <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                      <Button size="sm" variant="outline" className="text-xs">
                        Take Action
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}