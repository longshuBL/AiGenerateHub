import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { PlayCircle, Download, Smile, Frown, Meh, Edit } from "lucide-react";
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
import { useCredits } from "@/hooks/use-credits";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";

const avatarTypes = [
  { id: "realistic", name: "Realistic", image: "https://placehold.co/100x100/1677FF/FFFFFF?text=Realistic" },
  { id: "stylized", name: "Stylized", image: "https://placehold.co/100x100/1677FF/FFFFFF?text=Stylized" },
  { id: "cartoon", name: "Cartoon", image: "https://placehold.co/100x100/1677FF/FFFFFF?text=Cartoon" }
];

const faceShapes = ["Oval", "Round", "Square", "Heart"];
const hairStyles = ["Short", "Medium", "Long", "Curly"];
const skinTones = [
  { name: "Light", color: "bg-amber-300" },
  { name: "Medium", color: "bg-amber-500" },
  { name: "Tan", color: "bg-amber-700" },
  { name: "Dark", color: "bg-amber-900" },
  { name: "Deep", color: "bg-amber-950" }
];
const voiceTypes = ["Male (Neutral)", "Female (Neutral)", "Male (Deep)", "Female (Soft)"];
const inputMethods = ["Text to Speech", "Upload Audio"];
const expressions = ["Neutral", "Happy", "Serious", "Surprised"];

