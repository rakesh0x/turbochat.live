/**
 * Dodo Payments Integration Utility
 * Refactored to use internal API route for security.
 */


/**
 * Creates a checkout session via our internal API route
 */
export async function createCheckoutSession(payload: CreateCheckoutPayload) {
  try {
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to create checkout session");
    }

    const data = await response.json();
    return data.checkout_url;
  } catch (error) {
    console.error("Dodo Payments Client Error:", error);
    throw error;
  }
}