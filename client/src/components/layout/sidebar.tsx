import { useAuth } from "@/hooks/use-auth";
import { UserAvatar } from "./user-avatar";
import {
  MessageSquare,
  Image as ImageIcon,
  Video,
  User,
  Mic,
  CreditCard,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  PlayCircle
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";

// Inline implementation of useLocalStorage
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

interface SidebarProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ activeTool, onToolChange, isOpen, onClose }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  // 将侧边栏固定展开
  const collapsed = false; // 始终保持展开状态
  const { t } = useLanguage();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <>
      {/* Sidebar */}
      <aside 
        className={`fixed lg:relative ${collapsed ? 'w-20' : 'w-64'} h-full bg-background border-r border-border shadow-sm z-50 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-all duration-300 ease-in-out`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={`flex items-center justify-between ${collapsed ? 'px-4' : 'px-6'} py-4 border-b border-border`}>
            <div className="flex items-center">
              <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
              {!collapsed && <span className="ml-2 text-lg font-semibold text-foreground">{t('app.title')}</span>}
            </div>
            <button className="lg:hidden" onClick={onClose}>
              <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          {/* Navigation Items */}
          <nav className={`flex-1 ${collapsed ? 'px-2' : 'px-4'} py-4 overflow-y-auto`}>
            {!collapsed && <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2 pl-2">{t('ai.tools')}</p>}
            
            <SidebarItem 
              icon={<MessageSquare className={`w-5 h-5 ${collapsed ? 'mx-auto' : 'mr-3'} text-primary`} />}
              label={t('ai.chat')}
              isActive={activeTool === "aiChat"}
              onClick={() => onToolChange("aiChat")}
              collapsed={collapsed}
            />
            
            <SidebarItem 
              icon={<ImageIcon className={`w-5 h-5 ${collapsed ? 'mx-auto' : 'mr-3'} text-primary`} />}
              label={t('image.generation')}
              isActive={activeTool === "imageGen"}
              onClick={() => onToolChange("imageGen")}
              collapsed={collapsed}
            />
            
            <SidebarItem 
              icon={<Video className={`w-5 h-5 ${collapsed ? 'mx-auto' : 'mr-3'} text-primary`} />}
              label={t('video.generation')}
              isActive={activeTool === "videoGen"}
              onClick={() => onToolChange("videoGen")}
              collapsed={collapsed}
            />
            
            <SidebarItem 
              icon={<User className={`w-5 h-5 ${collapsed ? 'mx-auto' : 'mr-3'} text-primary`} />}
              label={t('digital.avatar')}
              isActive={activeTool === "avatar"}
              onClick={() => onToolChange("avatar")}
              collapsed={collapsed}
            />
            
            <SidebarItem 
              icon={<Mic className={`w-5 h-5 ${collapsed ? 'mx-auto' : 'mr-3'} text-primary`} />}
              label={t('voice.synthesis')}
              isActive={activeTool === "voice"}
              onClick={() => onToolChange("voice")}
              collapsed={collapsed}
            />
            
            <SidebarItem 
              icon={<PlayCircle className={`w-5 h-5 ${collapsed ? 'mx-auto' : 'mr-3'} text-primary`} />}
              label={t('watch.ads')}
              isActive={activeTool === "watchAds"}
              onClick={() => onToolChange("watchAds")}
              collapsed={collapsed}
            />
            
            <div className="border-t border-gray-200 my-4"></div>
            
            {!collapsed && <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2 pl-2">{t('account')}</p>}
            
            <SidebarItem 
              icon={<CreditCard className={`w-5 h-5 ${collapsed ? 'mx-auto' : 'mr-3'} text-primary`} />}
              label={t('credits.billing')}
              isActive={activeTool === "credits"}
              onClick={() => onToolChange("credits")}
              collapsed={collapsed}
            />
            
            <SidebarItem 
              icon={<Settings className={`w-5 h-5 ${collapsed ? 'mx-auto' : 'mr-3'} text-primary`} />}
              label={t('settings.menu')}
              isActive={activeTool === "settings"}
              onClick={() => onToolChange("settings")}
              collapsed={collapsed}
            />
          </nav>
          
          {/* User Profile */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <UserAvatar user={user} />
                {!collapsed && (
                  <div className="ml-3">
                    <p className="text-sm font-medium">{user?.username}</p>
                    <p className="text-xs text-gray-500">{user?.plan || t('free.plan')}</p>
                  </div>
                )}
              </div>
              {!collapsed ? (
                <div 
                  className="cursor-pointer text-gray-500 hover:text-gray-700"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5" />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </aside>
      

    </>
  );
}

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  collapsed?: boolean;
}

function SidebarItem({ icon, label, isActive, onClick, collapsed = false }: SidebarItemProps) {
  return (
    <div 
      className={`sidebar-item flex ${collapsed ? 'flex-col justify-center items-center' : 'items-center'} 
        px-2 py-3 mb-1 text-gray-700 rounded-md cursor-pointer hover:bg-gray-100 ${
        isActive ? 'bg-blue-50 border-l-2 border-primary' : ''
      }`}
      onClick={onClick}
      title={collapsed ? label : undefined}
    >
      {icon}
      {!collapsed && <span>{label}</span>}
      {collapsed && (
        <span className="text-xs mt-1 text-center">{label.split(' ')[0]}</span>
      )}
    </div>
  );
}
