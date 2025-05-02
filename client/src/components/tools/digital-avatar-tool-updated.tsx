import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { 
  PlayCircle, 
  Download, 
  Upload, 
  User,
  Video,
  Music,
  Image,
  Wand2,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useCredits } from "@/hooks/use-credits";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";

// Tab types
type TabType = "lipSync" | "actionImitation";

export default function DigitalAvatarTool() {
  const [activeTab, setActiveTab] = useState<TabType>("lipSync");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [referenceImageFile, setReferenceImageFile] = useState<File | null>(null);
  const [characterImageFile, setCharacterImageFile] = useState<File | null>(null);
  const [actionVideoFile, setActionVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'processing' | 'complete'>('idle');
  const [progress, setProgress] = useState(0);
  
  const { toast } = useToast();
  const { consumeCreditsMutation } = useCredits();
  const { t } = useLanguage();
  
  // Simulated API call for lip sync
  const lipSyncMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      if (videoFile) formData.append('video', videoFile);
      if (audioFile) formData.append('audio', audioFile);
      if (referenceImageFile) formData.append('referenceImage', referenceImageFile);
      
      const res = await apiRequest("POST", "/api/ai/lip-sync", formData);
      return await res.json();
    },
  });
  
  // Simulated API call for action imitation
  const actionImitationMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      if (characterImageFile) formData.append('character', characterImageFile);
      if (actionVideoFile) formData.append('action', actionVideoFile);
      
      const res = await apiRequest("POST", "/api/ai/action-imitation", formData);
      return await res.json();
    },
  });
  
  // Handle file selection
  const handleFileChange = (type: 'video' | 'audio' | 'reference' | 'character' | 'action', e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      switch (type) {
        case 'video':
          setVideoFile(file);
          break;
        case 'audio':
          setAudioFile(file);
          break;
        case 'reference':
          setReferenceImageFile(file);
          break;
        case 'character':
          setCharacterImageFile(file);
          break;
        case 'action':
          setActionVideoFile(file);
          break;
      }
      
      // Create preview for image files
      if ((type === 'reference' || type === 'character') && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target && typeof e.target.result === 'string') {
            if (type === 'character') {
              setVideoPreview(e.target.result);
            }
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };
  
  // Handle generate video
  const handleGenerateVideo = async () => {
    try {
      const isLipSync = activeTab === "lipSync";
      const creditCost = isLipSync ? 100 : 150; // Lip sync costs 100, action imitation costs 150
      
      // Validate that required files are uploaded
      if (isLipSync && (!videoFile || !audioFile)) {
        toast({
          title: "文件缺失",
          description: "请上传视频和音频文件以进行唇形同步。",
          variant: "destructive",
        });
        return;
      }
      
      if (!isLipSync && (!characterImageFile || !actionVideoFile)) {
        toast({
          title: "文件缺失",
          description: "请上传角色图片和动作视频以进行动作模仿。",
          variant: "destructive",
        });
        return;
      }
      
      // Consume credits first
      await consumeCreditsMutation.mutateAsync({
        amount: creditCost,
        service: isLipSync ? "Lip Sync" : "Action Imitation"
      });
      
      // Show processing state
      setProcessingStatus('processing');
      
      // Set up progress simulation
      const intervalId = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) {
            clearInterval(intervalId);
            return 95;
          }
          return prev + 5;
        });
      }, 500);
      
      // Call appropriate mutation
      const result = isLipSync
        ? await lipSyncMutation.mutateAsync()
        : await actionImitationMutation.mutateAsync();
      
      // Complete progress and show result
      clearInterval(intervalId);
      setProgress(100);
      
      // Simulate result with a placeholder video
      setTimeout(() => {
        setVideoPreview("https://placehold.co/600x400/1677FF/FFFFFF?text=AI+Generated+Video");
        setProcessingStatus('complete');
      }, 1000);
      
      toast({
        title: "视频生成成功",
        description: "你的数字人物视频已生成完成。",
      });
    } catch (error) {
      setProcessingStatus('idle');
      setProgress(0);
      
      toast({
        title: "错误",
        description: "生成视频时出现错误。可能是积分不足。",
        variant: "destructive",
      });
    }
  };
  
  // Reset state for demo purposes
  const resetDemo = () => {
    setVideoFile(null);
    setAudioFile(null);
    setReferenceImageFile(null);
    setCharacterImageFile(null);
    setActionVideoFile(null);
    setVideoPreview(null);
    setProcessingStatus('idle');
    setProgress(0);
  };
  
  return (
    <div className="fadeIn">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold mb-2">{t('digital.avatar')}</h1>
          <p className="text-gray-600">创建数字人物视频，进行唇形同步或动作模仿</p>
        </div>
        
        {/* Demo only - reset button */}
        <Button variant="outline" size="sm" onClick={resetDemo}>
          <RefreshCw className="w-4 h-4 mr-2" />
          重置演示
        </Button>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-border p-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)}>
          <TabsList className="grid grid-cols-2 w-[400px] mb-6">
            <TabsTrigger value="lipSync">{t('lip.sync')}</TabsTrigger>
            <TabsTrigger value="actionImitation">{t('action.imitation')}</TabsTrigger>
          </TabsList>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left column - Inputs */}
            <div>
              <TabsContent value="lipSync" className="mt-0">
                <div className="space-y-6">
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('upload.video')}
                    </Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors">
                      <input
                        type="file"
                        id="video-upload"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => handleFileChange('video', e)}
                      />
                      <label htmlFor="video-upload" className="cursor-pointer flex flex-col items-center">
                        <Video className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 mb-1">
                          {videoFile ? videoFile.name : "点击或拖拽上传视频文件"}
                        </p>
                        <p className="text-xs text-gray-500">MP4, MOV, 最大 50MB</p>
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">包含人物面部的视频将用于唇形同步</p>
                  </div>
                  
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('upload.audio')}
                    </Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors">
                      <input
                        type="file"
                        id="audio-upload"
                        accept="audio/*"
                        className="hidden"
                        onChange={(e) => handleFileChange('audio', e)}
                      />
                      <label htmlFor="audio-upload" className="cursor-pointer flex flex-col items-center">
                        <Music className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 mb-1">
                          {audioFile ? audioFile.name : "点击或拖拽上传音频文件"}
                        </p>
                        <p className="text-xs text-gray-500">MP3, WAV, 最大 10MB</p>
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">视频中的人物将会与该音频同步说话</p>
                  </div>
                  
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('upload.reference')} (可选)
                    </Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors">
                      <input
                        type="file"
                        id="reference-upload"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange('reference', e)}
                      />
                      <label htmlFor="reference-upload" className="cursor-pointer flex flex-col items-center">
                        <Image className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 mb-1">
                          {referenceImageFile ? referenceImageFile.name : "点击或拖拽上传参考图片"}
                        </p>
                        <p className="text-xs text-gray-500">JPG, PNG, 最大 5MB</p>
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">如果视频中有多个面孔，上传参考图片选择特定人物</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="actionImitation" className="mt-0">
                <div className="space-y-6">
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('upload.character')}
                    </Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors">
                      <input
                        type="file"
                        id="character-upload"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange('character', e)}
                      />
                      <label htmlFor="character-upload" className="cursor-pointer flex flex-col items-center">
                        <User className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 mb-1">
                          {characterImageFile ? characterImageFile.name : "点击或拖拽上传角色图片"}
                        </p>
                        <p className="text-xs text-gray-500">JPG, PNG, 最大 5MB</p>
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">上传一张包含完整人物的图片</p>
                  </div>
                  
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('upload.action')}
                    </Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors">
                      <input
                        type="file"
                        id="action-upload"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => handleFileChange('action', e)}
                      />
                      <label htmlFor="action-upload" className="cursor-pointer flex flex-col items-center">
                        <Video className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 mb-1">
                          {actionVideoFile ? actionVideoFile.name : "点击或拖拽上传动作视频"}
                        </p>
                        <p className="text-xs text-gray-500">MP4, MOV, 最大 50MB</p>
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">包含要模仿动作的视频</p>
                  </div>
                </div>
              </TabsContent>
              
              <div className="mt-6 flex justify-between items-center">
                <div className="flex items-center text-sm text-gray-500">
                  <svg className="w-4 h-4 mr-1 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                  <span>
                    {activeTab === "lipSync" ? "100 积分/视频" : "150 积分/视频"}
                  </span>
                </div>
                
                <Button
                  onClick={handleGenerateVideo}
                  disabled={
                    processingStatus !== 'idle' || 
                    (activeTab === "lipSync" && (!videoFile || !audioFile)) ||
                    (activeTab === "actionImitation" && (!characterImageFile || !actionVideoFile))
                  }
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  {t('generate.video')}
                </Button>
              </div>
            </div>
            
            {/* Right column - Video Preview */}
            <div>
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                <div className="p-4 border-b bg-gray-100">
                  <h3 className="font-medium">视频预览</h3>
                </div>
                
                <div className="aspect-video w-full bg-gray-900 flex items-center justify-center relative">
                  {videoPreview ? (
                    <img 
                      src={videoPreview} 
                      alt="Video preview" 
                      className="max-w-full max-h-full"
                    />
                  ) : (
                    <div className="text-center text-gray-500 p-6">
                      {processingStatus === 'processing' ? (
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                          <p>处理中...{progress}%</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <p>生成的视频将在此处显示</p>
                          <p className="text-sm">
                            {activeTab === "lipSync" 
                              ? "上传视频和音频以生成唇形同步视频" 
                              : "上传角色图片和动作视频以生成动作模仿视频"}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {videoPreview && processingStatus === 'complete' && (
                    <div className="absolute bottom-4 right-4 flex space-x-2">
                      <Button size="sm" variant="secondary" className="rounded-full flex items-center">
                        <PlayCircle className="w-4 h-4 mr-1" />
                        播放
                      </Button>
                      <Button size="sm" variant="secondary" className="rounded-full flex items-center">
                        <Download className="w-4 h-4 mr-1" />
                        下载
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="p-4 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">特点与限制</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li className="flex items-start">
                        <span className="text-primary mr-2">•</span>
                        <span>
                          {activeTab === "lipSync" 
                            ? "唇形同步支持多语言音频输入，能准确匹配口型和声音" 
                            : "动作模仿可以将静态图片中的人物动起来，模仿指定的动作视频"}
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary mr-2">•</span>
                        <span>
                          {activeTab === "lipSync" 
                            ? "视频中的人物面部应清晰可见，背景简单效果更佳" 
                            : "角色图片应为全身照，背景简单或透明背景效果更佳"}
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary mr-2">•</span>
                        <span>视频生成过程可能需要30秒至2分钟，取决于文件大小和复杂度</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
}