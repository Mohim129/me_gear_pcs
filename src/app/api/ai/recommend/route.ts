import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getCompatibleProducts, Product } from "@/lib/compatibility";
import { GoogleGenerativeAI } from "@google/generative-ai";

const CORE_SLOTS = [
  "cpu",
  "cooler",
  "motherboard",
  "ram",
  "storage",
  "gpu",
  "psu",
  "casing",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { budget, useCase, selectedComponents } = body; // selectedComponents is Record<string, string> (slotId -> productId)

    if (!budget || isNaN(budget) || Number(budget) <= 0) {
      return NextResponse.json(
        { error: "Please enter a valid budget greater than 0 BDT." },
        { status: 400 }
      );
    }

    if (!useCase) {
      return NextResponse.json(
        { error: "Please select a use case." },
        { status: 400 }
      );
    }

    // Connect to database and fetch all products in core categories
    const { db } = await connectToDatabase();
    const allProducts = (await db
      .collection("products")
      .find({
        "category.slug": { $in: CORE_SLOTS },
      })
      .toArray()) as any as Product[];

    // Map selected IDs to full Product structures
    const currentBuild: Record<string, Product> = {};
    let manualCost = 0;

    if (selectedComponents && typeof selectedComponents === "object") {
      for (const [slotId, prodId] of Object.entries(selectedComponents)) {
        if (!prodId) continue;
        const product = allProducts.find((p) => p._id === prodId);
        if (product) {
          currentBuild[slotId] = product;
          manualCost += product.price;
        }
      }
    }

    const remainingBudget = Number(budget) - manualCost;
    if (remainingBudget < 0) {
      return NextResponse.json(
        {
          error: `Your manually selected parts already cost ${manualCost.toLocaleString()} BDT, leaving insufficient budget for the remaining components. Please increase budget or change your picks.`,
        },
        { status: 400 }
      );
    }

    // Determine unfilled slots and their compatible product candidates
    const unfilledSlots = CORE_SLOTS.filter((slot) => !currentBuild[slot]);
    if (unfilledSlots.length === 0) {
      return NextResponse.json({
        recommendations: {},
        reasoning: {},
      });
    }

    const candidatesPerSlot: Record<string, Product[]> = {};
    for (const slot of unfilledSlots) {
      // Find compatible products using shared utility
      const compatibleList = getCompatibleProducts(slot, allProducts, currentBuild);
      // Sort by rating desc, price asc and take top 8 to stay within context size
      candidatesPerSlot[slot] = compatibleList
        .sort((a, b) => (b.rating || 0) - (a.rating || 0) || a.price - b.price)
        .slice(0, 8);
    }

    // Check if any slot has 0 candidates
    for (const slot of unfilledSlots) {
      if (candidatesPerSlot[slot].length === 0) {
        return NextResponse.json(
          {
            error: `Could not find any compatible products in database for category "${slot.toUpperCase()}" with your current manual selections. Please try changing your motherboard, CPU or case first.`,
          },
          { status: 400 }
        );
      }
    }

    // Check GEMINI_API_KEY
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined in environment variables. Falling back to simple heuristic recommendation.");
      // Heuristic fallback to fill empty slots
      const recommendations: Record<string, string> = {};
      const reasoning: Record<string, string> = {};
      let tempBudget = remainingBudget;

      for (const slot of unfilledSlots) {
        const list = candidatesPerSlot[slot];
        // Select cheapest compatible or reasonable option that fits
        const choice = list.find((p) => p.price <= tempBudget) || list[list.length - 1];
        if (choice) {
          recommendations[slot] = choice._id;
          reasoning[slot] = "Heuristic pick: Solid performance option chosen due to offline mode.";
          tempBudget -= choice.price;
        }
      }

      return NextResponse.json({ recommendations, reasoning });
    }

    // Initialize Gemini Client
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    // Clean up lists for prompt representation to minimize tokens
    const promptBuildData = Object.entries(currentBuild).map(([slot, p]) => ({
      slot,
      name: p.name,
      price: p.price,
    }));

    const promptOptionsData: Record<string, any[]> = {};
    for (const [slot, products] of Object.entries(candidatesPerSlot)) {
      promptOptionsData[slot] = products.map((p) => ({
        id: p._id,
        name: p.name,
        price: p.price,
        specs: JSON.stringify(p.specifications || {}),
        brand: p.brand,
      }));
    }

    const systemInstruction = `You are an expert PC builder. A user wants to build a PC for use case: "${useCase}".
Their total budget is ${budget} BDT. They have already chosen some parts, which you must NOT replace.
Remaining budget after existing selections: ${remainingBudget} BDT.

Existing Selections:
${JSON.stringify(promptBuildData, null, 2)}

Available Options per unfilled category:
${JSON.stringify(promptOptionsData, null, 2)}

Your task:
1. Select exactly one product ID from the options provided for each unfilled category.
2. Maximize the performance/value of the build for the use case: "${useCase}".
3. The sum of prices of your recommendations must not exceed the remaining budget: ${remainingBudget} BDT.
4. Recommend components that are logically balanced (e.g. do not put a high-end RTX 4080 GPU with a cheap EVGA 600W PSU, choose a high-end CPU and Motherboard together if possible, etc. though the provided options are already filtered for compatibility, ensure a balanced build).
5. Return a valid JSON response containing the properties "recommendations" (mapping category slot to recommended product ID) and "reasoning" (mapping category slot to a short 1-sentence justification).

JSON structure output format:
{
  "recommendations": {
    "cpu": "selected_product_id",
    "cooler": "selected_product_id",
    ...
  },
  "reasoning": {
    "cpu": "Short sentence explaining why this CPU fits the gaming/editing use case best for this price.",
    "cooler": "...",
    ...
  }
}`;

    const result = await model.generateContent(systemInstruction);
    const responseText = result.response.text();
    const cleanJson = JSON.parse(responseText.trim());

    // Validate that the returned IDs exist and are in the available products list
    const recommendations = cleanJson.recommendations || {};
    const reasoning = cleanJson.reasoning || {};

    for (const [slot, id] of Object.entries(recommendations)) {
      if (!id) continue;
      const candidates = candidatesPerSlot[slot];
      if (!candidates || !candidates.some((c) => c._id === id)) {
        // Fallback to first compatible if invalid ID returned
        const defaultChoice = candidatesPerSlot[slot][0];
        recommendations[slot] = defaultChoice._id;
        reasoning[slot] = "Default choice: Recommended to maintain system compatibility.";
      }
    }

    return NextResponse.json({ recommendations, reasoning });
  } catch (error: any) {
    console.error("AI Recommendation API failed:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error during AI recommendation." },
      { status: 500 }
    );
  }
}
