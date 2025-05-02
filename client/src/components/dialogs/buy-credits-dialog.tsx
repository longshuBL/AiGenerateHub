import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Info, X, Zap } from "lucide-react";
import { useCredits } from "@/hooks/use-credits";
import { cn } from "@/lib/utils";

interface CreditPackage {
  id: string;
  name: string;
  amount: number;
  price: string;
  popular?: boolean;
  features: string[];
  savings?: string;
}

const creditPackages: CreditPackage[] = [
  {
    id: "starter",
    name: "Starter",
    amount: 1000,
    price: "$9.99",
    features: ["~100 AI chat responses", "~20 image generations"],
  },
  {
    id: "pro",
    name: "Pro",
    amount: 5000,
    price: "$39.99",
    popular: true,
    features: ["~500 AI chat responses", "~100 image generations", "20% savings"],
    savings: "20%",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    amount: 20000,
    price: "$129.99",
    features: ["Unlimited AI chat", "~400 image generations", "35% savings"],
    savings: "35%",
  },
];

interface BuyCreditsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BuyCreditsDialog({ isOpen, onClose }: BuyCreditsDialogProps) {
  const [selectedPackage, setSelectedPackage] = useState<string>("pro");
  const { purchaseCreditsMutation } = useCredits();
  
  const handlePurchase = () => {
    const packageData = creditPackages.find(pkg => pkg.id === selectedPackage);
    if (packageData) {
      purchaseCreditsMutation.mutate({
        amount: packageData.amount,
        package: packageData.name
      }, {
        onSuccess: () => {
          onClose();
        }
      });
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader className="flex justify-between items-center">
          <div>
            <DialogTitle className="text-xl font-semibold">Buy Credits</DialogTitle>
            <DialogDescription>
              Select a credit package to continue using our AI tools
            </DialogDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
          {creditPackages.map((pkg) => (
            <div
              key={pkg.id}
              className={cn(
                "border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md",
                selectedPackage === pkg.id ? "border-primary bg-primary/5" : "border-gray-200 hover:border-primary",
                pkg.popular && "relative"
              )}
              onClick={() => setSelectedPackage(pkg.id)}
            >
              {pkg.popular && (
                <div className="absolute -top-3 -right-3 bg-primary text-white text-xs py-1 px-2 rounded-full">
                  Popular
                </div>
              )}
              
              <div className="bg-blue-50 rounded-full w-8 h-8 flex items-center justify-center mb-3">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              
              <h4 className="font-semibold mb-1">{pkg.name}</h4>
              <p className="text-2xl font-bold mb-1">
                {pkg.amount.toLocaleString()} <span className="text-sm font-normal text-gray-500">credits</span>
              </p>
              <p className="text-primary font-medium mb-3">{pkg.price}</p>
              
              <ul className="text-sm text-gray-600 space-y-1 mb-4">
                {pkg.features.map((feature, i) => (
                  <li key={i} className="flex items-center">
                    <Check className="w-4 h-4 text-secondary mr-1" />
                    {feature}
                  </li>
                ))}
              </ul>
              
              <Button
                className="w-full"
                variant={selectedPackage === pkg.id ? "default" : "outline"}
                onClick={() => setSelectedPackage(pkg.id)}
              >
                {selectedPackage === pkg.id ? "Selected" : "Select"}
              </Button>
            </div>
          ))}
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Info className="w-5 h-5 text-primary mr-2" />
            <span className="text-sm font-medium">Credits Reference</span>
          </div>
          
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-600">
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-primary mr-2"></span>
              AI Chat: ~10 credits/response
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-secondary mr-2"></span>
              Image Generation: ~50 credits/image
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-purple-500 mr-2"></span>
              Video Generation: ~200 credits/video
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-orange-500 mr-2"></span>
              Avatar Creation: ~100 credits/avatar
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            className="w-full"
            onClick={handlePurchase}
            disabled={purchaseCreditsMutation.isPending}
          >
            {purchaseCreditsMutation.isPending ? "Processing..." : "Purchase Credits"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
