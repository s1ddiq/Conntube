// lib/drizzle.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

// Check if we're in production
const globalForDb = globalThis as unknown as { conn: postgres.Sql | undefined };

const client = globalForDb.conn ?? postgres(process.env.DATABASE_URL!);

if (process.env.NODE_ENV !== "production") globalForDb.conn = client;

export const db = drizzle(client, { schema });
