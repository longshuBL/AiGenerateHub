import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import MobileNav from "./mobile-nav";
import { LanguageSelector } from "@/components/language-selector";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { useLanguage } from "@/hooks/use-language";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface HeaderProps {
  onMenuClick: () => void;
  onBuyCreditsClick: () => void;
  onWatchAdsClick?: () => void;
}

export default function Header({ onMenuClick, onBuyCreditsClick, onWatchAdsClick }: HeaderProps) {
  const { data: creditsData } = useQuery<{ credits: number }>({
    queryKey: ["/api/credits"],
  });
  const { t } = useLanguage();
  const [isGetCreditsOpen, setIsGetCreditsOpen] = useState(false);
  
  const handleWatchAds = () => {
    setIsGetCreditsOpen(false);
    if (onWatchAdsClick) {
      onWatchAdsClick();
    }
  };
  
  const handleBuyCredits = () => {
    setIsGetCreditsOpen(false);
    onBuyCreditsClick();
  };
  
  return (
    <header className="bg-background border-b border-border py-3 px-6 flex items-center justify-between">
      <MobileNav onMenuClick={onMenuClick} />
      
      <div className="flex items-center gap-4">
        {/* Theme Switcher */}
        <ThemeSwitcher />
        
        {/* Language Selector */}
        <LanguageSelector />
        
        {/* Credit Display */}
        <div className="bg-background rounded-full shadow-sm border border-border flex items-center py-1 px-4">
          <div className="mr-3">
            <p className="text-xs text-muted-foreground">{t('credits')}</p>
            <p className="text-primary font-medium">
              {creditsData ? creditsData.credits.toLocaleString() : t('loading')}
            </p>
          </div>
          
          <Dialog open={isGetCreditsOpen} onOpenChange={setIsGetCreditsOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-primary hover:bg-blue-600 text-white text-sm font-medium py-1 px-3 rounded-full transition-colors"
              >
                {t('get.credits')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{t('get.points.options')}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Button 
                  className="w-full bg-primary"
                  onClick={handleBuyCredits}
                >
                  {t('buy.credits')}
                </Button>
                <Button 
                  className="w-full"
                  variant="outline"
                  onClick={handleWatchAds}
                >
                  {t('watch.ad.earn.credits')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
}
