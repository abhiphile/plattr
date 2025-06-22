import { useState } from "react";
import Header from "@/components/Header";
import TabNavigation from "@/components/TabNavigation";
import DashboardTab from "@/components/DashboardTab";
import PlatformsTab from "@/components/PlatformsTab";
import OffersTab from "@/components/OffersTab";
import PromotionsTab from "@/components/PromotionsTab";
import SettingsTab from "@/components/SettingsTab";
import AnalyticsTab from "@/components/AnalyticsTab";
import AuthModal from "@/components/AuthModal";

export type TabType = "dashboard" | "platforms" | "offers" | "promotions" | "settings" | "analytics";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; platformName: string }>({
    isOpen: false,
    platformName: ""
  });

  const openAuthModal = (platformName: string) => {
    setAuthModal({ isOpen: true, platformName });
  };

  const closeAuthModal = () => {
    setAuthModal({ isOpen: false, platformName: "" });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardTab onTabChange={setActiveTab} />;
      case "platforms":
        return <PlatformsTab onConnect={openAuthModal} />;
      case "offers":
        return <OffersTab />;
      case "promotions":
        return <PromotionsTab />;
      case "settings":
        return <SettingsTab />;
      case "analytics":
        return <AnalyticsTab />;
      default:
        return <DashboardTab onTabChange={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="mt-8">
          {renderTabContent()}
        </div>
      </div>

      <AuthModal 
        isOpen={authModal.isOpen}
        platformName={authModal.platformName}
        onClose={closeAuthModal}
      />
    </div>
  );
}
