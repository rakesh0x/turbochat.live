import { NextResponse } from "next/server";
import { getPostHogClient } from "@/lib/posthog-server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate Dodo Payments Webhook signature here in a real app
    // const signature = req.headers.get("dodo-signature");
    
    console.log("Received Dodo Webhook Event:", body.type);

    if (body.type === "payment.succeeded") {
      const metadata = body.data?.metadata || {};
      const userId = metadata.user_id;
      const userEmail = metadata.user_email || body.data?.customer?.email || null;
      const planName = body.data?.product_name || "Pro";
      const eventId = body.data?.id || body.id || null;
      
      if (!userId && !userEmail) {
        return NextResponse.json({ message: "No user identifier in webhook payload" }, { status: 400 });
      }

      // Map credits by plan.
      let creditsToAdd = 10;
      const planKey = planName.toLowerCase();
      if (planKey.includes("starter")) creditsToAdd = 10;
      if (planKey.includes("pro")) creditsToAdd = 50;
      if (planKey.includes("enterprise")) creditsToAdd = 200;

      // Call internal python backend to update credits
      const BACKEND_URL = process.env.BACKEND_URL || (process.env.NODE_ENV === 'production' ? 'https://app.turbochat.live' : 'http://127.0.0.1:8000');
      const updateRes = await fetch(`${BACKEND_URL}/api/internal/webhook/dodo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          user_email: userEmail,
          plan: planName.toLowerCase(),
          credits: creditsToAdd,
          event_id: eventId,
        })
      });

      if (!updateRes.ok) {
        throw new Error("Failed to update credits in backend");
      }

      const posthog = getPostHogClient();
      const distinctId = userId || userEmail!;
      posthog.identify({
        distinctId,
        properties: {
          email: userEmail,
        },
      });
      posthog.capture({
        distinctId,
        event: "payment_succeeded",
        properties: {
          user_id: userId,
          user_email: userEmail,
          plan: planName,
          credits_added: creditsToAdd,
          event_id: eventId,
        },
      });

      return NextResponse.json({ message: "Credits updated successfully", credits: creditsToAdd });
    }

    return NextResponse.json({ message: "Event ignored" });
  } catch (error: any) {
    console.error("Dodo Webhook Error:", error.message);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
