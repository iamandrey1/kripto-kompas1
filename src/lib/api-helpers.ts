import { ETHERSCAN_API_KEY, HELIUS_API_KEY, GROQ_API_KEY, GROQ_API_URL, GROQ_MODEL, ETHERSCAN_BASE_URL, HELIUS_BASE_URL } from './api-config';

// ============ ETHERSCAN API ============

export interface EthWalletData {
  address: string;
  balance: string;
  balanceUsd: number;
  ethPrice: number;
  transactions: EthTransaction[];
}

export interface EthTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: string;
  gasUsed: string;
}

export async function fetchEthWalletData(address: string): Promise<EthWalletData | null> {
  try {
    // Get ETH balance
    const balanceRes = await fetch(
      `${ETHERSCAN_BASE_URL}?module=account&action=balance&address=${address}&tag=latest&apikey=${ETHERSCAN_API_KEY}`
    );
    const balanceData = await balanceRes.json();

    // Get ETH price
    const priceRes = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
    );
    const priceData = await priceRes.json();
    const ethPrice = priceData.ethereum?.usd || 0;

    const balance = balanceData.status === '1' ? (parseInt(balanceData.result) / 1e18).toFixed(6) : '0';

    // Get recent transactions
    const txRes = await fetch(
      `${ETHERSCAN_BASE_URL}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${ETHERSCAN_API_KEY}`
    );
    const txData = await txRes.json();
    const transactions: EthTransaction[] = (txData.result || []).slice(0, 10).map((tx: any) => ({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: (parseInt(tx.value) / 1e18).toFixed(6),
      timestamp: new Date(parseInt(tx.timeStamp) * 1000).toLocaleDateString(),
      gasUsed: tx.gasUsed
    }));

    return {
      address,
      balance,
      balanceUsd: parseFloat(balance) * ethPrice,
      ethPrice,
      transactions
    };
  } catch (error) {
    console.error('Etherscan API error:', error);
    return null;
  }
}

// ============ HELIUS API (Solana) ============

export interface SolWalletData {
  address: string;
  balance: number;
  balanceUsd: number;
  solPrice: number;
  tokens: SolToken[];
}

export interface SolToken {
  mint: string;
  amount: number;
  symbol: string;
  decimals: number;
}

export async function fetchSolWalletData(address: string): Promise<SolWalletData | null> {
  try {
    // Get SOL price
    const priceRes = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'
    );
    const priceData = await priceRes.json();
    const solPrice = priceData.solana?.usd || 0;

    // Get wallet balance via Helius
    const balanceRes = await fetch(HELIUS_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getBalance',
        params: [address]
      })
    });
    const balanceData = await balanceRes.json();
    const balance = balanceData.result?.value ? balanceData.result.value / 1e9 : 0;

    // Get SPL tokens (token balances)
    const tokensRes = await fetch(HELIUS_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTokenAccounts',
        params: {
          account: address
        }
      })
    });
    const tokensData = await tokensRes.json();

    return {
      address,
      balance,
      balanceUsd: balance * solPrice,
      solPrice,
      tokens: []
    };
  } catch (error) {
    console.error('Helius API error:', error);
    return null;
  }
}

// ============ GROQ AI API ============

export async function askGroqAI(question: string, context: string = ''): Promise<string> {
  try {
    const systemPrompt = `Ты - эксперт по криптовалютам и блокчейну. Отвечай коротко и по делу на русском языке.
Контекст: ${context}
Если не знаешь точного ответа - скажи честно.`;

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Извините, не смог обработать запрос.';
  } catch (error) {
    console.error('Groq API error:', error);
    return 'Произошла ошибка при обращении к AI. Попробуйте позже.';
  }
}

// ============ PRICE ALERTS CHECK ============

export async function checkPriceAlerts(alerts: Array<{symbol: string; targetPrice: number; condition: 'above' | 'below'}>) {
  const triggered: string[] = [];

  for (const alert of alerts) {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${alert.symbol.toLowerCase()}&vs_currencies=usd`
      );
      const data = await response.json();
      const currentPrice = data[alert.symbol.toLowerCase()]?.usd;

      if (currentPrice) {
        if (alert.condition === 'above' && currentPrice >= alert.targetPrice) {
          triggered.push(alert.symbol);
        } else if (alert.condition === 'below' && currentPrice <= alert.targetPrice) {
          triggered.push(alert.symbol);
        }
      }
    } catch (error) {
      console.error('Price check error:', error);
    }
  }

  return triggered;
}