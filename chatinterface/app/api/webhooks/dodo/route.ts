import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate Dodo Payments Webhook signature here in a real app
    // const signature = req.headers.get("dodo-signature");
    
    console.log("Received Dodo Webhook Event:", body.type);

    if (body.type === "payment.succeeded") {
      const metadata = body.data?.metadata || {};
      const userId = metadata.user_id;
      const planName = body.data?.product_name || "Pro";
      
      if (!userId) {
        return NextResponse.json({ message: "No user_id in metadata" }, { status: 400 });
      }

      // Add credits based on plan. E.g., Pro = 50 credits
      const creditsToAdd = planName.toLowerCase().includes("pro") ? 50 : 10;

      // Call internal python backend to update credits
      const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
      const updateRes = await fetch(`${BACKEND_URL}/api/internal/webhook/dodo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          plan: planName.toLowerCase(),
          credits: creditsToAdd
        })
      });

      if (!updateRes.ok) {
        throw new Error("Failed to update credits in backend");
      }

      return NextResponse.json({ message: "Credits updated successfully", credits: creditsToAdd });
    }

    return NextResponse.json({ message: "Event ignored" });
  } catch (error: any) {
    console.error("Dodo Webhook Error:", error.message);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
