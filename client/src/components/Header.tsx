import { useQuery } from "@tanstack/react-query";
import { Bell, Store, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Header() {
  const { data: merchant } = useQuery({
    queryKey: ["/api/merchant"],
  });

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
            <img
            src="/assets/logo-img.png" 
            alt="Plattr Logo" 
            className="w-8 h-8 rounded-md flex items-center justify-center"
             />
              <h1 className="text-xl font-semibold text-gray-900">Plattr</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-gray-400 hover:text-gray-500 transition-colors">
              <Bell className="w-5 h-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-red-500 text-white text-xs flex items-center justify-center">
                3
              </Badge>
            </button>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">
                {merchant?.name || "Loading..."}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
