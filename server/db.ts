import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// 使用Mock数据库还是真实数据库
const isDevelopment = process.env.NODE_ENV === 'development';

if (isDevelopment) {
  console.log('Using mock database in development mode');
}

// 仅在非开发环境下检查数据库URL
if (!isDevelopment && !process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

neonConfig.webSocketConstructor = ws;

// 创建一个模拟的数据库连接
class MockDb {
  async query() { return []; }
  select() { return { from: () => ({ where: () => Promise.resolve([]), all: () => Promise.resolve([]) }) }; }
  insert() { return { values: () => ({ returning: () => Promise.resolve([]) }) }; }
  update() { return { set: () => ({ where: () => Promise.resolve([]) }) }; }
  delete() { return { where: () => Promise.resolve([]) }; }
}

// 导出真实或模拟的数据库连接
export const pool = isDevelopment 
  ? { 
      end: async () => {},
      query: async () => ({ rows: [] })
    } as any
  : new Pool({ connectionString: process.env.DATABASE_URL as string });

export const db = isDevelopment
  ? new MockDb() as any
  : drizzle({ client: pool, schema });
