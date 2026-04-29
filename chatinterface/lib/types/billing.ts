export interface CreateCheckoutPayload {
  product_cart: Array<{
    product_id: string;
    quantity: number;
  }>;
  customer?: {
    email: string;
    name?: string;
  };
  billing_address?: {
    country: string;
  };
  metadata?: Record<string, string>;
  return_url?: string;
  trial_period_days?: number;
}

export interface PurchaseLandingProps {
  userEmail: string;
  userName: string;
  userId: string;
}

export interface Plan {
  name: "Free" | "Pro" | "Enterprise";
  price: string;
  popular?: boolean;
  features: string[];
}
