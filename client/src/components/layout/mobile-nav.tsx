import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileNavProps {
  onMenuClick: () => void;
}

export default function MobileNav({ onMenuClick }: MobileNavProps) {
  return (
    <div className="flex items-center lg:hidden">
      <Button 
        variant="ghost" 
        size="icon"
        onClick={onMenuClick}
      >
        <Menu className="h-6 w-6" />
      </Button>
    </div>
  );
}
