import { drizzle } from "drizzle-orm/node-postgres";

export const orm = drizzle(process.env.DATABASE_URL!);
