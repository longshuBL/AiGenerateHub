import { ImageGenerationRequest, ImageGenerationResponse } from '@shared/image';
import fetch from 'node-fetch';

// 通义万相API配置
const API_KEY = 'sk-dfee5de9defc43668ed166583e3e443f';
// API文档URL: https://help.aliyun.com/document_detail/2862677.html
// 使用标准API接口（不需要加/async后缀，而是使用请求头控制异步模式）
const API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis';
// 查询任务结果API
const TASK_API_URL = 'https://dashscope.aliyuncs.com/api/v1/tasks/';
// 使用正确的模型名称
const MODEL = 'wanx2.1-t2i-turbo';

// 默认轮询间隔(毫秒)
const DEFAULT_POLLING_INTERVAL = 2000;
// 最大轮询次数
const MAX_POLLING_ATTEMPTS = 30;

/**
 * 调用通义万相API生成图像 (异步模式)
 */
export async function generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
  try {
    // 记录API请求，用于开发调试
    console.log('图像生成请求参数:', JSON.stringify(request, null, 2));
    
    // 构建请求体
    const requestBody: {
      model: string;
      input: {
        prompt: string;
        negative_prompt: string;
      };
      parameters: {
        size: string;
        n: number;
        style: string;
        seed?: number; // 可选参数
      };
    } = {
      model: MODEL,
      input: {
        prompt: request.prompt,
        negative_prompt: request.negative_prompt || "",
      },
      parameters: {
        size: `${request.width || 1024}*${request.height || 1024}`,  // 使用正确的尺寸格式 "width*height"
        n: request.n || 1,
        style: request.style || "anime"
      }
    };
    
    // 添加种子值（如果提供）
    if (request.seed !== undefined) {
      requestBody.parameters.seed = request.seed;
    }
    
    console.log('发送到API的请求体:', JSON.stringify(requestBody, null, 2));
    
    // 发起异步任务请求
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'X-DashScope-Async': 'enable'  // 使用请求头指定异步模式
      },
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();
    console.log('API原始响应:', responseText);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`API响应不是有效的JSON: ${responseText}`);
    }
    
    if (!response.ok) {
      console.error('通义万相API调用失败:', responseData);
      throw new Error(`API请求失败: ${responseData.message || response.statusText}`);
    }

    // 获取任务ID并等待结果
    if (!responseData.output || !responseData.output.task_id) {
      throw new Error(`API响应格式错误，找不到task_id: ${JSON.stringify(responseData)}`);
    }
    
    const taskId = responseData.output.task_id;
    console.log('图像生成任务已提交，任务ID:', taskId);
    
    // 查询任务状态并等待结果
    const result = await pollTaskResult(taskId);
    console.log('最终任务结果:', JSON.stringify(result, null, 2));
    
    // 检查结果格式并从正确的位置提取图像URL
    if (!result.output) {
      throw new Error(`任务结果格式错误，缺少output字段: ${JSON.stringify(result)}`);
    }
    
    // 检查是否存在results数组
    if (!result.output.results || !Array.isArray(result.output.results) || result.output.results.length === 0) {
      throw new Error(`任务结果格式错误，找不到有效的results数组: ${JSON.stringify(result)}`);
    }
    
    // 获取第一个成功的结果
    const firstResult = result.output.results[0];
    
    // 检查结果是否包含错误代码
    if (firstResult.code) {
      throw new Error(`任务生成图像失败: ${firstResult.message || firstResult.code}`);
    }
    
    // 确保URL存在
    if (!firstResult.url) {
      throw new Error(`任务结果中缺少图像URL: ${JSON.stringify(firstResult)}`);
    }
    
    // 将API响应转换为我们定义的格式
    return {
      imageUrl: firstResult.url,
      model: MODEL,
      credits: 0, // 这个值将由路由处理替换
      usage: {
        prompt_tokens: result.usage?.total_tokens || 0,
        total_tokens: result.usage?.total_tokens || 0
      }
    };
  } catch (error) {
    console.error('调用通义万相API出错:', error);
    throw error;
  }
}

/**
 * 轮询查询任务结果
 * @param taskId 任务ID
 */
async function pollTaskResult(taskId: string, 
                              pollingInterval = DEFAULT_POLLING_INTERVAL, 
                              maxAttempts = MAX_POLLING_ATTEMPTS) {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    attempts++;
    
    try {
      console.log(`查询任务状态，第${attempts}次尝试...`);
      const response = await fetch(`${TASK_API_URL}${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_KEY}`
        }
      });
      
      const responseText = await response.text();
      console.log(`任务查询响应 #${attempts}:`, responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error(`任务查询响应不是有效的JSON: ${responseText}`);
        throw new Error(`任务查询响应不是有效的JSON: ${responseText}`);
      }
      
      if (!response.ok) {
        console.error('查询任务状态失败:', data);
        throw new Error(`任务查询失败: ${data.message || response.statusText}`);
      }
      
      // 检查响应格式
      if (!data.output || !data.output.task_status) {
        throw new Error(`任务查询响应格式错误，找不到task_status: ${JSON.stringify(data)}`);
      }
      
      console.log(`任务状态: ${data.output.task_status}`);
      
      // 任务完成
      if (data.output.task_status === 'SUCCEEDED') {
        console.log('任务已完成，返回结果');
        return data;
      }
      
      // 任务失败
      if (data.output.task_status === 'FAILED') {
        console.error('任务失败:', data.output.task_metrics || data.output);
        throw new Error(`任务处理失败: ${data.output.message || '未知错误'}`);
      }
      
      // 等待后再次查询
      await new Promise(resolve => setTimeout(resolve, pollingInterval));
    } catch (error) {
      console.error(`查询任务出错 #${attempts}:`, error);
      if (attempts >= maxAttempts) {
        throw error;
      }
      
      // 发生错误，等待后重试
      await new Promise(resolve => setTimeout(resolve, pollingInterval));
    }
  }
  
  throw new Error(`任务查询超时，已尝试${maxAttempts}次`);
} 