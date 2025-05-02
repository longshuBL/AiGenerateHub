import { ChatMessage, ChatResponse } from '@shared/chat';
import fetch from 'node-fetch';

// 通义千问API配置
const QWEN_API_KEY = 'sk-dfee5de9defc43668ed166583e3e443f';
const QWEN_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
const MODEL = 'qwen-turbo';

/**
 * 调用通义千问API生成聊天回复
 */
export async function generateChatCompletion(messages: ChatMessage[]): Promise<ChatResponse> {
  try {
    const response = await fetch(QWEN_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${QWEN_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        input: {
          messages: messages
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('通义千问API调用失败:', errorData);
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // 将API响应转换为我们定义的格式
    return {
      message: {
        role: 'assistant',
        content: data.output.text
      },
      usage: {
        prompt_tokens: data.usage.input_tokens,
        completion_tokens: data.usage.output_tokens,
        total_tokens: data.usage.input_tokens + data.usage.output_tokens
      }
    };
  } catch (error) {
    console.error('调用通义千问API出错:', error);
    throw error;
  }
} 