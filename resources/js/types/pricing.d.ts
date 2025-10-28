interface PricingPackage {
  id: number;
  name: string;
  description: string;
  prompts_count: number;
  price: number;
  currency: string;
  features: string[];
  is_popular?: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UserPromptInfo {
  ai_prompts_remaining: number;
  is_paid_user: boolean;
  last_payment_date?: string;
  total_prompts_purchased: number;
}

interface PurchaseRequest {
  package_id: number;
  phone_number: string;
}

interface PurchaseResponse {
  success: boolean;
  message: string;
  prompts_added?: number;
  total_prompts?: number;
  error?: string;
}

export type { PricingPackage, UserPromptInfo, PurchaseRequest, PurchaseResponse };
