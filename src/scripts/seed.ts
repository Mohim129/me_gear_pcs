import { loadEnvConfig } from "@next/env";
import { MongoClient, ObjectId } from "mongodb";

// Load environment variables
loadEnvConfig(process.cwd());

const uri = process.env.MONGO_DB_URI;
const dbName = process.env.AUTH_DB_NAME || "me_gear_pcs_db";

if (!uri) {
  console.error("Error: MONGO_DB_URI is not defined in the environment variables.");
  process.exit(1);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function seed() {
  console.log("Connecting to MongoDB...");
  const client = new MongoClient(uri!);

  try {
    await client.connect();
    console.log("Connected successfully.");
    const db = client.db(dbName);

    // ── SEED USERS ──
    const { auth } = await import("../lib/auth");
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

      // Find and delete the existing user and account to avoid collisions
      const existingUser = await db.collection("user").findOne({ email: lowercaseEmail });
      if (existingUser) {
        const userId = existingUser._id;
        await db.collection("user").deleteOne({ _id: userId } as any);
        await db.collection("account").deleteMany({ userId: userId } as any);
        await db.collection("session").deleteMany({ userId: userId } as any);
        console.log(`Deleted existing user/accounts for ${lowercaseEmail}`);
      }

      // Call Better Auth's signUpEmail
      try {
        await auth.api.signUpEmail({
          body: {
            email: lowercaseEmail,
            password: u.password,
            name: u.name,
          },
        });
        console.log(`Successfully signed up ${lowercaseEmail} programmatically.`);

        // Now update the user's role and emailVerified directly in the database
        await db.collection("user").updateOne(
          { email: lowercaseEmail },
          {
            $set: {
              role: u.role,
              emailVerified: true,
            },
          }
        );
        console.log(`Set role to "${u.role}" for ${lowercaseEmail}`);
      } catch (err: any) {
        console.error(`Failed to register ${lowercaseEmail}:`, err?.message || err);
      }
    }

    // ── SEED CATEGORIES ──
    console.log("\nSeeding categories...");
    const categoryNames = [
      "CPU",
      "GPU",
      "Motherboard",
      "RAM",
      "Storage",
      "PSU",
      "Casing",
      "Cooler",
      "Monitor",
      "Keyboard",
      "Mouse",
      "Headphone",
      "Speaker",
      "Pre-built PC",
      "Laptop",
    ];

    for (const name of categoryNames) {
      const slug = slugify(name);
      const existing = await db.collection("categories").findOne({ slug });
      if (!existing) {
        await db.collection("categories").insertOne({
          _id: new ObjectId().toString(),
          name,
          slug,
          description: `Browse our selection of ${name} products`,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);
        console.log(`Created category: ${name}`);
      } else {
        console.log(`Category already exists: ${name}`);
      }
    }

    // ── SEED PRODUCTS ──
    console.log("\nSeeding products...");
    const productsToSeed = [
      {
        name: "MEG Hydra RTX 4080 Gaming PC",
        description: "Unleash high frame rates with our signature custom liquid-cooled pre-built rig.",
        price: 185000,
        originalPrice: 195000,
        image: "https://i.ibb.co.com/5gL7TzWJ/meg-PCs-hero1.jpg",
        images: ["https://i.ibb.co.com/5gL7TzWJ/meg-PCs-hero1.jpg"],
        category: { name: "Pre-built PC", slug: "pre-built-pc" },
        brand: "MEG PCs",
        stock: 5,
        rating: 4.9,
        reviewCount: 14,
        features: ["RTX 4080 GPU", "Ryzen 7 7800X3D", "32GB DDR5 RAM", "2TB Gen4 NVMe SSD"],
      },
      {
        name: "Intel Core i9-14900K Processor",
        description: "Power your assembly with 24 cores and 32 threads for extreme gaming and multitasking.",
        price: 62500,
        originalPrice: 65000,
        image: "https://i.ibb.co.com/3mJXy3Y8/meg-PCs-hero2.png",
        images: ["https://i.ibb.co.com/3mJXy3Y8/meg-PCs-hero2.png"],
        category: { name: "CPU", slug: "cpu" },
        brand: "Intel",
        stock: 12,
        rating: 4.8,
        reviewCount: 28,
        features: ["3.2 GHz base frequency", "6.0 GHz Turbo boost", "Intel UHD Graphics 770"],
      },
      {
        name: "ASUS ROG Strix GeForce RTX 4070 Ti SUPER",
        description: "Aesthetic cooling meet top-tier Ada Lovelace architecture for seamless 1440p and 4K gaming.",
        price: 110000,
        originalPrice: 115000,
        image: "https://i.ibb.co.com/5gL7TzWJ/meg-PCs-hero1.jpg",
        images: ["https://i.ibb.co.com/5gL7TzWJ/meg-PCs-hero1.jpg"],
        category: { name: "GPU", slug: "gpu" },
        brand: "ASUS",
        stock: 8,
        rating: 4.7,
        reviewCount: 19,
        features: ["16GB GDDR6X", "PCI Express 4.0", "Aura Sync RGB"],
      },
      {
        name: "G.Skill Trident Z5 RGB 32GB DDR5 6000MHz",
        description: "Optimized performance and vibrant custom illumination for cutting-edge builds.",
        price: 14500,
        originalPrice: 15500,
        image: "https://i.ibb.co.com/3mJXy3Y8/meg-PCs-hero2.png",
        images: ["https://i.ibb.co.com/3mJXy3Y8/meg-PCs-hero2.png"],
        category: { name: "RAM", slug: "ram" },
        brand: "G.Skill",
        stock: 25,
        rating: 4.9,
        reviewCount: 42,
        features: ["Dual Channel Kit", "CL30 latency", "Intel XMP 3.0 ready"],
      },
      {
        name: "Samsung 990 PRO 2TB PCIe 4.0 NVMe M.2 SSD",
        description: "Get random read/write speeds that are 40% and 55% faster than 980 PRO.",
        price: 21500,
        originalPrice: 23000,
        image: "https://i.ibb.co.com/5gL7TzWJ/meg-PCs-hero1.jpg",
        images: ["https://i.ibb.co.com/5gL7TzWJ/meg-PCs-hero1.jpg"],
        category: { name: "Storage", slug: "storage" },
        brand: "Samsung",
        stock: 30,
        rating: 5.0,
        reviewCount: 37,
        features: ["7450 MB/s Sequential Reads", "6900 MB/s Sequential Writes", "V-NAND technology"],
      },
      {
        name: "Lian Li O11 Dynamic EVO Mid-Tower Case",
        description: "Iconic dual-chamber layout with customizable layout configuration options.",
        price: 18500,
        originalPrice: 19000,
        image: "https://i.ibb.co.com/5gL7TzWJ/meg-PCs-hero1.jpg",
        images: ["https://i.ibb.co.com/5gL7TzWJ/meg-PCs-hero1.jpg"],
        category: { name: "Casing", slug: "casing" },
        brand: "Lian Li",
        stock: 15,
        rating: 4.8,
        reviewCount: 15,
        features: ["Tempered glass", "Reversible chassis design", "Supports up to 3x 360mm radiators"],
      },
      {
        name: "ASUS ROG Zephyrus G16 Gaming Laptop",
        description: "Vibrant OLED display paired with powerful processing for content creation and high-tier gaming.",
        price: 220000,
        originalPrice: 235000,
        image: "https://i.ibb.co.com/3mJXy3Y8/meg-PCs-hero2.png",
        images: ["https://i.ibb.co.com/3mJXy3Y8/meg-PCs-hero2.png"],
        category: { name: "Laptop", slug: "laptop" },
        brand: "ASUS",
        stock: 4,
        rating: 4.9,
        reviewCount: 9,
        features: ["16-inch 2.5K OLED", "RTX 4070 Laptop GPU", "Intel Core Ultra 9"],
      },
    ];

    for (const p of productsToSeed) {
      const slug = slugify(p.name);
      const existing = await db.collection("products").findOne({ slug });
      if (!existing) {
        await db.collection("products").insertOne({
          _id: new ObjectId().toString(),
          ...p,
          slug,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);
        console.log(`Created product: ${p.name}`);
      } else {
        console.log(`Product already exists: ${p.name}`);
      }
    }

    // ── SEED REVIEWS ──
    console.log("\nSeeding reviews...");
    const reviewsToSeed = [
      {
        userName: "Tahmid Hasan",
        rating: 5,
        comment: "Incredible pre-built! Cables were managed perfectly, and it runs games at ultra settings with quiet fans.",
        productName: "MEG Hydra RTX 4080 Gaming PC",
      },
      {
        userName: "Nabila Rahman",
        rating: 5,
        comment: "Blazing fast speeds! The Samsung 990 PRO cut down my video rendering load times by half. A must-buy.",
        productName: "Samsung 990 PRO 2TB NVMe SSD",
      },
      {
        userName: "Safwan Kabir",
        rating: 4,
        comment: "The Core i9-14900K is a beast of a processor. Runs a bit hot, so make sure you have a premium liquid cooler.",
        productName: "Intel Core i9-14900K Processor",
      },
      {
        userName: "Imran Khan",
        rating: 5,
        comment: "Stunning casing. Cable routing was extremely easy with the dual-chamber design. Looks beautiful on my desk.",
        productName: "Lian Li O11 Dynamic EVO Case",
      },
      {
        userName: "Zareen Subah",
        rating: 5,
        comment: "Excellent customer service and very fast delivery from MEG PCs. Rig arrived safely packaged in wooden crates.",
        productName: "MEG Hydra RTX 4080 Gaming PC",
      },
    ];

    for (const r of reviewsToSeed) {
      const existing = await db.collection("reviews").findOne({ userName: r.userName, comment: r.comment });
      if (!existing) {
        await db.collection("reviews").insertOne({
          _id: new ObjectId().toString(),
          ...r,
          userAvatar: null,
          createdAt: new Date(),
        } as any);
        console.log(`Created review by: ${r.userName}`);
      } else {
        console.log(`Review already exists by: ${r.userName}`);
      }
    }

    console.log("\nSeeding process completed successfully.");
  } catch (error) {
    console.error("Seeding failed with error:", error);
  } finally {
    await client.close();
    console.log("MongoDB connection closed.");
  }
}

seed();
