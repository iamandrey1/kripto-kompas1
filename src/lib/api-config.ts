// API Keys and Configuration
// Store API keys securely in .env file

// Etherscan API - for ETH wallet data
export const ETHERSCAN_API_KEY = import.meta.env.VITE_ETHERSCAN_API_KEY || '';
export const ETHERSCAN_BASE_URL = 'https://api.etherscan.io/api';

// Helius API - for Solana wallet data
export const HELIUS_API_KEY = import.meta.env.VITE_HELIUS_API_KEY || '';
export const HELIUS_BASE_URL = 'https://api.helius-rpc.com';

// Groq API - for AI chat (free, fast)
export const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
export const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
export const GROQ_MODEL = 'llama-3.3-70b-versatile';

// Supabase (already configured in supabase.ts)
export const SUPABASE_URL = 'https://jpzovlqfcitomuvabyrt.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_NE_YqdtNitM4Zs5Dv9kqAQ_3RTpj3KH';