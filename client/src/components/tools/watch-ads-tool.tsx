import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { PlayCircle, Clock, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useCredits } from "@/hooks/use-credits";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";

// Mock ads data
const availableAds = [
  {
    id: "ad1",
    title: "阿里云服务器推广",
    description: "了解阿里云弹性计算服务的特点和优势",
    image: "https://placehold.co/300x200/1677FF/FFFFFF?text=Alibaba+Cloud",
    creditsReward: 30,
    duration: 30, // seconds
    watched: false
  },
  {
    id: "ad2",
    title: "淘宝618大促",
    description: "最新促销活动和优惠券信息",
    image: "https://placehold.co/300x200/FF6A00/FFFFFF?text=Taobao+618",
    creditsReward: 25,
    duration: 25,
    watched: false
  },
  {
    id: "ad3",
    title: "支付宝钱包",
    description: "支付宝钱包新功能介绍",
    image: "https://placehold.co/300x200/00A0E9/FFFFFF?text=Alipay",
    creditsReward: 20,
    duration: 20,
    watched: false
  },
  {
    id: "ad4",
    title: "天猫超市",
    description: "天猫超市新人优惠活动",
    image: "https://placehold.co/300x200/E50034/FFFFFF?text=Tmall",
    creditsReward: 35,
    duration: 35,
    watched: false
  }
];

// Mock watch history
const watchHistory = [
  {
    id: "hist1",
    title: "阿里云计算简介",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    creditsEarned: 30
  },
  {
    id: "hist2",
    title: "钉钉协作平台",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4), // 4 days ago
    creditsEarned: 25
  }
];

export default function WatchAdsTool() {
  const [ads, setAds] = useState(availableAds);
  const [history, setHistory] = useState(watchHistory);
  const [activeTab, setActiveTab] = useState("available");
  const [watchingAd, setWatchingAd] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [timer, setTimer] = useState<ReturnType<typeof setInterval> | null>(null);
  
  const { toast } = useToast();
  const { watchAdForCreditsMutation } = useCredits();
  const { t } = useLanguage();
  
  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timer]);
  
  const handleWatchAd = (adId: string) => {
    const ad = ads.find(a => a.id === adId);
    if (!ad) return;
    
    setWatchingAd(adId);
    setProgress(0);
    
    // Set up progress timer
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          completeAd(adId, ad.creditsReward);
          return 100;
        }
        return prev + (100 / ad.duration);
      });
    }, 1000);
    
    setTimer(interval);
  };
  
  const completeAd = async (adId: string, credits: number) => {
    try {
      // Mark ad as watched
      setAds(prev => prev.map(a => 
        a.id === adId ? { ...a, watched: true } : a
      ));
      
      // Add to history
      const ad = ads.find(a => a.id === adId);
      if (ad) {
        setHistory(prev => [{
          id: `hist-${Date.now()}`,
          title: ad.title,
          date: new Date(),
          creditsEarned: credits
        }, ...prev]);
      }
      
      // Award credits
      await watchAdForCreditsMutation.mutateAsync();
      
      toast({
        title: "广告观看完成",
        description: `你已获得 ${credits} 积分奖励！`,
      });
      
      setWatchingAd(null);
    } catch (error) {
      toast({
        title: "出错了",
        description: "无法处理积分奖励。",
        variant: "destructive",
      });
      setWatchingAd(null);
    }
  };
  
  const resetAdWatched = () => {
    // For demo purposes, reset ads to unwatched
    setAds(availableAds.map(ad => ({ ...ad, watched: false })));
  };
  
  return (
    <div className="fadeIn">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold mb-2">{t('watch.ads.earn')}</h1>
          <p className="text-gray-600">通过观看广告视频来赚取积分，用于AI创作服务</p>
        </div>
        
        {/* Demo only - reset button */}
        <Button variant="outline" size="sm" onClick={resetAdWatched}>
          重置演示
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="available">{t('ads.available')}</TabsTrigger>
          <TabsTrigger value="history">{t('ad.history')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="available">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ads.map((ad) => (
              <Card key={ad.id} className={`overflow-hidden ${ad.watched ? 'opacity-70' : ''}`}>
                <div className="relative">
                  <img 
                    src={ad.image} 
                    alt={ad.title} 
                    className="w-full h-40 object-cover"
                  />
                  {ad.watched && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-green-500">
                        <Check className="w-3 h-3 mr-1" />
                        {t('ad.watched')}
                      </Badge>
                    </div>
                  )}
                </div>
                
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{ad.title}</CardTitle>
                </CardHeader>
                
                <CardContent className="py-2">
                  <p className="text-sm text-gray-600 mb-2">{ad.description}</p>
                  <div className="flex items-center text-sm">
                    <Clock className="w-4 h-4 mr-1 text-gray-500" />
                    <span>{ad.duration} 秒</span>
                    <span className="mx-2">•</span>
                    <span className="font-medium text-primary">{t('ad.worth')} {ad.creditsReward} {t('ad.credits')}</span>
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Button 
                    className="w-full"
                    onClick={() => handleWatchAd(ad.id)}
                    disabled={ad.watched || !!watchingAd}
                  >
                    <PlayCircle className="w-4 h-4 mr-2" />
                    {t('ad.watch')}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          
          {watchingAd && (
            <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-6">
              <Card className="w-full max-w-3xl">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>
                      {ads.find(a => a.id === watchingAd)?.title}
                    </CardTitle>
                    <Badge variant="outline" className="flex items-center">
                      <PlayCircle className="w-3 h-3 mr-1" />
                      {Math.round(progress)}%
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="aspect-video bg-gray-900 mb-4 flex items-center justify-center">
                    <img 
                      src={ads.find(a => a.id === watchingAd)?.image} 
                      alt="Ad preview" 
                      className="max-h-full"
                    />
                  </div>
                  
                  <Progress value={progress} className="h-2" />
                  
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    请等待广告结束以获取积分奖励
                  </p>
                </CardContent>
                
                <CardFooter className="flex justify-end">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      if (timer) clearInterval(timer);
                      setWatchingAd(null);
                    }}
                  >
                    跳过 (不获得积分)
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="history">
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-medium">{t('ad.history')}</h3>
            </div>
            
            {history.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <p>尚无观看记录</p>
              </div>
            ) : (
              <div className="divide-y">
                {history.map((item) => (
                  <div key={item.id} className="p-4 flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{item.title}</h4>
                      <p className="text-sm text-gray-500">
                        {item.date.toLocaleDateString()} {item.date.toLocaleTimeString()}
                      </p>
                    </div>
                    <Badge className="bg-primary">
                      +{item.creditsEarned} {t('ad.credits')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}