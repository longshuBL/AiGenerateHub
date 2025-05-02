import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Upload, Download, Edit, Zap, Info, Image as ImageIcon, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCredits } from "@/hooks/use-credits";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/hooks/use-language";

const styles = [
  "photographic",
  "anime",
  "base",
  "digital-art",
  "comics",
  "oil-painting",
  "watercolor",
  "pixar",
  "ink",
  "oriental"
];

const resolutionOptions = [
  { label: "512 x 512", width: 512, height: 512 },
  { label: "640 x 640", width: 640, height: 640 },
  { label: "768 x 768", width: 768, height: 768 },
  { label: "1024 x 1024", width: 1024, height: 1024 },
  { label: "宽版 768 x 512", width: 768, height: 512 },
  { label: "长版 512 x 768", width: 512, height: 768 },
  { label: "宽版 1024 x 768", width: 1024, height: 768 },
  { label: "长版 768 x 1024", width: 768, height: 1024 }
];

export default function ImageGenerationTool() {
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [style, setStyle] = useState(styles[0]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [resolution, setResolution] = useState(resolutionOptions[3].label);
  
  const [seed, setSeed] = useState<number | undefined>(undefined);
  const [useRandomSeed, setUseRandomSeed] = useState(true);
  
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { consumeCreditsMutation } = useCredits();
  const { t } = useLanguage();
  
  // 任务ID状态
  const [taskId, setTaskId] = useState<string | null>(null);
  
  const getCurrentResolution = () => {
    return resolutionOptions.find(r => r.label === resolution) || resolutionOptions[3];
  };
  
  const imageMutation = useMutation({
    mutationFn: async (data: any) => {
      setProcessingStatus("正在提交图像生成任务...");
      
      const res = await apiRequest("POST", "/api/ai/image", data);
      const responseData = await res.json();
      
      if (!res.ok) {
        throw new Error(responseData.message || "图像生成请求失败");
      }
      
      return responseData;
    },
    onSuccess: (data) => {
      setGeneratedImage(data.imageUrl);
      setProcessingStatus(null);
    },
    onError: (error: any) => {
      setProcessingStatus(null);
      toast({
        title: "图像生成失败",
        description: error.message || "请稍后再试",
        variant: "destructive",
      });
    }
  });
  
  const handleGenerateImage = async () => {
    if (prompt.trim().length < 5) {
      toast({
        title: "提示词太短",
        description: "请提供更详细的描述，以获得更好的生成效果。",
        variant: "destructive",
      });
      return;
    }
    
    setGeneratedImage(null);
    
    try {
      const { width, height } = getCurrentResolution();
      
      const currentSeed = useRandomSeed ? undefined : (seed || Math.floor(Math.random() * 2147483647));
      
      await imageMutation.mutateAsync({
        prompt,
        negative_prompt: negativePrompt,
        style,
        width,
        height,
        seed: currentSeed
      });
    } catch (error: any) {
      console.error("图像生成失败:", error);
    }
  };
  
  const handleDownloadImage = () => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `wanx-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="fadeIn">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">通义万相图像生成</h1>
        <p className="text-gray-600">使用强大的通义万相AI模型，从文本描述创建精美图像。</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <div className="mb-6">
            <Label htmlFor="imagePrompt" className="block text-sm font-medium text-gray-700 mb-2">
              提示词 <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="imagePrompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="例如：一个未来城市的景观，有飞行汽车和霓虹灯，赛博朋克风格，高细节，8K分辨率"
              className="w-full border-gray-300 focus:ring-primary focus:border-primary"
              rows={4}
            />
            <p className="text-xs text-gray-500 mt-1">详细的描述可以获得更好的效果，可以包含场景、风格、画质等。</p>
          </div>
          
          <div className="mb-6">
            <Label htmlFor="negativePrompt" className="block text-sm font-medium text-gray-700 mb-2">
              负面提示词
            </Label>
            <Textarea
              id="negativePrompt"
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="例如：模糊, 畸形, 低质量, 扭曲的手指, 低分辨率"
              className="w-full border-gray-300 focus:ring-primary focus:border-primary"
              rows={2}
            />
            <p className="text-xs text-gray-500 mt-1">指定你不希望在图像中出现的元素。</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                图像风格
              </Label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {styles.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s === "photographic" ? "真实摄影" : 
                       s === "anime" ? "动漫风格" : 
                       s === "base" ? "基础风格" : 
                       s === "digital-art" ? "数字艺术" : 
                       s === "comics" ? "漫画风格" : 
                       s === "oil-painting" ? "油画" : 
                       s === "watercolor" ? "水彩画" : 
                       s === "pixar" ? "皮克斯3D" : 
                       s === "ink" ? "水墨画" : 
                       s === "oriental" ? "国风绘画" : s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                分辨率
              </Label>
              <Select value={resolution} onValueChange={setResolution}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {resolutionOptions.map((r) => (
                    <SelectItem key={r.label} value={r.label}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 mb-4">
            <Switch
              checked={showAdvanced}
              onCheckedChange={setShowAdvanced}
              id="advanced-mode"
            />
            <Label htmlFor="advanced-mode">显示高级选项</Label>
          </div>
          
          {showAdvanced && (
            <div className="border-t border-gray-200 pt-4 mb-6 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">
                  随机种子
                </Label>
                <Switch 
                  checked={useRandomSeed} 
                  onCheckedChange={setUseRandomSeed}
                  id="random-seed"
                />
              </div>
              
              {!useRandomSeed && (
                <div>
                  <Label htmlFor="seed" className="block text-sm font-medium text-gray-700 mb-2">
                    种子值
                  </Label>
                  <Input
                    id="seed"
                    type="number"
                    value={seed || ""}
                    onChange={(e) => setSeed(e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="输入种子值 (0-2147483647)"
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">使用相同的种子值可以生成相似的图像。</p>
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <div className="flex items-center text-sm text-gray-500">
              <Zap className="w-4 h-4 mr-1 text-primary" />
              <span>每次生成消耗15积分</span>
            </div>
            
            <Button
              onClick={handleGenerateImage}
              disabled={imageMutation.isPending || prompt.trim() === ""}
              className="min-w-[120px]"
            >
              {imageMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <ImageIcon className="mr-2 h-4 w-4" />
                  生成图像
                </>
              )}
            </Button>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-lg font-medium">生成结果</h3>
            {generatedImage && (
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={handleGenerateImage}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  重新生成
                </Button>
                <Button size="sm" onClick={handleDownloadImage}>
                  <Download className="h-4 w-4 mr-1" />
                  下载
                </Button>
              </div>
            )}
          </div>
          
          <div className="bg-gray-100 rounded-lg w-full aspect-square flex items-center justify-center overflow-hidden">
            {imageMutation.isPending ? (
              <div className="flex flex-col items-center justify-center text-gray-500">
                <Loader2 className="h-10 w-10 animate-spin mb-2" />
                <p>{processingStatus || "正在创建您的图像..."}</p>
                <p className="text-xs mt-2 max-w-xs text-center">
                  生成高质量图像可能需要30秒以上，异步任务处理中，请耐心等待。
                </p>
              </div>
            ) : generatedImage ? (
              <img 
                src={generatedImage} 
                alt="Generated by Wanx" 
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-500">
                <ImageIcon className="h-16 w-16 mb-4 opacity-20" />
                <p>您生成的图像将显示在这里</p>
              </div>
            )}
          </div>
          
          {generatedImage && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              <p className="font-medium mb-1">生成信息</p>
              <p className="text-xs">模型: wanx2.1-t2i-plus</p>
              <p className="text-xs">分辨率: {getCurrentResolution().width} x {getCurrentResolution().height}</p>
              {!useRandomSeed && seed !== undefined && (
                <p className="text-xs">种子值: {seed}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
