import { users, transactions, type User, type InsertUser, type Transaction, type InsertTransaction } from "@shared/schema";
import { randomBytes } from "crypto";
import session from "express-session";
import { db } from "./db";
import { eq } from "drizzle-orm";
// 在开发环境中使用内存存储
import memorystore from "memorystore";
import { pool } from "./db";

// 使用内存存储替代PostgreSQL
const MemoryStore = memorystore(session);

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserCredits(userId: number, credits: number): Promise<User>;
  getUserCredits(userId: number): Promise<number>;
  addTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getUserTransactions(userId: number): Promise<Transaction[]>;
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  // 开发环境下的模拟用户
  mockUser: User | undefined;

  constructor() {
    // 判断是否为开发环境
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // 在开发环境中使用内存存储
    if (isDevelopment) {
      this.sessionStore = new MemoryStore({
        checkPeriod: 86400000 // 每天清理过期的会话
      });
    } else {
      // 在生产环境中使用PostgreSQL存储
      const PostgresSessionStore = require("connect-pg-simple")(session);
      this.sessionStore = new PostgresSessionStore({ 
        pool, 
        createTableIfMissing: true 
      });
    }
    
    // 在开发环境下创建模拟用户
    if (process.env.NODE_ENV === 'development') {
      this.mockUser = {
        id: 1,
        username: 'admin',
        password: 'hashed_password',
        credits: 1000,
        plan: "Pro",
        createdAt: new Date().toISOString()
      };
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    // 开发环境下返回模拟用户
    if (process.env.NODE_ENV === 'development' && id === 1) {
      return this.mockUser;
    }
    
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // 开发环境下返回模拟用户
    if (process.env.NODE_ENV === 'development' && username === 'admin') {
      return this.mockUser;
    }
    
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // 开发环境下返回模拟用户
    if (process.env.NODE_ENV === 'development') {
      this.mockUser = {
        id: 1,
        username: insertUser.username,
        password: insertUser.password,
        credits: 100,
        plan: "Free",
        createdAt: new Date().toISOString()
      };
      return this.mockUser;
    }
    
    const result = await db.insert(users).values({
      ...insertUser,
      credits: 100, // Start with 100 free credits
      plan: "Free"
    }).returning();
    
    return result[0];
  }

  async updateUserCredits(userId: number, credits: number): Promise<User> {
    // 开发环境下更新模拟用户
    if (process.env.NODE_ENV === 'development' && userId === 1 && this.mockUser) {
      this.mockUser.credits = credits;
      return this.mockUser;
    }
    
    const result = await db
      .update(users)
      .set({ credits })
      .where(eq(users.id, userId))
      .returning();
    
    if (result.length === 0) {
      throw new Error("User not found");
    }
    
    return result[0];
  }

  async getUserCredits(userId: number): Promise<number> {
    // 开发环境下返回模拟用户的积分
    if (process.env.NODE_ENV === 'development' && userId === 1 && this.mockUser) {
      return this.mockUser.credits;
    }
    
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    return user.credits;
  }

  async addTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    // 开发环境下返回模拟交易
    if (process.env.NODE_ENV === 'development') {
      return {
        id: 1,
        ...insertTransaction
      };
    }
    
    const result = await db
      .insert(transactions)
      .values(insertTransaction)
      .returning();
    
    return result[0];
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    // 开发环境下返回模拟交易
    if (process.env.NODE_ENV === 'development' && userId === 1) {
      return [{
        id: 1,
        userId: 1,
        amount: 100,
        type: "reward",
        description: "Welcome bonus credits",
        timestamp: new Date().toISOString()
      }];
    }
    
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(transactions.timestamp);
  }
}

export const storage = new DatabaseStorage();
