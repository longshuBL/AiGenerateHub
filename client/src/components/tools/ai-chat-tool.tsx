import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Paperclip, Send, Image, MicIcon, Video } from "lucide-react";
import { UserAvatar } from "@/components/layout/user-avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useCredits } from "@/hooks/use-credits";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ChatMessage } from "@shared/chat";

// 记录聊天消息的类型
type DisplayMessageType = {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
};

export default function AIChatTool() {
  // 前端显示的消息
  const [displayMessages, setDisplayMessages] = useState<DisplayMessageType[]>([
    {
      id: "welcome-message",
      content: "您好！我是幻境AI助手。我可以帮助回答问题、创作内容、分析图像等。请问有什么可以帮您的？",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  
  // 发送给API的消息历史记录
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "您好！我是幻境AI助手。我可以帮助回答问题、创作内容、分析图像等。请问有什么可以帮您的？"
    }
  ]);
  
  const [input, setInput] = useState("");
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { user } = useAuth();
  const { consumeCreditsMutation } = useCredits();
  const { toast } = useToast();
  
  // 自动滚动到底部
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [displayMessages]);
  
  // 自动调整文本框高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(150, textareaRef.current.scrollHeight)}px`;
    }
  }, [input]);
  
  // 聊天API调用
  const chatMutation = useMutation({
    mutationFn: async (messages: ChatMessage[]) => {
      const res = await apiRequest("POST", "/api/ai/chat", { messages });
      return await res.json();
    },
  });
  
  const handleSendMessage = async () => {
    if (input.trim() === "") return;
    
    // 添加用户消息到显示列表
    const userMessage: DisplayMessageType = {
      id: `user-${Date.now()}`,
      content: input,
      sender: "user",
      timestamp: new Date(),
    };
    
    setDisplayMessages((prev) => [...prev, userMessage]);
    
    // 添加用户消息到API历史记录
    const userApiMessage: ChatMessage = {
      role: "user",
      content: input
    };
    
    setChatHistory((prev) => [...prev, userApiMessage]);
    setInput("");
    
    try {
      // 添加AI "思考中" 消息
      const thinkingId = `ai-thinking-${Date.now()}`;
      setDisplayMessages((prev) => [
        ...prev,
        {
          id: thinkingId,
          content: "思考中...",
          sender: "ai",
          timestamp: new Date(),
        },
      ]);
      
      // 获取AI回复
      const response = await chatMutation.mutateAsync([...chatHistory, userApiMessage]);
      
      // 将回复添加到API历史记录
      setChatHistory((prev) => [...prev, response.message]);
      
      // 替换"思考中"消息为实际回复
      setDisplayMessages((prev) => 
        prev.map(msg => 
          msg.id === thinkingId 
            ? { ...msg, id: `ai-${Date.now()}`, content: response.message.content } 
            : msg
        )
      );
      
      // 更新剩余积分
      if (response.credits !== undefined) {
        // 可以在这里更新积分显示
      }
    } catch (error: any) {
      toast({
        title: "错误",
        description: error.message || "请求失败，请稍后再试。",
        variant: "destructive",
      });
      
      // 移除"思考中"消息
      setDisplayMessages((prev) => prev.filter(msg => !msg.id.includes("thinking")));
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const clearChat = () => {
    // 重置聊天
    const initialMessage = {
      role: "assistant" as const,
      content: "聊天已清空。我能帮您做什么？"
    };
    
    setChatHistory([initialMessage]);
    setDisplayMessages([
      {
        id: "welcome-message",
        content: initialMessage.content,
        sender: "ai",
        timestamp: new Date(),
      },
    ]);
  };
  
  return (
    <div className="fadeIn">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">幻境AI助手</h1>
        <p className="text-gray-600">
          与强大的幻境AI助手对话，它可以理解和生成文本、分析图像、处理复杂问题。
        </p>
      </div>
      
      {/* 聊天容器 */}
      <div className="bg-white rounded-xl shadow-sm border border-border h-[calc(100vh-240px)] flex flex-col overflow-hidden">
        {/* 聊天消息区域 */}
        <div 
          className="flex-1 overflow-y-auto p-4 space-y-4" 
          ref={messagesContainerRef}
        >
          {displayMessages.map((message) => (
            <div 
              key={message.id} 
              className={`flex items-start mb-4 ${
                message.sender === "user" ? "justify-end" : ""
              }`}
            >
              {message.sender === "ai" && (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-primary mr-3 flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 01-.659 1.591L9.5 14.5M9.75 3.104c.251.023.501.05.75.082m0 0a24.301 24.301 0 014.5 0"></path>
                  </svg>
                </div>
              )}
              
              <div 
                className={`${
                  message.sender === "user" 
                    ? "bg-primary text-white" 
                    : "bg-gray-100 text-gray-800"
                } rounded-lg p-3 max-w-[85%]`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              
              {message.sender === "user" && (
                <div className="ml-3 flex-shrink-0">
                  <UserAvatar user={user} />
                </div>
              )}
            </div>
          ))}
          
          {/* 等待响应时的加载指示器 */}
          {chatMutation.isPending && !displayMessages.some(m => m.content.includes("思考中")) && (
            <div className="flex justify-center py-2">
              <div className="animate-pulse flex space-x-2">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              </div>
            </div>
          )}
        </div>
        
        {/* 输入区域 */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center space-x-2 mb-3">
            <button className="text-gray-500 hover:text-primary p-1 rounded-full hover:bg-blue-50 transition-colors">
              <Image className="w-5 h-5" />
            </button>
            <button className="text-gray-500 hover:text-primary p-1 rounded-full hover:bg-blue-50 transition-colors">
              <MicIcon className="w-5 h-5" />
            </button>
            <button className="text-gray-500 hover:text-primary p-1 rounded-full hover:bg-blue-50 transition-colors">
              <Video className="w-5 h-5" />
            </button>
            <button className="text-gray-500 hover:text-primary p-1 rounded-full hover:bg-blue-50 transition-colors">
              <Paperclip className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex items-center">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入您的问题..."
              className="flex-1 min-h-[42px] border-gray-300 rounded-l-lg resize-none focus:ring-2 focus:ring-primary focus:border-primary"
              rows={1}
            />
            <Button
              onClick={handleSendMessage}
              disabled={input.trim() === "" || chatMutation.isPending}
              className="rounded-l-none h-[42px]"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
            <div className="flex items-center">
              <Zap className="w-4 h-4 mr-1 text-primary" />
              <span>每次对话消耗5积分</span>
            </div>
            <div>
              <Button variant="link" className="text-primary p-0 h-auto" onClick={clearChat}>
                清空聊天
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Zap(props: any) {
  return (
    <svg 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2"
      strokeLinecap="round" 
      strokeLinejoin="round" 
      viewBox="0 0 24 24" 
      {...props}
    >
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}
