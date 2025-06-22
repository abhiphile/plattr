import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ChatInterface from "@/components/ChatInterface";
import { Clock, Eye, Utensils, Pizza } from "lucide-react";

export default function OffersTab() {
  const { data: offers } = useQuery({
    queryKey: ["/api/offers", { active: true }],
  });

  const getTimeLeft = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} left`;
    return `${hours} hour${hours > 1 ? 's' : ''} left`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* AI Assistant Chat */}
      <div className="lg:col-span-2">
        <Card className="h-[600px]">
          <CardContent className="p-0 h-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Offers Assistant</h3>
            </div>
            <ChatInterface 
              context="offers"
              placeholder="e.g., Create a 20% discount for weekends"
              className="h-[calc(100%-80px)]"
            />
          </CardContent>
        </Card>
      </div>

      {/* Active Offers */}
      <div>
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Offers</h3>
            
            <div className="space-y-4">
              {offers?.map((offer: any) => {
                const timeLeft = getTimeLeft(offer.endDate);
                const isEndingSoon = timeLeft.includes("hour") || timeLeft === "Expired";
                
                return (
                  <div key={offer.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{offer.title}</h4>
                      <Badge 
                        variant={offer.isActive ? "default" : "secondary"}
                        className={offer.isActive ? "bg-green-600" : ""}
                      >
                        {offer.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{offer.description}</p>
                    
                    <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
                      <Clock className="w-3 h-3" />
                      <span className={isEndingSoon ? "text-orange-600 font-medium" : ""}>
                        {timeLeft}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {offer.platforms?.map((platform: string) => (
                        <Badge 
                          key={platform}
                          variant="outline"
                          className="text-xs"
                        >
                          {platform === "swiggy" && <Utensils className="w-3 h-3 mr-1" />}
                          {platform === "zomato" && <Pizza className="w-3 h-3 mr-1" />}
                          {platform}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {(!offers || offers.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <p>No active offers found.</p>
                  <p className="text-sm">Use the assistant to create your first offer!</p>
                </div>
              )}
            </div>
            
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => {/* TODO: Navigate to all offers view */}}
            >
              <Eye className="w-4 h-4 mr-2" />
              View All Offers
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
