import { createContext, useContext, ReactNode, useState, useEffect } from 'react';

// Inline implementation of useLocalStorage to avoid import issues
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

type Language = 'zh' | 'en';

type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
};

const translations: Record<string, Record<Language, string>> = {
  // Navigation
  'ai.chat': {
    en: 'AI Chat',
    zh: 'AI 聊天'
  },
  'image.generation': {
    en: 'Image Generation',
    zh: '图像生成'
  },
  'video.generation': {
    en: 'Video Generation',
    zh: '视频生成'
  },
  'digital.avatar': {
    en: 'Digital Avatar',
    zh: '数字人物'
  },
  'voice.synthesis': {
    en: 'Voice Synthesis',
    zh: '语音合成'
  },
  'watch.ads': {
    en: 'Watch Ads',
    zh: '观看广告'
  },
  'account': {
    en: 'Account',
    zh: '账户'
  },
  'credits.billing': {
    en: 'Credits & Billing',
    zh: '积分与账单'
  },
  'settings.menu': {
    en: 'Settings',
    zh: '设置'
  },
  'free.plan': {
    en: 'Free Plan',
    zh: '免费版'
  },
  'ai.tools': {
    en: 'AI Tools',
    zh: 'AI 工具'
  },
  
  // Headers and titles
  'app.title': {
    en: 'Metaverse AI',
    zh: '元界AI'
  },
  'credits': {
    en: 'Credits',
    zh: '积分'
  },
  'get.credits': {
    en: 'Get Credits',
    zh: '获取积分'
  },
  'buy.credits': {
    en: 'Buy Credits',
    zh: '购买积分'
  },
  'language': {
    en: 'Language',
    zh: '语言'
  },
  'english': {
    en: 'English',
    zh: '英文'
  },
  'chinese': {
    en: 'Chinese',
    zh: '中文'
  },
  
  // Digital avatar page
  'lip.sync': {
    en: 'Lip Sync',
    zh: '唇形同步'
  },
  'action.imitation': {
    en: 'Action Imitation',
    zh: '动作模仿'
  },
  'upload.video': {
    en: 'Upload Video',
    zh: '上传视频'
  },
  'upload.audio': {
    en: 'Upload Audio',
    zh: '上传音频'
  },
  'upload.reference': {
    en: 'Upload Reference Image',
    zh: '上传参考图片'
  },
  'upload.character': {
    en: 'Upload Character Image',
    zh: '上传角色图片'
  },
  'upload.action': {
    en: 'Upload Action Video',
    zh: '上传动作视频'
  },
  'generate.video': {
    en: 'Generate Video',
    zh: '生成视频'
  },
  
  // Ad watching page
  'watch.ads.earn': {
    en: 'Watch Ads & Earn Credits',
    zh: '观看广告赚取积分'
  },
  'ads.available': {
    en: 'Available Ads',
    zh: '可观看的广告'
  },
  'ad.worth': {
    en: 'Worth',
    zh: '价值'
  },
  'ad.credits': {
    en: 'credits',
    zh: '积分'
  },
  'ad.watch': {
    en: 'Watch',
    zh: '观看'
  },
  'ad.watched': {
    en: 'Watched',
    zh: '已观看'
  },
  'ad.history': {
    en: 'Watch History',
    zh: '观看历史'
  },
  
  // Image and Video Generation
  'image.preview': {
    en: 'Image Preview',
    zh: '图像预览'
  },
  'video.preview': {
    en: 'Video Preview',
    zh: '视频预览'
  },
  'generate.image': {
    en: 'Generate Image',
    zh: '生成图像'
  },
  'prompt': {
    en: 'Prompt',
    zh: '提示词'
  },
  'style': {
    en: 'Style',
    zh: '风格'
  },
  'aspect.ratio': {
    en: 'Aspect Ratio',
    zh: '长宽比'
  },
  'preview.tip': {
    en: 'Your result will appear here',
    zh: '您的结果将显示在这里'
  },
  'loading': {
    en: 'Loading...',
    zh: '加载中...'
  },
  'get.points.options': {
    en: 'Get Points Options',
    zh: '获取积分选项'
  },
  'watch.ad.earn.credits': {
    en: 'Watch ads to earn credits',
    zh: '观看广告赚取积分'
  },
  
  // Settings and billing pages
  'settings.title': {
    en: 'Settings Page',
    zh: '设置页面'
  },
  'account.settings': {
    en: 'Account Settings',
    zh: '账户设置'
  },
  'profile': {
    en: 'Profile',
    zh: '个人资料'
  },
  'appearance': {
    en: 'Appearance',
    zh: '外观'
  },
  'billing': {
    en: 'Billing',
    zh: '账单'
  },
  'dark.mode': {
    en: 'Dark Mode',
    zh: '暗色模式'
  },
  'light.mode': {
    en: 'Light Mode',
    zh: '亮色模式'
  },
  'system.default': {
    en: 'System Default',
    zh: '系统默认'
  },
  'theme': {
    en: 'Theme',
    zh: '主题'
  },
  'notification': {
    en: 'Notification',
    zh: '通知'
  },
  'notification.settings': {
    en: 'Notification Settings',
    zh: '通知设置'
  },
  'credit.transactions': {
    en: 'Credit Transactions',
    zh: '积分交易'
  },
  'transaction.history': {
    en: 'Transaction History',
    zh: '交易历史'
  },
  'date': {
    en: 'Date',
    zh: '日期'
  },
  'transaction': {
    en: 'Transaction',
    zh: '交易'
  },
  'amount': {
    en: 'Amount',
    zh: '数量'
  },
  'type': {
    en: 'Type',
    zh: '类型'
  },
  'balance': {
    en: 'Balance',
    zh: '余额'
  },
  'purchase': {
    en: 'Purchase',
    zh: '购买'
  },
  'usage': {
    en: 'Usage',
    zh: '使用'
  },
  'reward': {
    en: 'Reward',
    zh: '奖励'
  },
  'upload': {
    en: 'Upload',
    zh: '上传'
  },
  'save': {
    en: 'Save',
    zh: '保存'
  },
  'cancel': {
    en: 'Cancel',
    zh: '取消'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useLocalStorage<Language>('app-language', 'zh');
  
  const translate = (key: string): string => {
    if (!translations[key]) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    return translations[key][language];
  };
  
  const value = {
    language,
    setLanguage,
    t: translate
  };
  
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.setAttribute('data-language', language);
  }, [language]);
  
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}