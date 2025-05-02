import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, PlayCircle } from "lucide-react";
import { useCredits } from "@/hooks/use-credits";

interface CreditWarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onBuyCredits: () => void;
  onWatchAd: () => void;
}

export default function CreditWarningDialog({
  isOpen,
  onClose,
  onBuyCredits,
  onWatchAd,
}: CreditWarningDialogProps) {
  const { watchAdForCreditsMutation } = useCredits();
  
  const handleWatchAd = () => {
    watchAdForCreditsMutation.mutate();
    onWatchAd();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-destructive bg-opacity-10 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
        </div>
        
        <DialogHeader>
          <DialogTitle className="text-center">Low Credit Balance</DialogTitle>
          <DialogDescription className="text-center">
            You're running low on credits. Some AI operations may be limited.
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
          <Button
            className="flex-1"
            onClick={onBuyCredits}
          >
            Buy Credits
          </Button>
          
          <Button
            className="flex-1 gap-2"
            variant="outline"
            onClick={handleWatchAd}
            disabled={watchAdForCreditsMutation.isPending}
          >
            <PlayCircle className="w-5 h-5 text-secondary" />
            {watchAdForCreditsMutation.isPending ? "Loading..." : "Watch Ad"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
