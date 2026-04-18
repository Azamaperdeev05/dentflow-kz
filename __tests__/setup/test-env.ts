import path from "node:path";

const dbPath = path.resolve(process.cwd(), "prisma", "test.db").replace(/\\/g, "/");

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = `file:${dbPath}`;
