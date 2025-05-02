import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { 
  Volume2, 
  Download,
  VolumeX, 
  PlayCircle, 
  PauseCircle,
  Loader2,
  Film
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useCredits } from "@/hooks/use-credits";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";

const durations = [
  "5 seconds",
  "10 seconds",
  "15 seconds",
  "30 seconds"
];

const resolutions = [
  "720p",
  "1080p",
  "4K"
];

const styles = [
  "Realistic",
  "Cinematic",
  "Animation",
  "Retro"
];

const audioOptions = [
  "None",
  "Ambient",
  "Cinematic",
  "Upbeat",
  "Dramatic",
  "Upload custom audio..."
];

export default function VideoGenerationTool() {
  const [tab, setTab] = useState("text-to-video");
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(durations[1]);
  const [resolution, setResolution] = useState(resolutions[0]);
  const [style, setStyle] = useState(styles[0]);
  const [audio, setAudio] = useState(audioOptions[0]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { consumeCreditsMutation } = useCredits();
  const { t } = useLanguage();
  
  const videoMutation = useMutation({
    mutationFn: async (data: { prompt: string; duration: string; resolution: string }) => {
      const res = await apiRequest("POST", "/api/ai/video", data);
      return await res.json();
    },
  });
  
  const handleGenerateVideo = async () => {
    if (prompt.trim().length < 5) {
      toast({
        title: "Prompt too short",
        description: "Please provide a more detailed description.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await consumeCreditsMutation.mutateAsync({
        amount: 200, // 200 credits per video generation
        service: "Video Generation"
      });
      
      // Start the "processing" simulation
      setProcessing(true);
      setProgress(0);
      
      // Simulate progress
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 5;
        });
      }, 500);
      
      // Generate video (API would be called here in a real app)
      const result = await videoMutation.mutateAsync({
        prompt,
        duration,
        resolution
      });
      
      // Complete the progress
      clearInterval(interval);
      setProgress(100);
      
      // Show completed video
      setTimeout(() => {
        setGeneratedVideo(result.videoUrl);
        setProcessing(false);
      }, 1500);
      
    } catch (error) {
      setProcessing(false);
      toast({
        title: "Error",
        description: "Not enough credits for this operation.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="fadeIn">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">{t('video.generation')}</h1>
        <p className="text-gray-600">Create videos from text descriptions or convert images to videos.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Video Generation Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="text-to-video">Text to Video</TabsTrigger>
              <TabsTrigger value="image-to-video">Image to Video</TabsTrigger>
            </TabsList>
            
            <TabsContent value="text-to-video">
              <div className="mb-6">
                <Label htmlFor="videoPrompt" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('prompt')}
                </Label>
                <Textarea
                  id="videoPrompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="E.g., A drone shot flying over snow-capped mountains at sunset, cinematic quality"
                  className="w-full border-gray-300 focus:ring-primary focus:border-primary"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration
                  </Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {durations.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">
                    Resolution
                  </Label>
                  <Select value={resolution} onValueChange={setResolution}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {resolutions.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('style')}
                  </Label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {styles.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="mb-6">
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Add Background Audio (Optional)
                </Label>
                <Select value={audio} onValueChange={setAudio}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {audioOptions.map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
            
            <TabsContent value="image-to-video">
              <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-lg">
                <div className="flex flex-col items-center">
                  <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  <h3 className="text-lg font-medium mb-2">Upload an image to animate</h3>
                  <p className="text-gray-500 mb-4">Drag and drop an image or click to browse</p>
                  <Button>Select Image</Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-between items-center mt-6">
            <div className="flex items-center text-sm text-gray-500">
              <svg className="w-4 h-4 mr-1 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
              <span>200 credits per video</span>
            </div>
            
            <Button
              onClick={handleGenerateVideo}
              disabled={videoMutation.isPending || processing || prompt.trim() === ""}
            >
              {videoMutation.isPending || processing ? t('loading') : "Generate Video"}
            </Button>
          </div>
        </div>
        
        {/* Video Preview Column */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <h3 className="text-md font-medium mb-4">{t('video.preview')}</h3>
          
          {processing ? (
            <div className="flex flex-col items-center justify-center h-80 bg-gray-50 rounded-lg">
              <div className="flex flex-col items-center justify-center mb-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-gray-500">{t('loading')}</p>
              </div>
              <Progress value={progress} className="w-3/4 h-2 mb-2" />
              <p className="text-sm text-gray-500">
                Rendering video ({progress}% complete)
              </p>
            </div>
          ) : generatedVideo ? (
            <div className="w-full bg-gray-900 rounded-lg overflow-hidden aspect-video relative flex items-center justify-center">
              <img 
                src={generatedVideo} 
                alt="Generated video preview"
                className="w-full h-full object-cover"
              />
              
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="text-sm">0:00 / 0:10</div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                      <Volume2 className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                      <Download className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
                
                <Progress value={100} className="h-1 mt-2" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-80 bg-gray-50 rounded-lg">
              <Film className="w-10 h-10 text-gray-300 mb-4" />
              <p className="text-gray-500">{t('preview.tip')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
