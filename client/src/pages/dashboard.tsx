import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { CreditsProvider } from "@/hooks/use-credits";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import Header from "@/components/layout/header";
import CreditWarningDialog from "@/components/dialogs/credit-warning-dialog";
import BuyCreditsDialog from "@/components/dialogs/buy-credits-dialog";
import AIChatTool from "@/components/tools/ai-chat-tool";
import ImageGenerationTool from "@/components/tools/image-generation-tool";
import VideoGenerationTool from "@/components/tools/video-generation-tool";
import DigitalAvatarTool from "@/components/tools/digital-avatar-tool-updated";
import VoiceSynthesisTool from "@/components/tools/voice-synthesis-tool";
import WatchAdsTool from "@/components/tools/watch-ads-tool";

const TOOLS = {
  aiChat: "aiChat",
  imageGen: "imageGen",
  videoGen: "videoGen",
  avatar: "avatar",
  voice: "voice",
  watchAds: "watchAds",
};

export default function Dashboard() {
  const [activeTool, setActiveTool] = useState(TOOLS.aiChat);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isCreditWarningOpen, setIsCreditWarningOpen] = useState(false);
  const [isBuyCreditsOpen, setIsBuyCreditsOpen] = useState(false);
  
  const { user } = useAuth();
  
  // Display the credit warning dialog if credits are low (below 50)
  useEffect(() => {
    if (user && user.credits < 50) {
      const hasShownWarning = sessionStorage.getItem('creditWarningShown');
      if (!hasShownWarning) {
        setTimeout(() => {
          setIsCreditWarningOpen(true);
          sessionStorage.setItem('creditWarningShown', 'true');
        }, 3000);
      }
    }
  }, [user]);
  
  const toggleMobileNav = () => {
    setIsMobileNavOpen(!isMobileNavOpen);
  };
  
  const handleToolChange = (tool: string) => {
    setActiveTool(tool);
    setIsMobileNavOpen(false);
  };
  
  const handleBuyCredits = () => {
    setIsCreditWarningOpen(false);
    setIsBuyCreditsOpen(true);
  };
  
  const handleWatchAd = () => {
    // Switch to the watch ads tab and close the warning
    setActiveTool(TOOLS.watchAds);
    setIsCreditWarningOpen(false);
  };
  
  return (
    <CreditsProvider>
      <div className="flex h-screen text-dark">
        {/* Mobile Nav Overlay */}
        {isMobileNavOpen && (
          <div 
            className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 lg:hidden" 
            onClick={toggleMobileNav}
          />
        )}
        
        {/* Sidebar */}
        <Sidebar 
          activeTool={activeTool} 
          onToolChange={handleToolChange} 
          isOpen={isMobileNavOpen}
          onClose={toggleMobileNav}
        />
        
        {/* Main Content */}
        <main className="flex-1 flex flex-col h-full lg:ml-0 overflow-hidden">
          {/* Header */}
          <Header 
            onMenuClick={toggleMobileNav} 
            onBuyCreditsClick={() => setIsBuyCreditsOpen(true)}
            onWatchAdsClick={() => setActiveTool(TOOLS.watchAds)}
          />
          
          {/* Tool Panels Container */}
          <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
            {activeTool === TOOLS.aiChat && <AIChatTool />}
            {activeTool === TOOLS.imageGen && <ImageGenerationTool />}
            {activeTool === TOOLS.videoGen && <VideoGenerationTool />}
            {activeTool === TOOLS.avatar && <DigitalAvatarTool />}
            {activeTool === TOOLS.voice && <VoiceSynthesisTool />}
            {activeTool === TOOLS.watchAds && <WatchAdsTool />}
          </div>
        </main>
      </div>
      
      {/* Modals */}
      <CreditWarningDialog 
        isOpen={isCreditWarningOpen} 
        onClose={() => setIsCreditWarningOpen(false)}
        onBuyCredits={handleBuyCredits}
        onWatchAd={handleWatchAd}
      />
      
      <BuyCreditsDialog 
        isOpen={isBuyCreditsOpen} 
        onClose={() => setIsBuyCreditsOpen(false)}
      />
    </CreditsProvider>
  );
}
