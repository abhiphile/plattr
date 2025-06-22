import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import ChatInterface from "@/components/ChatInterface";
import { 
  Lightbulb, 
  RotateCcw, 
  Calendar,
  TrendingUp,
  Edit,
  StopCircle,
  Plus,
  X
} from "lucide-react";

export default function PromotionsTab() {
  const { toast } = useToast();

  const { data: campaigns } = useQuery({
    queryKey: ["/api/campaigns", { active: true }],
  });

  const updateCampaignMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      await apiRequest("PUT", `/api/campaigns/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({
        title: "Campaign Updated",
        description: "Campaign has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update campaign.",
        variant: "destructive",
      });
    },
  });

  const stopCampaign = (campaignId: number) => {
    updateCampaignMutation.mutate({
      id: campaignId,
      updates: { status: "completed" }
    });
  };

  const cancelCampaign = (campaignId: number) => {
    updateCampaignMutation.mutate({
      id: campaignId,
      updates: { status: "cancelled" }
    });
  };

  const getTimeUntilStart = (startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    const diff = start.getTime() - now.getTime();
    
    if (diff <= 0) return "Started";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Campaign Assistant */}
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Assistant</h3>
            
            {/* AI Suggestion */}
            <div className="p-4 bg-blue-50 rounded-lg mb-6">
              <div className="flex items-start space-x-3">
                <Lightbulb className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">AI Suggestion</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Based on last year's data, running a "Holi Special" campaign could increase orders by 35%. Would you like me to create one?
                  </p>
                  <div className="flex space-x-2 mt-3">
                    <Button size="sm" className="text-xs">
                      Yes, Create It
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs">
                      Not Now
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Campaign Actions */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Quick Actions</h4>
              
              <Button
                variant="outline"
                className="w-full justify-start text-left h-auto p-3"
              >
                <RotateCcw className="w-4 h-4 mr-3 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">Repeat Last Campaign</p>
                  <p className="text-sm text-gray-500">Diwali Special - 25% off</p>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start text-left h-auto p-3"
              >
                <Calendar className="w-4 h-4 mr-3 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">Create Seasonal Campaign</p>
                  <p className="text-sm text-gray-500">AI-powered seasonal promotions</p>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start text-left h-auto p-3"
              >
                <TrendingUp className="w-4 h-4 mr-3 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">Competitor Analysis</p>
                  <p className="text-sm text-gray-500">See what competitors are doing</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Chat Interface */}
        {/* <Card className="h-64">
          <CardContent className="p-0 h-full">
            <div className="p-4 border-b border-gray-200">
              <h4 className="font-medium text-gray-900">Campaign Chat</h4>
            </div>
            <ChatInterface 
              context="promotions"
              placeholder="e.g., Create a weekend campaign"
              className="h-[calc(100%-60px)]"
            />
          </CardContent>
        </Card> */}
      </div>

      {/* Active Campaigns */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Campaigns</h3>
          
          <div className="space-y-4">
            {campaigns?.map((campaign: any) => {
              const isRunning = campaign.status === "running";
              const isScheduled = campaign.status === "scheduled";
              
              return (
                <div 
                  key={campaign.id}
                  className={`
                    border rounded-lg p-4
                    ${isRunning ? "border-green-200 bg-green-50" : 
                      isScheduled ? "border-orange-200 bg-orange-50" : 
                      "border-gray-200 bg-gray-50"}
                  `}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{campaign.title}</h4>
                    <Badge 
                      variant={isRunning ? "default" : isScheduled ? "secondary" : "outline"}
                      className={
                        isRunning ? "bg-green-600" : 
                        isScheduled ? "bg-orange-500" : ""
                      }
                    >
                      {campaign.status}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{campaign.description}</p>
                  
                  {isRunning && campaign.metrics && (
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-gray-500">Orders</p>
                        <p className="font-semibold text-gray-900">{campaign.metrics.orders || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Revenue</p>
                        <p className="font-semibold text-gray-900">
                          ₹{campaign.metrics.revenue?.toLocaleString() || 0}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {isScheduled && (
                    <div className="text-sm mb-3">
                      <p className="text-gray-500">Starts in</p>
                      <p className="font-semibold text-gray-900">
                        {getTimeUntilStart(campaign.startDate)}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      disabled={updateCampaignMutation.isPending}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                      onClick={() => isRunning ? stopCampaign(campaign.id) : cancelCampaign(campaign.id)}
                      disabled={updateCampaignMutation.isPending}
                    >
                      {isRunning ? (
                        <>
                          <StopCircle className="w-3 h-3 mr-1" />
                          Stop
                        </>
                      ) : (
                        <>
                          <X className="w-3 h-3 mr-1" />
                          Cancel
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
            
            {(!campaigns || campaigns.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <p>No active campaigns found.</p>
                <p className="text-sm">Use the assistant to create your first campaign!</p>
              </div>
            )}
          </div>
          
          <Button className="w-full mt-4">
            <Plus className="w-4 h-4 mr-2" />
            Create New Campaign
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
