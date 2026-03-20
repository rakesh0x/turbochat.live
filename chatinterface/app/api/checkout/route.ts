import { NextResponse } from "next/server";

//takes the user to dodo checkout page taking all the 
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { product_cart, customer, billing_address, metadata, return_url } = body;

    const apiKey = process.env.DODO_PAYMENTS_API_KEY;
    if (!apiKey) {
      console.error("Dodo Payments API key not configured in .env.local");
      return NextResponse.json({ message: "Dodo Payments API key not configured" }, { status: 500 });
    }

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
        metadata,
        return_url,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Dodo Payments API Error:", errorData);
      return NextResponse.json({ message: errorData.message || "Failed to create checkout session" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Dodo Payments API Route Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}