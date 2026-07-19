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

    // Clear existing products to ensure clean seed with updated specifications
    console.log("Clearing existing products...");
    await db.collection("products").deleteMany({});

    // ── SEED PRODUCTS ──
    console.log("\nSeeding products...");
    const productsToSeed = [
      // CPUs
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
        features: ["24 Cores / 32 Threads", "LGA1700 Socket", "Intel UHD Graphics 770", "Up to 6.0 GHz"],
        specifications: {
          socket: "LGA1700",
          tdp: 125,
          cores: "24",
          threads: "32",
          clock_speed: "3.2 GHz (6.0 GHz Max)"
        }
      },
      {
        name: "AMD Ryzen 7 7800X3D Processor",
        description: "The absolute best gaming CPU with 3D V-Cache technology for massive frame rate gains.",
        price: 48000,
        originalPrice: 51000,
        image: "https://i.ibb.co.com/3mJXy3Y8/meg-PCs-hero2.png",
        images: ["https://i.ibb.co.com/3mJXy3Y8/meg-PCs-hero2.png"],
        category: { name: "CPU", slug: "cpu" },
        brand: "AMD",
        stock: 15,
        rating: 4.9,
        reviewCount: 45,
        features: ["8 Cores / 16 Threads", "AM5 Socket", "96MB L3 Cache", "3D V-Cache Technology"],
        specifications: {
          socket: "AM5",
          tdp: 120,
          cores: "8",
          threads: "16",
          clock_speed: "4.2 GHz (5.0 GHz Max)"
        }
      },
      {
        name: "AMD Ryzen 5 7600 Processor",
        description: "Excellent entry-level AM5 gaming processor with low TDP and outstanding value.",
        price: 24000,
        originalPrice: 26000,
        image: "https://i.ibb.co.com/3mJXy3Y8/meg-PCs-hero2.png",
        images: ["https://i.ibb.co.com/3mJXy3Y8/meg-PCs-hero2.png"],
        category: { name: "CPU", slug: "cpu" },
        brand: "AMD",
        stock: 20,
        rating: 4.6,
        reviewCount: 12,
        features: ["6 Cores / 12 Threads", "AM5 Socket", "65W Low Power", "Wraith Stealth Cooler included"],
        specifications: {
          socket: "AM5",
          tdp: 65,
          cores: "6",
          threads: "12",
          clock_speed: "3.8 GHz (5.1 GHz Max)"
        }
      },
      // CPU Coolers
      {
        name: "Noctua NH-D15 chromax.black Dual-Tower Cooler",
        description: "Elite-class premium quiet CPU cooler for high overclocking or hot TDP processors.",
        price: 12500,
        originalPrice: 13500,
        image: "https://i.ibb.co.com/5gL7TzWJ/meg-PCs-hero1.jpg",
        images: ["https://i.ibb.co.com/5gL7TzWJ/meg-PCs-hero1.jpg"],
        category: { name: "Cooler", slug: "cooler" },
        brand: "Noctua",
        stock: 10,
        rating: 4.9,
        reviewCount: 33,
        features: ["Dual-tower design", "Quiet NF-A15 140mm fans", "6 Heatpipes", "Chromax.black look"],
        specifications: {
          socket_support: ["LGA1700", "AM5", "AM4", "LGA1200"],
          type: "Air Cooler",
          fan_speed: "1500 RPM"
        }
      },
      {
        name: "Corsair iCUE H150i Elite Capellix XT Liquid Cooler",
        description: "Top-tier 360mm liquid CPU cooler with customizable RGB lighting and outstanding performance.",
        price: 22500,
        originalPrice: 24000,
        image: "https://i.ibb.co.com/5gL7TzWJ/meg-PCs-hero1.jpg",
        images: ["https://i.ibb.co.com/5gL7TzWJ/meg-PCs-hero1.jpg"],
        category: { name: "Cooler", slug: "cooler" },
        brand: "Corsair",
        stock: 8,
        rating: 4.8,
        reviewCount: 22,
        features: ["360mm Radiator", "3x AF120 RGB ELITE fans", "Commander CORE controller included"],
        specifications: {
          socket_support: ["LGA1700", "AM5", "AM4", "LGA1200", "LGA2066"],
          type: "Liquid Cooler (AIO)",
          radiator_size: "360mm"
        }
      },
      // Motherboards
      {
        name: "MSI PRO Z790-A MAX WIFI Motherboard",
        description: "Optimized for Intel 14th/13th Gen Core processors, high bandwidth DDR5 memory and WiFi 7.",
        price: 36500,
        originalPrice: 38500,
        image: "https://i.ibb.co.com/3mJXy3Y8/meg-PCs-hero2.png",
        images: ["https://i.ibb.co.com/3mJXy3Y8/meg-PCs-hero2.png"],
        category: { name: "Motherboard", slug: "motherboard" },
        brand: "MSI",
        stock: 14,
        rating: 4.7,
        reviewCount: 16,
        features: ["Intel LGA1700 Socket", "DDR5 Memory Support", "PCIe 5.0 x16 slot", "Wi-Fi 7 + 2.5G LAN"],
        specifications: {
          socket: "LGA1700",
          memory_type: "DDR5",
          form_factor: "ATX"
        }
      },
      {
        name: "ASUS ROG STRIX B650E-F GAMING WIFI Motherboard",
        description: "High-grade gaming motherboard for AMD AM5 Ryzen processors with outstanding power stages.",
        price: 32000,
        originalPrice: 34000,
        image: "https://i.ibb.co.com/3mJXy3Y8/meg-PCs-hero2.png",
        images: ["https://i.ibb.co.com/3mJXy3Y8/meg-PCs-hero2.png"],
        category: { name: "Motherboard", slug: "motherboard" },
        brand: "ASUS",
        stock: 10,
        rating: 4.8,
        reviewCount: 29,
        features: ["AMD AM5 Socket", "DDR5 Memory Support", "PCIe 5.0 M.2 Support", "Wi-Fi 6E + 2.5G LAN"],
        specifications: {
          socket: "AM5",
          memory_type: "DDR5",
          form_factor: "ATX"
        }
      },
      {
        name: "GIGABYTE A620M GAMING X Motherboard",
        description: "Compact Micro-ATX motherboard offering essential specs and reliability for AMD Ryzen AM5.",
        price: 16500,
        originalPrice: 18000,
        image: "https://i.ibb.co.com/3mJXy3Y8/meg-PCs-hero2.png",
        images: ["https://i.ibb.co.com/3mJXy3Y8/meg-PCs-hero2.png"],
        category: { name: "Motherboard", slug: "motherboard" },
        brand: "GIGABYTE",
        stock: 18,
        rating: 4.4,
        reviewCount: 9,
        features: ["AMD AM5 Socket", "DDR5 Memory Support", "Micro-ATX form factor", "Dual PCIe M.2 SSD slots"],
        specifications: {
          socket: "AM5",
          memory_type: "DDR5",
          form_factor: "Micro-ATX"
        }
      },
      // RAM
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
        features: ["Dual Channel Kit (2x16GB)", "DDR5 Memory Type", "CL30 latency", "Intel XMP 3.0 ready"],
        specifications: {
          memory_type: "DDR5",
          capacity: "32GB",
          speed: "6000MHz"
        }
      },
      {
        name: "Corsair Vengeance DDR5 32GB 5600MHz",
        description: "High-frequency DDR5 memory in a sleek, low-profile heatspreader form.",
        price: 12000,
        originalPrice: 13000,
        image: "https://i.ibb.co.com/3mJXy3Y8/meg-PCs-hero2.png",
        images: ["https://i.ibb.co.com/3mJXy3Y8/meg-PCs-hero2.png"],
        category: { name: "RAM", slug: "ram" },
        brand: "Corsair",
        stock: 30,
        rating: 4.7,
        reviewCount: 18,
        features: ["2x16GB Module Kit", "DDR5 Memory Type", "AMD EXPO Profile configured"],
        specifications: {
          memory_type: "DDR5",
          capacity: "32GB",
          speed: "5600MHz"
        }
      },
      // Storage
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
        specifications: {
          interface: "PCIe 4.0 x4",
          capacity: "2TB",
          type: "NVMe M.2"
        }
      },
      {
        name: "Crucial P3 Plus 1TB PCIe 4.0 NVMe M.2 SSD",
        description: "Blazing fast speeds and massive capacity at a budget-friendly price point.",
        price: 9500,
        originalPrice: 10500,
        image: "https://i.ibb.co.com/5gL7TzWJ/meg-PCs-hero1.jpg",
        images: ["https://i.ibb.co.com/5gL7TzWJ/meg-PCs-hero1.jpg"],
        category: { name: "Storage", slug: "storage" },
        brand: "Crucial",
        stock: 45,
        rating: 4.6,
        reviewCount: 15,
        features: ["5000 MB/s Sequential Reads", "3600 MB/s Sequential Writes", "Crucial 3D NAND"],
        specifications: {
          interface: "PCIe 4.0 x4",
          capacity: "1TB",
          type: "NVMe M.2"
        }
      },
      // GPUs
      {
        name: "ASUS ROG Strix GeForce RTX 4070 Ti SUPER",
        description: "Aesthetic cooling meets top-tier Ada Lovelace architecture for seamless 1440p and 4K gaming.",
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
        specifications: {
          vram: "16GB GDDR6X",
          tdp: 285,
          clock_speed: "2670 MHz Boost"
        }
      },
      {
        name: "MSI GeForce RTX 4060 Ti Ventus 2X Black OC",
        description: "Fast frame rates at 1080p and high-efficiency Ada Lovelace design.",
        price: 49500,
        originalPrice: 52000,
        image: "https://i.ibb.co.com/5gL7TzWJ/meg-PCs-hero1.jpg",
        images: ["https://i.ibb.co.com/5gL7TzWJ/meg-PCs-hero1.jpg"],
        category: { name: "GPU", slug: "gpu" },
        brand: "MSI",
        stock: 15,
        rating: 4.5,
        reviewCount: 14,
        features: ["8GB GDDR6", "Dual Fan Design", "DLSS 3 frame generation"],
        specifications: {
          vram: "8GB GDDR6",
          tdp: 160,
          clock_speed: "2565 MHz Boost"
        }
      },
      {
        name: "NVIDIA GeForce RTX 4080 Founders Edition",
        description: "Highest performance flagship GPU with absolute maximum gaming frame rates.",
        price: 142000,
        originalPrice: 150000,
        image: "https://i.ibb.co.com/5gL7TzWJ/meg-PCs-hero1.jpg",
        images: ["https://i.ibb.co.com/5gL7TzWJ/meg-PCs-hero1.jpg"],
        category: { name: "GPU", slug: "gpu" },
        brand: "NVIDIA",
        stock: 6,
        rating: 4.9,
        reviewCount: 11,
        features: ["16GB GDDR6X", "320W High TDP", "Overclocked out of the box"],
        specifications: {
          vram: "16GB GDDR6X",
          tdp: 320,
          clock_speed: "2640 MHz"
        }
      },
      // PSUs
      {
        name: "Corsair RM850x 850W Gold Modular Power Supply",
        description: "Zero RPM fan mode and 100% Japanese 105C capacitors for ultimate silent power delivery.",
        price: 15500,
        originalPrice: 16500,
        image: "https://i.ibb.co.com/3mJXy3Y8/meg-PCs-hero2.png",
        images: ["https://i.ibb.co.com/3mJXy3Y8/meg-PCs-hero2.png"],
        category: { name: "PSU", slug: "psu" },
        brand: "Corsair",
        stock: 16,
        rating: 4.8,
        reviewCount: 20,
        features: ["850W Output", "80 PLUS Gold Certified", "Fully Modular cabling", "10-year warranty"],
        specifications: {
          wattage: 850,
          efficiency: "80 Plus Gold"
        }
      },
      {
        name: "Seasonic FOCUS GX-750 750W Power Supply",
        description: "Ultra reliable 750W power supply offering highly clean efficiency and space-saving modular builds.",
        price: 12500,
        originalPrice: 13500,
        image: "https://i.ibb.co.com/3mJXy3Y8/meg-PCs-hero2.png",
        images: ["https://i.ibb.co.com/3mJXy3Y8/meg-PCs-hero2.png"],
        category: { name: "PSU", slug: "psu" },
        brand: "Seasonic",
        stock: 22,
        rating: 4.9,
        reviewCount: 31,
        features: ["750W Output", "80 PLUS Gold Certified", "Fully Modular cables", "Compact 140mm depth"],
        specifications: {
          wattage: 750,
          efficiency: "80 Plus Gold"
        }
      },
      {
        name: "EVGA 600 W1 600W Power Supply",
        description: "Cost-effective, quiet-running power supply for entry-level gaming setups.",
        price: 5200,
        originalPrice: 5800,
        image: "https://i.ibb.co.com/3mJXy3Y8/meg-PCs-hero2.png",
        images: ["https://i.ibb.co.com/3mJXy3Y8/meg-PCs-hero2.png"],
        category: { name: "PSU", slug: "psu" },
        brand: "EVGA",
        stock: 35,
        rating: 4.3,
        reviewCount: 40,
        features: ["600W Output", "80 PLUS White Certified", "Compact non-modular design"],
        specifications: {
          wattage: 600,
          efficiency: "80 Plus"
        }
      },
      // Casings
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
        specifications: {
          motherboard_support: ["ATX", "Micro-ATX", "Mini-ITX", "E-ATX"]
        }
      },
      {
        name: "NZXT H5 Flow Compact Mid-Tower Case",
        description: "Outstanding thermal performance in a clean mid-tower with dedicated GPU bottom intake fan.",
        price: 10500,
        originalPrice: 11500,
        image: "https://i.ibb.co.com/5gL7TzWJ/meg-PCs-hero1.jpg",
        images: ["https://i.ibb.co.com/5gL7TzWJ/meg-PCs-hero1.jpg"],
        category: { name: "Casing", slug: "casing" },
        brand: "NZXT",
        stock: 25,
        rating: 4.7,
        reviewCount: 22,
        features: ["Perforated front panel", "Bottom GPU airflow design", "Cable routing channels"],
        specifications: {
          motherboard_support: ["ATX", "Micro-ATX", "Mini-ITX"]
        }
      },
      // Peripherals - Monitor
      {
        name: "ASUS ROG Swift PG27AQDM OLED Monitor",
        description: "Elite 27-inch 1440p gaming monitor with OLED panel and custom cooling heatsink.",
        price: 98000,
        originalPrice: 105000,
        image: "https://i.ibb.co.com/3mJXy3Y8/meg-PCs-hero2.png",
        images: ["https://i.ibb.co.com/3mJXy3Y8/meg-PCs-hero2.png"],
        category: { name: "Monitor", slug: "monitor" },
        brand: "ASUS",
        stock: 6,
        rating: 4.9,
        reviewCount: 13,
        features: ["27-inch 1440p", "OLED Panel, 240Hz refresh", "0.03ms response time"],
        specifications: {
          resolution: "2560x1440",
          refresh_rate: "240Hz"
        }
      },
      // Peripherals - Keyboard
      {
        name: "Keychron K2 Mechanical Keyboard V2",
        description: "Tactile mechanical keyboard in a compact 75% layout for optimal desk organization.",
        price: 8500,
        originalPrice: 9500,
        image: "https://i.ibb.co.com/5gL7TzWJ/meg-PCs-hero1.jpg",
        images: ["https://i.ibb.co.com/5gL7TzWJ/meg-PCs-hero1.jpg"],
        category: { name: "Keyboard", slug: "keyboard" },
        brand: "Keychron",
        stock: 40,
        rating: 4.8,
        reviewCount: 28,
        features: ["Bluetooth & Wired", "Gateron Brown Switches", "Mac & Windows layout support"],
        specifications: {
          type: "Mechanical",
          connectivity: "Wireless/Wired"
        }
      },
      // Peripherals - Mouse
      {
        name: "Logitech G Pro X Superlight Mouse",
        description: "Ultralight wireless gaming mouse weighting under 63 grams with Hero 25K optical sensor.",
        price: 13500,
        originalPrice: 14500,
        image: "https://i.ibb.co.com/3mJXy3Y8/meg-PCs-hero2.png",
        images: ["https://i.ibb.co.com/3mJXy3Y8/meg-PCs-hero2.png"],
        category: { name: "Mouse", slug: "mouse" },
        brand: "Logitech",
        stock: 32,
        rating: 4.9,
        reviewCount: 45,
        features: ["Less than 63g weight", "Hero 25K Sensor", "LIGHTSPEED Wireless tech"],
        specifications: {
          sensor: "Hero 25K",
          weight: "63g"
        }
      },
      // Peripherals - Speaker
      {
        name: "Audioengine A2+ Wireless Speakers",
        description: "Premium bookshelf speakers with rich stereo staging and dual digital audio inputs.",
        price: 29500,
        originalPrice: 32000,
        image: "https://i.ibb.co.com/5gL7TzWJ/meg-PCs-hero1.jpg",
        images: ["https://i.ibb.co.com/5gL7TzWJ/meg-PCs-hero1.jpg"],
        category: { name: "Speaker", slug: "speaker" },
        brand: "Audioengine",
        stock: 12,
        rating: 4.7,
        reviewCount: 15,
        features: ["Built-in analog power amplifiers", "USB/Aux/Bluetooth connection", "Silk dome tweeters"],
        specifications: {
          type: "Bookshelf Speakers",
          power: "60W Peak Total"
        }
      },
      // Peripherals - Headphone
      {
        name: "SteelSeries Arctis Nova Pro Wireless",
        description: "High-fidelity gaming audio headset with active noise cancellation and hot-swappable batteries.",
        price: 38500,
        originalPrice: 42000,
        image: "https://i.ibb.co.com/3mJXy3Y8/meg-PCs-hero2.png",
        images: ["https://i.ibb.co.com/3mJXy3Y8/meg-PCs-hero2.png"],
        category: { name: "Headphone", slug: "headphone" },
        brand: "SteelSeries",
        stock: 10,
        rating: 4.8,
        reviewCount: 20,
        features: ["Premium Hi-Res Audio drivers", "Active Noise Cancellation (ANC)", "Dual Wireless Connection"],
        specifications: {
          type: "Wireless Over-Ear",
          noise_cancelling: "Yes"
        }
      },
      // Pre-built PC
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
        specifications: {
          gpu: "RTX 4080",
          cpu: "Ryzen 7 7800X3D",
          ram: "32GB DDR5"
        }
      },
      // Laptop
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
        specifications: {
          cpu: "Intel Core Ultra 9",
          gpu: "RTX 4070 Laptop",
          ram: "16GB LPDDR5X"
        }
      }
    ];

    for (const p of productsToSeed) {
      const slug = slugify(p.name);
      await db.collection("products").insertOne({
        _id: new ObjectId().toString(),
        ...p,
        slug,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      console.log(`Created product: ${p.name}`);
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
        productName: "Samsung 990 PRO 2TB PCIe 4.0 NVMe M.2 SSD",
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
        productName: "Lian Li O11 Dynamic EVO Mid-Tower Case",
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
