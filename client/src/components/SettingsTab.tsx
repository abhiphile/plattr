import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ChatInterface from "@/components/ChatInterface";
import { 
  Clock, 
  ToggleLeft, 
  MapPin, 
  CalendarX, 
  DollarSign, 
  Users, 
  Bell, 
  Shield,
  Phone,
  Mail,
  Globe,
  Truck,
  ChefHat,
  Star,
  AlertTriangle,
  Settings,
  Eye,
  EyeOff
} from "lucide-react";

export default function SettingsTab() {
  const { data: merchant } = useQuery({
    queryKey: ["/api/merchant"],
  });

  const { data: platforms } = useQuery({
    queryKey: ["/api/platforms"],
  });

  const quickSettings = [
    {
      icon: Clock,
      label: "Update Timings",
      onClick: () => {/* TODO: Open timing modal */}
    },
    {
      icon: ToggleLeft,
      label: "Toggle Menu",
      onClick: () => {/* TODO: Toggle menu availability */}
    },
    {
      icon: MapPin,
      label: "Delivery Area",
      onClick: () => {/* TODO: Open delivery area modal */}
    },
    {
      icon: CalendarX,
      label: "Holiday Mode",
      onClick: () => {/* TODO: Enable holiday mode */}
    },
    {
      icon: DollarSign,
      label: "Pricing",
      onClick: () => {/* TODO: Open pricing settings */}
    },
    {
      icon: Bell,
      label: "Notifications",
      onClick: () => {/* TODO: Open notification settings */}
    }
  ];

  const storeTimings = merchant?.storeTimings || {
    weekdays: { open: "09:00", close: "22:00" },
    weekends: { open: "10:00", close: "23:00" }
  };

  const deliverySettings = merchant?.deliverySettings || {
    radius: 5,
    minimumOrder: 200,
    fee: 30
  };

  const storeInfo = merchant?.storeInfo || {
    name: "Warpspeed Test Merchant",
    phone: "+91 98765 43210",
    email: "orders@deliciousbites.com",
    address: "123 Food Street, Koramangala, Bangalore",
    cuisine: "Multi-Cuisine",
    rating: 4.2,
    totalOrders: 1250
  };

  const operationalSettings = merchant?.operationalSettings || {
    maxOrdersPerHour: 25,
    preparationTime: 30,
    autoAcceptOrders: true,
    holidayMode: false,
    menuVisible: true,
    acceptingOrders: true
  };

  const notificationSettings = merchant?.notificationSettings || {
    newOrders: true,
    lowStock: true,
    customerReviews: true,
    promotions: false
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Settings Assistant */}
      <div className="space-y-6">
        {/* <Card className="h-80">
          <CardContent className="p-0 h-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Settings Assistant</h3>
            </div>
            <ChatInterface 
              context="settings"
              placeholder="e.g., Update store timings for tomorrow"
              className="h-[calc(100%-80px)]"
            />
          </CardContent>
        </Card> */}

        {/* Quick Settings Actions */}
        <Card>
          <CardContent className="p-6">
            <h4 className="font-medium text-gray-900 mb-3">Quick Settings</h4>
            <div className="grid grid-cols-2 gap-3">
              {quickSettings.map((setting, index) => {
                const Icon = setting.icon;
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className="quick-action-btn flex-col space-y-1 h-16"
                    onClick={setting.onClick}
                  >
                    <Icon className="w-5 h-5 text-blue-600" />
                    <span className="text-xs font-medium text-gray-900">{setting.label}</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Store Information */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">Store Information</h4>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <ChefHat className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{storeInfo.name}</p>
                  <p className="text-xs text-gray-600">{storeInfo.cuisine}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-900">{storeInfo.phone}</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-900">{storeInfo.email}</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-900">{storeInfo.address}</span>
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium text-gray-900">{storeInfo.rating}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{storeInfo.totalOrders} orders</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operational Controls */}
        <Card>
          <CardContent className="p-6">
            <h4 className="font-medium text-gray-900 mb-4">Operational Controls</h4>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Eye className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Menu Visibility</p>
                    <p className="text-xs text-gray-600">Show menu to customers</p>
                  </div>
                </div>
                <div className={`w-10 h-6 rounded-full transition-colors ${operationalSettings.menuVisible ? 'bg-blue-600' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform mt-1 ${operationalSettings.menuVisible ? 'translate-x-5' : 'translate-x-1'}`}></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Truck className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Accept Orders</p>
                    <p className="text-xs text-gray-600">Automatically accept new orders</p>
                  </div>
                </div>
                <div className={`w-10 h-6 rounded-full transition-colors ${operationalSettings.acceptingOrders ? 'bg-green-600' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform mt-1 ${operationalSettings.acceptingOrders ? 'translate-x-5' : 'translate-x-1'}`}></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CalendarX className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Holiday Mode</p>
                    <p className="text-xs text-gray-600">Temporarily close store</p>
                  </div>
                </div>
                <div className={`w-10 h-6 rounded-full transition-colors ${operationalSettings.holidayMode ? 'bg-red-600' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform mt-1 ${operationalSettings.holidayMode ? 'translate-x-5' : 'translate-x-1'}`}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Settings */}
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Settings</h3>
            
            <div className="space-y-6">
              {/* Store Timings */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Store Timings</h4>
                  <Button variant="ghost" size="sm">
                    <Clock className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Monday - Friday</span>
                    <span className="text-sm font-medium text-gray-900">
                      {storeTimings.weekdays.open} - {storeTimings.weekdays.close}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Saturday - Sunday</span>
                    <span className="text-sm font-medium text-gray-900">
                      {storeTimings.weekends.open} - {storeTimings.weekends.close}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Delivery Settings */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Delivery Settings</h4>
                  <Button variant="ghost" size="sm">
                    <Truck className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Delivery Radius</span>
                    <span className="text-sm font-medium text-gray-900">
                      {deliverySettings.radius} km
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Minimum Order</span>
                    <span className="text-sm font-medium text-gray-900">
                      ₹{deliverySettings.minimumOrder}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Delivery Fee</span>
                    <span className="text-sm font-medium text-gray-900">
                      ₹{deliverySettings.fee}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Platform Status */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Platform Status</h4>
                  <Button variant="ghost" size="sm">
                    <Globe className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {platforms?.map((platform: any) => (
                    <div key={platform.id} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 capitalize">{platform.name}</span>
                      <div className="flex items-center space-x-2">
                        <span 
                          className={`
                            w-2 h-2 rounded-full
                            ${platform.isConnected ? "bg-green-500" : "bg-gray-400"}
                          `}
                        ></span>
                        <span className="text-sm font-medium text-gray-900">
                          {platform.isConnected ? "Online" : "Offline"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardContent className="p-6">
            <h4 className="font-medium text-gray-900 mb-4">Performance Settings</h4>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Max Orders/Hour</span>
                <span className="text-sm font-medium text-gray-900">
                  {operationalSettings.maxOrdersPerHour}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg Preparation Time</span>
                <span className="text-sm font-medium text-gray-900">
                  {operationalSettings.preparationTime} mins
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Auto Accept Orders</span>
                <span className={`text-sm font-medium ${operationalSettings.autoAcceptOrders ? 'text-green-600' : 'text-gray-900'}`}>
                  {operationalSettings.autoAcceptOrders ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">Notification Preferences</h4>
              <Button variant="ghost" size="sm">
                <Bell className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">New Orders</span>
                <div className={`w-8 h-5 rounded-full transition-colors ${notificationSettings.newOrders ? 'bg-blue-600' : 'bg-gray-300'}`}>
                  <div className={`w-3 h-3 bg-white rounded-full shadow transform transition-transform mt-1 ${notificationSettings.newOrders ? 'translate-x-4' : 'translate-x-1'}`}></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Low Stock Alerts</span>
                <div className={`w-8 h-5 rounded-full transition-colors ${notificationSettings.lowStock ? 'bg-blue-600' : 'bg-gray-300'}`}>
                  <div className={`w-3 h-3 bg-white rounded-full shadow transform transition-transform mt-1 ${notificationSettings.lowStock ? 'translate-x-4' : 'translate-x-1'}`}></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Customer Reviews</span>
                <div className={`w-8 h-5 rounded-full transition-colors ${notificationSettings.customerReviews ? 'bg-blue-600' : 'bg-gray-300'}`}>
                  <div className={`w-3 h-3 bg-white rounded-full shadow transform transition-transform mt-1 ${notificationSettings.customerReviews ? 'translate-x-4' : 'translate-x-1'}`}></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Promotions</span>
                <div className={`w-8 h-5 rounded-full transition-colors ${notificationSettings.promotions ? 'bg-blue-600' : 'bg-gray-300'}`}>
                  <div className={`w-3 h-3 bg-white rounded-full shadow transform transition-transform mt-1 ${notificationSettings.promotions ? 'translate-x-4' : 'translate-x-1'}`}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">System Status</h4>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-600 font-medium">All Systems Operational</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600">Security</span>
                </div>
                <span className="text-sm font-medium text-green-600">Active</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600">API Connection</span>
                </div>
                <span className="text-sm font-medium text-green-600">Connected</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Truck className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600">Payment Gateway</span>
                </div>
                <span className="text-sm font-medium text-green-600">Online</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
