import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { getPostHogClient } from "@/lib/posthog-server";

//takes the user to dodo checkout page taking all the 
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.sub as string | undefined) || ((token as any)?.id as string | undefined);
    const userEmail = (token?.email as string | undefined) || ((token as any)?.user?.email as string | undefined);

    if (!userId || !userEmail) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      product_cart,
      customer,
      billing_address,
      metadata,
      return_url,
      trial_period_days,
      subscription_data,
    } = body;

    const apiKey = process.env.DODO_PAYMENTS_API_KEY;
    if (!apiKey) {
      console.error("Dodo Payments API key not configured in .env.local");
      return NextResponse.json({ message: "Dodo Payments API key not configured" }, { status: 500 });
    }

    const resolvedSubscriptionData =
      subscription_data ??
      (typeof trial_period_days === "number" && trial_period_days > 0
        ? { trial_period_days }
        : undefined);

    const response = await fetch("https://live.dodopayments.com/checkouts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_cart,
        customer,
        billing_address,
        metadata: {
          ...(metadata || {}),
          user_id: userId,
          user_email: userEmail,
        },
        return_url,
        ...(resolvedSubscriptionData ? { subscription_data: resolvedSubscriptionData } : {}),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Dodo Payments API Error:", errorData);
      return NextResponse.json({ message: errorData.message || "Failed to create checkout session" }, { status: response.status });
    }

    const data = await response.json();
    getPostHogClient().capture({
      distinctId: userId,
      event: "checkout_session_created",
      properties: {
        user_email: userEmail,
        trial_period_days: trial_period_days ?? null,
        product_count: Array.isArray(product_cart) ? product_cart.length : 1,
      },
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Dodo Payments API Route Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}