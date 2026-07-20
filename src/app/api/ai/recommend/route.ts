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

// These slots are optional and can be omitted by the AI if budget doesn't allow
const OPTIONAL_SLOTS = new Set(["cooler", "gpu"]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { budget, useCase, selectedComponents } = body;

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

    const { db } = await connectToDatabase();
    const allProducts = (await db
      .collection("products")
      .find({
        "category.slug": { $in: CORE_SLOTS },
      })
      .toArray()) as any as Product[];

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
          error: `Your manually selected parts already cost ${manualCost.toLocaleString()} BDT, leaving insufficient budget.`,
        },
        { status: 400 }
      );
    }

    // Unfilled slots: all core slots not yet selected
    const unfilledSlots = CORE_SLOTS.filter((slot) => !currentBuild[slot]);
    if (unfilledSlots.length === 0) {
      return NextResponse.json({ recommendations: {}, reasoning: {} });
    }

    // Gather compatible candidates for each unfilled slot
    const candidatesPerSlot: Record<string, Product[]> = {};
    for (const slot of unfilledSlots) {
      const compatibleList = getCompatibleProducts(slot, allProducts, currentBuild);
      // Sort by rating then price, take top 8
      candidatesPerSlot[slot] = compatibleList
        .sort((a, b) => (b.rating || 0) - (a.rating || 0) || a.price - b.price)
        .slice(0, 8);
    }

    // For mandatory slots, we must have at least one candidate
    for (const slot of unfilledSlots) {
      if (!OPTIONAL_SLOTS.has(slot) && candidatesPerSlot[slot].length === 0) {
        return NextResponse.json(
          {
            error: `No compatible products found for mandatory slot "${slot.toUpperCase()}". Please change your existing selections.`,
          },
          { status: 400 }
        );
      }
    }

    // Helper: heuristic fallback
    const heuristicRecommend = () => {
      const recommendations: Record<string, string | null> = {};
      const reasoning: Record<string, string> = {};
      let tempBudget = remainingBudget;

      // Sort unfilled slots: mandatory first, optional last
      const sortedSlots = [...unfilledSlots].sort((a, b) => {
        const aOpt = OPTIONAL_SLOTS.has(a) ? 1 : 0;
        const bOpt = OPTIONAL_SLOTS.has(b) ? 1 : 0;
        return aOpt - bOpt;
      });

      for (const slot of sortedSlots) {
        const list = candidatesPerSlot[slot];
        if (!list || list.length === 0) {
          if (OPTIONAL_SLOTS.has(slot)) {
            recommendations[slot] = null;
            reasoning[slot] = "Skipped – not available or not required for this build.";
          }
          continue;
        }

        // Find the best affordable option (sorted by rating desc, price asc)
        const affordable = list.filter((p) => p.price <= tempBudget);

        if (affordable.length > 0) {
          const choice = affordable[0]; // best rated / cheapest that fits
          recommendations[slot] = choice._id;
          reasoning[slot] = "Heuristic pick: best value option within budget.";
          tempBudget -= choice.price;
        } else if (OPTIONAL_SLOTS.has(slot)) {
          // Optional slot and nothing fits the budget — skip it
          recommendations[slot] = null;
          reasoning[slot] = "Skipped to stay within budget.";
        } else {
          // Mandatory slot but nothing fits — pick cheapest available as last resort
          const cheapest = [...list].sort((a, b) => a.price - b.price)[0];
          recommendations[slot] = cheapest._id;
          reasoning[slot] = "Cheapest available option (budget exceeded for this category).";
          tempBudget -= cheapest.price;
        }
      }

      return { recommendations, reasoning };
    };

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY missing, using heuristic.");
      return NextResponse.json(heuristicRecommend());
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-3.5-flash",
        generationConfig: { responseMimeType: "application/json" },
      });

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

