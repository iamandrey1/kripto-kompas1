import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jpzovlqfcitomuvabyrt.supabase.co';
const supabaseAnonKey = 'sb_publishable_NE_YqdtNitM4Zs5Dv9kqAQ_3RTpj3KH';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface PortfolioItem {
  id: string;
  user_id: string;
  token_id: string;
  name: string;
  symbol: string;
  amount: number;
  buy_price: number;
  created_at: string;
}

export interface WatchlistItem {
  id: string;
  user_id: string;
  token_id: string;
  created_at: string;
}

export interface PriceAlert {
  id: string;
  user_id: string;
  token_id: string;
  symbol: string;
  target_price: number;
  condition: 'above' | 'below';
  triggered: boolean;
  created_at: string;
}
