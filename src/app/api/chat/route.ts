import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { auth } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { headers } from "next/headers";
import { ObjectId } from "mongodb";

let indexCreated = false;
async function ensureIndexes(db: any) {
  if (indexCreated) return;
  try {
    await db.collection("conversations").createIndex({ userId: 1 }, { sparse: true });
    await db.collection("conversations").createIndex({ sessionId: 1 }, { sparse: true });
    indexCreated = true;
  } catch (e) {
    console.error("Index creation failed:", e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const body = await request.json();
    const { message, history = [], context = {}, sessionId } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key is not configured" }, { status: 500 });
    }

    const { db } = await connectToDatabase();
    await ensureIndexes(db);

    let productContext = "";
    if (context.page === "product" && context.productId) {
      let prodQueryId: any = context.productId;
      try {
        if (ObjectId.isValid(context.productId)) {
          prodQueryId = new ObjectId(context.productId);
        }
      } catch (e) {}
      
      const product = await db.collection("products").findOne({ _id: prodQueryId });
      if (product) {
        productContext = `
The user is currently viewing the following product:
- ID: ${product._id.toString()}
- Name: ${product.name}
- Price: ৳${product.price.toLocaleString()}
- Brand: ${product.brand || "Generic"}
- Category: ${product.category?.name || "Hardware"}
- Stock Status: ${product.stock > 0 ? `In Stock (${product.stock} available)` : "Out of Stock"}
- Description: ${product.description || ""}
- Features: ${JSON.stringify(product.features || [])}
- Specifications: ${JSON.stringify(product.specifications || {})}
Use this information to answer user questions about this product.
`;
      }
    }

    const systemInstruction = `You are "TechBuddy", a helpful, friendly, and expert AI chat assistant for MEG PCs.
MEG PCs is a premium custom PC builder and computer component store selling CPUs, GPUs, motherboards, RAM, storage, power supplies, cases, and cooling systems.

Instructions:
1. Help users pick PC parts, compare specifications, check compatibility, and provide guidance on PC building.
2. Be polite, expert, concise, and helpful. Keep responses relatively short so they fit nicely in a mobile-friendly chat widget.
3. If users ask about a product they are viewing, use the provided product context details.
4. Keep your formatting clean using Markdown where appropriate (bullet points, bold text).
${productContext}
`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      systemInstruction,
    });

    const chatHistory = history.map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history: chatHistory,
    });

    const encoder = new TextEncoder();
    let replyText = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const result = await chat.sendMessageStream(message);
          for await (const chunk of result.stream) {
            const text = chunk.text();
            replyText += text;
            controller.enqueue(encoder.encode(text));
          }
          controller.close();

          // Save conversation history to MongoDB in the background
          const userId = session?.user?.id;
          const searchFilter = userId ? { userId } : { sessionId };
          
          if (userId || sessionId) {
            const conversationUpdate = {
              $push: {
                messages: {
                  $each: [
                    { role: "user", content: message, createdAt: new Date() },
                    { role: "assistant", content: replyText, createdAt: new Date() },
                  ],
                },
              },
              $set: {
                context,
                updatedAt: new Date(),
              },
              $setOnInsert: {
                createdAt: new Date(),
              },
            };

            await db.collection("conversations").updateOne(
              searchFilter,
              conversationUpdate as any,
              { upsert: true }
            );
          }
        } catch (err: any) {
          console.error("Streaming error:", err);
          controller.error(err);
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Chat API endpoint error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error during chat." },
      { status: 500 }
    );
  }
}
