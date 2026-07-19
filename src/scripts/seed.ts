import { loadEnvConfig } from "@next/env";
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

// Load environment variables
loadEnvConfig(process.cwd());

const uri = process.env.MONGO_DB_URI;
const dbName = process.env.AUTH_DB_NAME || "me_gear_pcs_db";

if (!uri) {
  console.error("Error: MONGO_DB_URI is not defined in the environment variables.");
  process.exit(1);
}

async function seed() {
  console.log("Connecting to MongoDB...");
  const client = new MongoClient(uri!);
  
  try {
    await client.connect();
    console.log("Connected successfully.");
    const db = client.db(dbName);

    const usersToSeed = [
      {
        name: "Demo User",
        email: "demo@megears.com",
        password: "demo123",
        role: "user",
      },
      {
        name: "Admin User",
        email: "admin@megears.com",
        password: "admin123",
        role: "admin",
      },
    ];

    for (const u of usersToSeed) {
      console.log(`Processing user: ${u.email}...`);
      const lowercaseEmail = u.email.toLowerCase();
      const hashedPassword = await bcrypt.hash(u.password, 10);

      // Check if user exists
      const existingUser = await db.collection("user").findOne({ email: lowercaseEmail });
      let userId: string;

      if (!existingUser) {
        // Insert user record
        userId = new ObjectId().toString();
        await db.collection("user").insertOne({
          _id: userId,
          name: u.name,
          email: lowercaseEmail,
          emailVerified: true,
          image: null,
          role: u.role,
          phone: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);
        console.log(`Created new user with ID: ${userId}`);
      } else {
        // Update user record (preserve _id)
        userId = existingUser._id.toString();
        await db.collection("user").updateOne(
          { _id: userId } as any,
          {
            $set: {
              name: u.name,
              role: u.role,
              updatedAt: new Date(),
            },
          }
        );
        console.log(`Updated existing user with ID: ${userId}`);
      }

      // Check if credential account exists
      const existingAccount = await db.collection("account").findOne({
        userId: userId,
        providerId: "credential",
      });

      if (!existingAccount) {
        // Insert account record
        const accountId = new ObjectId().toString();
        await db.collection("account").insertOne({
          _id: accountId,
          userId: userId,
          accountId: lowercaseEmail,
          providerId: "credential",
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);
        console.log(`Created new account record for: ${lowercaseEmail}`);
      } else {
        // Update account password
        await db.collection("account").updateOne(
          { userId: userId, providerId: "credential" } as any,
          {
            $set: {
              accountId: lowercaseEmail,
              password: hashedPassword,
              updatedAt: new Date(),
            },
          }
        );
        console.log(`Updated credentials for: ${lowercaseEmail}`);
      }
    }

    console.log("Seeding process completed successfully.");
  } catch (error) {
    console.error("Seeding failed with error:", error);
  } finally {
    await client.close();
    console.log("MongoDB connection closed.");
  }
}

seed();