export default function DigitalAvatarTool() {
  const [selectedAvatarType, setSelectedAvatarType] = useState(avatarTypes[0].id);
  const [faceShape, setFaceShape] = useState(faceShapes[0]);
  const [hairStyle, setHairStyle] = useState(hairStyles[0]);
  const [skinTone, setSkinTone] = useState(skinTones[0].name);
  const [voiceType, setVoiceType] = useState(voiceTypes[0]);
  const [inputMethod, setInputMethod] = useState(inputMethods[0]);
  const [avatarText, setAvatarText] = useState("");
  const [selectedExpression, setSelectedExpression] = useState(expressions[0]);
  const [motionIntensity, setMotionIntensity] = useState([70]);
  const [generatedAvatar, setGeneratedAvatar] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { consumeCreditsMutation } = useCredits();
  
  const avatarMutation = useMutation({
    mutationFn: async (data: { type: string; text: string }) => {
      const res = await apiRequest("POST", "/api/ai/avatar", data);
      return await res.json();
    },
  });
  
  const handleGenerateAvatar = async () => {
    if (avatarText.trim().length < 5 && inputMethod === "Text to Speech") {
      toast({
        title: "Text too short",
        description: "Please provide more text for the avatar to speak.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await consumeCreditsMutation.mutateAsync({
        amount: 100, // 100 credits per avatar generation
        service: "Digital Avatar Creation"
      });
      
      // Generate avatar (API call)
      const result = await avatarMutation.mutateAsync({
        type: selectedAvatarType,
        text: avatarText,
      });
      
      setGeneratedAvatar(result.avatarUrl);
      
    } catch (error) {
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
        <h1 className="text-2xl font-semibold mb-2">Digital Avatar Creation</h1>
        <p className="text-gray-600">Create animated digital avatars that can mimic facial expressions and lip-sync to audio.</p>
      </div>
      
      {/* Avatar Creation Container */}
      <div className="bg-white rounded-xl shadow-sm border border-border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Side - Avatar Settings */}
          <div>
            <div className="mb-6">
              <h3 className="text-md font-medium mb-4">1. Select Avatar Type</h3>
              <div className="grid grid-cols-3 gap-3">
                {avatarTypes.map((type) => (
                  <Card 
                    key={type.id}
                    className={`border-2 p-2 text-center cursor-pointer ${
                      selectedAvatarType === type.id 
                        ? 'border-primary bg-blue-50' 
                        : 'border-gray-200 hover:border-primary'
                    }`}
                    onClick={() => setSelectedAvatarType(type.id)}
                  >
                    <CardContent className="p-2">
                      <div className="aspect-square rounded-lg bg-gray-200 mb-2 overflow-hidden">
                        <img src={type.image} alt={type.name} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-xs font-medium">{type.name}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-md font-medium mb-4">2. Customize Appearance</h3>
              <div className="space-y-4">
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">
                    Face Shape
                  </Label>
                  <Select value={faceShape} onValueChange={setFaceShape}>
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {faceShapes.map((shape) => (
                        <SelectItem key={shape} value={shape}>{shape}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">
                    Hair Style
                  </Label>
                  <Select value={hairStyle} onValueChange={setHairStyle}>
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {hairStyles.map((style) => (
                        <SelectItem key={style} value={style}>{style}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">
                    Skin Tone
                  </Label>
                  <div className="flex space-x-2">
                    {skinTones.map((tone) => (
                      <div
                        key={tone.name}
                        className={`w-8 h-8 rounded-full ${tone.color} cursor-pointer ${
                          skinTone === tone.name 
                            ? 'border-2 border-primary' 
                            : 'border border-gray-300'
                        }`}
                        onClick={() => setSkinTone(tone.name)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-md font-medium mb-4">3. Voice & Speech</h3>
              <div className="mb-4">
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Voice Type
                </Label>
                <Select value={voiceType} onValueChange={setVoiceType}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {voiceTypes.map((voice) => (
                      <SelectItem key={voice} value={voice}>{voice}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Input Method
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {inputMethods.map((method) => (
                    <div 
                      key={method}
                      className={`border rounded-lg p-3 text-center cursor-pointer ${
                        inputMethod === method
                          ? 'bg-blue-50 border-primary'
                          : 'border-gray-300 hover:bg-blue-50 hover:border-primary'
                      }`}
                      onClick={() => setInputMethod(method)}
                    >
                      <span className="text-xs font-medium">{method}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {inputMethod === "Text to Speech" && (
                <div className="mt-4">
                  <Label 
                    htmlFor="avatarText" 
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Text for Avatar to Speak
                  </Label>
                  <Textarea
                    id="avatarText"
                    value={avatarText}
                    onChange={(e) => setAvatarText(e.target.value)}
                    placeholder="Enter what you want your avatar to say..."
                    className="w-full text-sm"
                    rows={3}
                  />
                </div>
              )}
              
              {inputMethod === "Upload Audio" && (
                <div className="mt-4 border border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <Button variant="outline" className="w-full">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Upload Audio File
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">MP3, WAV files up to 10MB</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Right Side - Avatar Preview */}
          <div>
            <h3 className="text-md font-medium mb-4">Avatar Preview</h3>
            <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-100 aspect-square flex items-center justify-center relative">
              {generatedAvatar ? (
                <img src={generatedAvatar} alt="Avatar preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-6">
                  <div className="bg-primary bg-opacity-10 rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-2">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-gray-500">Your avatar will appear here</p>
                  <p className="text-xs text-gray-400 mt-1">Customize and hit generate</p>
                </div>
              )}
              
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                <div className="flex items-center justify-between text-white">
                  <Button variant="ghost" className="text-white hover:bg-white/20 p-2">
                    <PlayCircle className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" className="text-white hover:bg-white/20 p-2">
                    <Download className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Expressions</span>
                <span>Motion Intensity</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex flex-wrap gap-2">
                    {expressions.map((expression) => (
                      <Button
                        key={expression}
                        variant="outline"
                        size="sm"
                        className={`
                          rounded-full text-xs font-medium px-3 py-1 h-auto
                          ${selectedExpression === expression 
                            ? 'bg-blue-50 text-primary border-primary' 
                            : 'bg-gray-100 hover:bg-blue-50 hover:text-primary border-gray-200 hover:border-primary'}
                        `}
                        onClick={() => setSelectedExpression(expression)}
                      >
                        {expression}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Slider
                    value={motionIntensity}
                    onValueChange={setMotionIntensity}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-between items-center">
              <div className="flex items-center text-sm text-gray-500">
                <svg className="w-4 h-4 mr-1 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                <span>100 credits per avatar</span>
              </div>
              
              <Button
                onClick={handleGenerateAvatar}
                disabled={avatarMutation.isPending}
              >
                {avatarMutation.isPending ? "Generating..." : "Generate Avatar"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function User(props: any) {
  return (
    <svg 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      viewBox="0 0 24 24" 
      className={props.className}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
    </svg>
  );
}