Important rules:
1. The categories "cooler" and "gpu" are optional. You may leave them empty (value null) if the budget doesn't allow or the CPU has integrated graphics. However, you should always try to include a dedicated GPU and cooler first if the budget and use case permit, especially for gaming or high-performance tasks.  
2. For all other categories (cpu, motherboard, ram, storage, psu, casing), you must select exactly one product ID.
3. COMPATIBILITY IS AN ABSOLUTE CONSTRAINT: Do not pair incompatible components under any circumstances, even if the budget allows it. If a candidate part is incompatible, choose a different compatible option or omit an optional slot. It is better to stay within budget with a compatible build than to exceed compatibility.
4. ABSOLUTE CONSTRAINT: The sum of the prices of your recommendations MUST be less than or equal to the remaining budget of ${remainingBudget} BDT. Calculate the sum of the prices of your selections before outputting. If the sum exceeds ${remainingBudget} BDT, you must choose cheaper components or omit optional ones (cooler, gpu) to stay within the budget.
5. Ensure the build is balanced (e.g., don't pair a high-end CPU with a very weak PSU or motherboard).
6. Return a valid JSON response containing "recommendations" (object mapping each unfilled slot to a product ID or null) and "reasoning" (object mapping slot to a short justification). Example:
{
  "recommendations": {
    "cpu": "selected_product_id",
    "cooler": "selected_product_id" or null,
    "motherboard": "selected_product_id",
    "ram": "selected_product_id",
    "storage": "selected_product_id",
    "gpu": "selected_product_id" or null,
    "psu": "selected_product_id",
    "casing": "selected_product_id"
  },
  "reasoning": {
    "cpu": "Short explanation...",
    ...
  }
}`;

      const result = await model.generateContent(systemInstruction);
      const responseText = result.response.text();
      const cleanJson = JSON.parse(responseText.trim());

      const recommendations = cleanJson.recommendations || {};
      const reasoning = cleanJson.reasoning || {};

      // Validate returned IDs and handle nulls properly
      for (const slot of unfilledSlots) {
        const id = recommendations[slot];
        if (id === null || id === undefined) {
          if (!OPTIONAL_SLOTS.has(slot)) {
            // mandatory slot must not be null – fallback
            const fallback = candidatesPerSlot[slot]?.[0];
            recommendations[slot] = fallback?._id ?? null;
            reasoning[slot] = fallback
              ? "Default choice: mandatory component auto-selected."
              : "No compatible product available.";
          } else {
            // optional slot, keep null
            recommendations[slot] = null;
          }
          continue;
        }
        // if an ID is returned, ensure it's valid
        const candidates = candidatesPerSlot[slot];
        if (candidates && !candidates.some((c) => c._id === id)) {
          const defaultChoice = candidates[0];
          recommendations[slot] = defaultChoice._id;
          reasoning[slot] = "Default choice: Recommended to maintain compatibility.";
        }
      }

      // Programmatically enforce the budget!
      let totalCost = manualCost;
      for (const slot of unfilledSlots) {
        const id = recommendations[slot];
        if (id) {
          const product = candidatesPerSlot[slot]?.find((c) => c._id === id);
          if (product) {
            totalCost += product.price;
          }
        }
      }

      // If the total cost exceeds the budget, adjust recommendations programmatically
      if (totalCost > Number(budget)) {
        console.warn(`AI recommendation went over budget (${totalCost} > ${budget}). Adjusting...`);
        
        let overbudget = true;
        const maxIterations = 30;
        let iteration = 0;
        
        while (overbudget && iteration < maxIterations) {
          iteration++;
          
          // Find slots that are currently recommended and can be downgraded
          const downgradableSlots = unfilledSlots.filter((slot) => {
            const currentId = recommendations[slot];
            if (!currentId) return false; // already null or empty
            
            const candidates = candidatesPerSlot[slot] || [];
            const currentItem = candidates.find((c) => c._id === currentId);
            if (!currentItem) return false;
            
            const hasCheaperProduct = candidates.some((c) => c.price < currentItem.price);
            const canDropOptional = OPTIONAL_SLOTS.has(slot);
            
            return hasCheaperProduct || canDropOptional;
          });
          
          if (downgradableSlots.length === 0) {
            break; // cannot downgrade anything further
          }
          
          // Sort slots by the price of their currently recommended component descending
          downgradableSlots.sort((a, b) => {
            const priceA = candidatesPerSlot[a]?.find((c) => c._id === recommendations[a])?.price || 0;
            const priceB = candidatesPerSlot[b]?.find((c) => c._id === recommendations[b])?.price || 0;
            return priceB - priceA;
          });
          
          const slotToDowngrade = downgradableSlots[0];
          const currentId = recommendations[slotToDowngrade];
          const candidates = candidatesPerSlot[slotToDowngrade] || [];
          const currentItem = candidates.find((c) => c._id === currentId)!;
          
          // Find product candidates cheaper than the current one
          const cheaperProducts = candidates
            .filter((c) => c.price < currentItem.price)
            .sort((a, b) => b.price - a.price);
            
          if (cheaperProducts.length > 0) {
            // Downgrade to next cheaper product option
            const nextCheaper = cheaperProducts[0];
            recommendations[slotToDowngrade] = nextCheaper._id;
            reasoning[slotToDowngrade] = `${nextCheaper.name} selected to satisfy the budget constraint (adjusted from ${currentItem.name}).`;
          } else if (OPTIONAL_SLOTS.has(slotToDowngrade)) {
            // No cheaper product, but the slot is optional: drop it entirely
            recommendations[slotToDowngrade] = null;
            reasoning[slotToDowngrade] = `Omitted optional ${slotToDowngrade.toUpperCase()} to satisfy the total budget constraint.`;
          } else {
            break;
          }
          
          // Recalculate total cost
          totalCost = manualCost;
          for (const s of unfilledSlots) {
            const id = recommendations[s];
            if (id) {
              const product = candidatesPerSlot[s]?.find((c) => c._id === id);
              if (product) {
                totalCost += product.price;
              }
            }
          }
          
          if (totalCost <= Number(budget)) {
            overbudget = false;
          }
        }
      }

      return NextResponse.json({ recommendations, reasoning });
    } catch (aiError: any) {
      console.error("Gemini API call failed, falling back to heuristic:", aiError.message || aiError);
      return NextResponse.json(heuristicRecommend());
    }
  } catch (error: any) {
    console.error("AI Recommendation API failed:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error during AI recommendation." },
      { status: 500 }
    );
  }
}