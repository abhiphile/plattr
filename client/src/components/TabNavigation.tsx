import { TabType } from "@/pages/dashboard";
import { 
  BarChart3, 
  Settings, 
  Tags, 
  Megaphone, 
  Plug, 
  TrendingUp 
} from "lucide-react";

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs = [
  { id: "dashboard" as TabType, label: "Overview", icon: TrendingUp },
  { id: "platforms" as TabType, label: "Channels", icon: Plug },
  { id: "offers" as TabType, label: "Action Center", icon: Tags },
  { id: "promotions" as TabType, label: "Deals & Coupons", icon: Megaphone },
  { id: "settings" as TabType, label: "Store Info", icon: Settings },
  { id: "analytics" as TabType, label: "Insights", icon: BarChart3 },
];

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="mb-8">
      <nav className="flex space-x-8 border-b border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors
                ${isActive 
                  ? "border-blue-600 text-blue-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700"
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
