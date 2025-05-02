import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { generateChatCompletion } from "./qwen-api";
import { generateImage } from "./image-api";
import { ChatMessage } from "@shared/chat";
import { ImageGenerationRequest } from "@shared/image";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Get user credits
  app.get("/api/credits", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = req.user!.id;
      const credits = await storage.getUserCredits(userId);
      return res.status(200).json({ credits });
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch credits" });
    }
  });

  // Add credits to user account
  app.post("/api/credits/purchase", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const schema = z.object({
      amount: z.number().int().positive(),
      package: z.string()
    });
    
    try {
      const { amount, package: packageName } = schema.parse(req.body);
      const userId = req.user!.id;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Add credits to user account
      const updatedCredits = user.credits + amount;
      await storage.updateUserCredits(userId, updatedCredits);
      
      // Record the transaction
      await storage.addTransaction({
        userId,
        amount,
        type: "purchase",
        description: `Purchased ${packageName} package`,
        timestamp: new Date().toISOString()
      });
      
      return res.status(200).json({ credits: updatedCredits });
    } catch (error) {
      return res.status(400).json({ message: "Invalid request" });
    }
  });

  // Add credits through reward ad
  app.post("/api/credits/reward", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = req.user!.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Add 10 credits for watching an ad
      const rewardAmount = 10;
      const updatedCredits = user.credits + rewardAmount;
      await storage.updateUserCredits(userId, updatedCredits);
      
      // Record the transaction
      await storage.addTransaction({
        userId,
        amount: rewardAmount,
        type: "reward",
        description: "Reward for watching ad",
        timestamp: new Date().toISOString()
      });
      
      return res.status(200).json({ credits: updatedCredits });
    } catch (error) {
      return res.status(500).json({ message: "Failed to add reward credits" });
    }
  });

  // Use credits for AI service
  app.post("/api/credits/consume", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const schema = z.object({
      amount: z.number().int().positive(),
      service: z.string(),
    });
    
    try {
      const { amount, service } = schema.parse(req.body);
      const userId = req.user!.id;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user has enough credits
      if (user.credits < amount) {
        return res.status(402).json({ 
          message: "Insufficient credits",
          credits: user.credits,
          required: amount
        });
      }
      
      // Deduct credits
      const updatedCredits = user.credits - amount;
      await storage.updateUserCredits(userId, updatedCredits);
      
      // Record the transaction
      await storage.addTransaction({
        userId,
        amount: -amount,
        type: "consumption",
        description: `Used ${service}`,
        timestamp: new Date().toISOString()
      });
      
      return res.status(200).json({ credits: updatedCredits });
    } catch (error) {
      return res.status(400).json({ message: "Invalid request" });
    }
  });

  // Get user transactions
  app.get("/api/transactions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = req.user!.id;
      const transactions = await storage.getUserTransactions(userId);
      return res.status(200).json(transactions);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // 聊天API端点，调用通义千问大模型
  app.post("/api/ai/chat", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const schema = z.object({
      messages: z.array(z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string().min(1)
      })).min(1),
    });
    
    try {
      const { messages } = schema.parse(req.body);
      
      // 信用点消耗计算，每次请求消耗5个积分
      const costPerRequest = 5;
      const userId = req.user!.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // 检查用户是否有足够的积分
      if (user.credits < costPerRequest) {
        return res.status(402).json({ 
          message: "积分不足",
          credits: user.credits,
          required: costPerRequest
        });
      }
      
      // 调用通义千问API
      const response = await generateChatCompletion(messages as ChatMessage[]);
      
      // 扣除积分
      const updatedCredits = user.credits - costPerRequest;
      await storage.updateUserCredits(userId, updatedCredits);
      
      // 记录交易
      await storage.addTransaction({
        userId,
        amount: -costPerRequest,
        type: "consumption",
        description: "通义千问聊天",
        timestamp: new Date().toISOString()
      });
      
      return res.status(200).json({
        ...response,
        credits: updatedCredits
      });
    } catch (error) {
      console.error("聊天API调用出错:", error);
      return res.status(500).json({ message: "聊天请求处理失败" });
    }
  });

  app.post("/api/ai/image", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const schema = z.object({
      prompt: z.string().min(1),
      negative_prompt: z.string().optional(),
      style: z.string().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
      n: z.number().optional(),
      seed: z.number().optional()
    });
    
    try {
      const imageRequest = schema.parse(req.body) as ImageGenerationRequest;
      
      // 图像生成消耗15积分
      const costPerRequest = 15;
      const userId = req.user!.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "用户不存在" });
      }
      
      // 检查用户是否有足够的积分
      if (user.credits < costPerRequest) {
        return res.status(402).json({ 
          message: "积分不足",
          credits: user.credits,
          required: costPerRequest
        });
      }
      
      // 首先扣除积分，避免用户在等待过程中关闭页面而未扣费
      const updatedCredits = user.credits - costPerRequest;
      await storage.updateUserCredits(userId, updatedCredits);
      
      // 记录交易
      await storage.addTransaction({
        userId,
        amount: -costPerRequest,
        type: "consumption",
        description: "通义万相图像生成",
        timestamp: new Date().toISOString()
      });
      
      // 调用通义万相图像生成API (异步)
      const response = await generateImage(imageRequest);
      
      return res.status(200).json({
        ...response,
        credits: updatedCredits
      });
    } catch (error) {
      console.error("图像生成API调用出错:", error);
      return res.status(500).json({ 
        message: typeof error === 'object' && error !== null && 'message' in error 
          ? (error as Error).message 
          : "图像生成请求处理失败" 
      });
    }
  });

  app.post("/api/ai/video", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const schema = z.object({
      prompt: z.string().min(1),
      duration: z.string().optional(),
      resolution: z.string().optional(),
    });
    
    try {
      schema.parse(req.body);
      // In a real app, this would call Alibaba's AI API
      return res.status(200).json({
        videoUrl: "https://placehold.co/600x400/1677FF/FFFFFF?text=AI+Generated+Video",
        model: "Alibaba Tongyi Video Gen"
      });
    } catch (error) {
      return res.status(400).json({ message: "Invalid request" });
    }
  });

  app.post("/api/ai/avatar", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const schema = z.object({
      type: z.string(),
      text: z.string().min(1),
    });
    
    try {
      schema.parse(req.body);
      // In a real app, this would call Alibaba's AI API
      return res.status(200).json({
        avatarUrl: "https://placehold.co/400x400/1677FF/FFFFFF?text=AI+Avatar",
        model: "Alibaba Tongyi Avatar"
      });
    } catch (error) {
      return res.status(400).json({ message: "Invalid request" });
    }
  });

  app.post("/api/ai/voice", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const schema = z.object({
      text: z.string().min(1),
      voice: z.string(),
    });
    
    try {
      schema.parse(req.body);
      // In a real app, this would call Alibaba's AI API
      return res.status(200).json({
        audioUrl: "https://example.com/audio.mp3",
        model: "Alibaba Tongyi Voice"
      });
    } catch (error) {
      return res.status(400).json({ message: "Invalid request" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
