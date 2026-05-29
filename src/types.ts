/**
 * Types and schemas for the SAT Live client area.
 */

export interface PaymentHistoryItem {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  method: string;
}

export interface CustomerSubscription {
  status: 'active' | 'expired' | 'ending';
  planName: string;
  connections: number;
  expirationDate: string; // ISO date or DD/MM/YYYY
  renewalValue: number;
}

export interface CustomerProfile {
  id: string;
  username: string;
  name: string;
  phone: string;
  email: string;
}

export interface CustomerData {
  profile: CustomerProfile;
  subscription: CustomerSubscription;
  payments: PaymentHistoryItem[];
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  customer?: CustomerProfile;
  error?: string;
}
