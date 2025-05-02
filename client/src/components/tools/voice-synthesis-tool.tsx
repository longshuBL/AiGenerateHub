import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { PlayCircle, Download, Volume2 } from "lucide-react";
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
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { useCredits } from "@/hooks/use-credits";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const voiceGender = ["Female Voices", "Male Voices"];
const femaleVoices = [
  { id: "sophia", name: "Sophia", description: "Professional, warm" },
  { id: "emma", name: "Emma", description: "Natural, conversational" },
  { id: "lily", name: "Lily", description: "Young, energetic" }
];
const maleVoices = [
  { id: "james", name: "James", description: "Deep, authoritative" },
  { id: "michael", name: "Michael", description: "Friendly, approachable" },
  { id: "david", name: "David", description: "Clear, instructional" }
];
const voiceStyles = ["Neutral", "Cheerful", "Serious", "Empathetic"];
const audioFormats = ["MP3", "WAV", "OGG"];

export default function VoiceSynthesisTool() {
  const [text, setText] = useState("");
  const [selectedGender, setSelectedGender] = useState(voiceGender[0]);
  const [selectedVoice, setSelectedVoice] = useState(femaleVoices[1].id); // Default to Emma
  const [speed, setSpeed] = useState([1.0]);
  const [pitch, setPitch] = useState([0]);
  const [voiceStyle, setVoiceStyle] = useState(voiceStyles[0]);
  const [audioFormat, setAudioFormat] = useState(audioFormats[0]);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const { toast } = useToast();
  const { consumeCreditsMutation } = useCredits();
  
  const voiceMutation = useMutation({
    mutationFn: async (data: { text: string; voice: string }) => {
      const res = await apiRequest("POST", "/api/ai/voice", data);
      return await res.json();
    },
  });
  
  const voices = selectedGender === "Female Voices" ? femaleVoices : maleVoices;
  
  const handleGenerateVoice = async () => {
    if (text.trim().length < 5) {
      toast({
        title: "Text too short",
        description: "Please provide more text to convert to speech.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Estimate length - roughly 1 minute for 150 words
      const wordCount = text.trim().split(/\s+/).length;
      const estimatedMinutes = Math.max(1, Math.ceil(wordCount / 150));
      const creditCost = estimatedMinutes * 30; // 30 credits per minute
      
      await consumeCreditsMutation.mutateAsync({
        amount: creditCost,
        service: "Voice Synthesis"
      });
      
      // Find the voice name from the ID
      const voiceObj = [...femaleVoices, ...maleVoices].find(v => v.id === selectedVoice);
      const voiceName = voiceObj ? voiceObj.name : selectedVoice;
      
      // Generate voice (API call)
      const result = await voiceMutation.mutateAsync({
        text,
        voice: voiceName
      });
      
      setAudioPreview(result.audioUrl);
      
      toast({
        title: "Voice generated",
        description: "Your voice has been successfully generated.",
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Not enough credits for this operation.",
        variant: "destructive",
      });
    }
  };
  
  const handlePlayPreview = () => {
    setIsPlaying(!isPlaying);
    // In a real app, this would play the audio
  };
  
  return (
    <div className="fadeIn">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">AI Voice Synthesis</h1>
        <p className="text-gray-600">Convert text to natural-sounding speech with customizable voices.</p>
      </div>
      
      {/* Voice Synthesis Container */}
      <div className="bg-white rounded-xl shadow-sm border border-border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Side - Voice Settings */}
          <div>
            <div className="mb-6">
              <Label htmlFor="voiceText" className="block text-sm font-medium text-gray-700 mb-2">
                Text to Convert to Speech
              </Label>
              <Textarea
                id="voiceText"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter the text you want to convert to speech..."
                className="w-full border-gray-300 focus:ring-primary focus:border-primary"
                rows={6}
              />
            </div>
            
            <div className="mb-6">
              <h3 className="text-md font-medium mb-4">Voice Selection</h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {voiceGender.map((gender) => (
                  <div
                    key={gender}
                    className={`border-2 rounded-lg p-3 text-center cursor-pointer ${
                      selectedGender === gender 
                        ? 'border-primary bg-blue-50' 
                        : 'border-gray-200 hover:border-primary'
                    }`}
                    onClick={() => {
                      setSelectedGender(gender);
                      // Set default voice for the gender
                      if (gender === "Female Voices") {
                        setSelectedVoice(femaleVoices[0].id);
                      } else {
                        setSelectedVoice(maleVoices[0].id);
                      }
                    }}
                  >
                    <span className="text-sm font-medium">{gender}</span>
                  </div>
                ))}
              </div>
              
              <div className="space-y-3">
                {voices.map((voice) => (
                  <div 
                    key={voice.id}
                    className={`border rounded-lg p-3 cursor-pointer flex items-center justify-between ${
                      selectedVoice === voice.id 
                        ? 'border-primary bg-blue-50' 
                        : 'border-gray-200 hover:border-primary'
                    }`}
                    onClick={() => setSelectedVoice(voice.id)}
                  >
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full ${
                        selectedGender === "Female Voices" ? 'bg-pink-100 text-pink-500' : 'bg-blue-100 text-blue-500'
                      } flex items-center justify-center mr-3`}>
                        <Volume2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{voice.name}</p>
                        <p className="text-xs text-gray-500">{voice.description}</p>
                      </div>
                    </div>
                    <button className="p-1 text-gray-500 hover:text-primary">
                      <PlayCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Right Side - Voice Settings and Preview */}
          <div>
            <h3 className="text-md font-medium mb-4">Voice Settings</h3>
            <div className="space-y-4 mb-6">
              <div>
                <div className="flex justify-between text-sm text-gray-700 mb-1">
                  <Label>Speed</Label>
                  <span>{speed[0]}x</span>
                </div>
                <Slider
                  value={speed}
                  onValueChange={setSpeed}
                  min={0.5}
                  max={2}
                  step={0.1}
                  className="w-full"
                />
              </div>
              
              <div>
                <div className="flex justify-between text-sm text-gray-700 mb-1">
                  <Label>Pitch</Label>
                  <span>{pitch[0] === 0 ? "Normal" : pitch[0] > 0 ? `Higher (+${pitch[0]})` : `Lower (${pitch[0]})`}</span>
                </div>
                <Slider
                  value={pitch}
                  onValueChange={setPitch}
                  min={-10}
                  max={10}
                  step={1}
                  className="w-full"
                />
              </div>
              
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Voice Style
                </Label>
                <Select value={voiceStyle} onValueChange={setVoiceStyle}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {voiceStyles.map((style) => (
                      <SelectItem key={style} value={style}>{style}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Audio Format
                </Label>
                <Select value={audioFormat} onValueChange={setAudioFormat}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {audioFormats.map((format) => (
                      <SelectItem key={format} value={format}>{format}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-medium mb-3">Preview</h4>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="w-full h-12 bg-gray-100 rounded-lg relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full px-4">
                        <div className="w-full h-8">
                          <svg viewBox="0 0 100 20" className="w-full h-full">
                            <path 
                              fill="none" 
                              stroke="#1677FF" 
                              strokeWidth="1" 
                              d="M0,10 Q5,5 10,10 T20,10 T30,10 T40,10 T50,10 T60,10 T70,10 T80,10 T90,10 T100,10" 
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="ml-4">
                  <Button 
                    className="p-2 rounded-full" 
                    onClick={handlePlayPreview}
                    variant={isPlaying ? "outline" : "default"}
                    size="icon"
                    disabled={!audioPreview && !voiceMutation.isPending}
                  >
                    <PlayCircle className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center text-sm text-gray-500">
                <svg className="w-4 h-4 mr-1 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                <span>30 credits per minute</span>
              </div>
              
              <Button
                onClick={handleGenerateVoice}
                disabled={voiceMutation.isPending || text.trim() === ""}
              >
                {voiceMutation.isPending ? "Generating..." : "Generate Voice"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
