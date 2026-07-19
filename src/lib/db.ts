import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGO_DB_URI;
const dbName = process.env.AUTH_DB_NAME || "me_gear_pcs_db";

if (!uri) {
  throw new Error("Please add your MONGO_DB_URI to .env");
}

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  if (process.env.NODE_ENV === "development") {
    const globalWithMongo = global as typeof globalThis & {
      _mongoClient?: MongoClient;
      _mongoDb?: Db;
    };

    if (globalWithMongo._mongoClient && globalWithMongo._mongoDb) {
      cachedClient = globalWithMongo._mongoClient;
      cachedDb = globalWithMongo._mongoDb;
      return { client: cachedClient, db: cachedDb };
    }

    const client = new MongoClient(uri!);
    await client.connect();
    const db = client.db(dbName);

    globalWithMongo._mongoClient = client;
    globalWithMongo._mongoDb = db;
    cachedClient = client;
    cachedDb = db;

    return { client, db };
  }

  const client = new MongoClient(uri!);
  await client.connect();
  const db = client.db(dbName);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

// Create a single direct client instance for Better Auth
export const client = new MongoClient(uri!);
export const db = client.db(dbName);
