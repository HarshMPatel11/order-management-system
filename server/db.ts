import { MongoClient } from "mongodb";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const client = new MongoClient(process.env.DATABASE_URL);
export const db = client.db("order_flow_manager");
