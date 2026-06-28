import { AgentStateType, AgentStateUpdate } from './state';
import { searchTicker, getFinancialData, getNews } from '../tools/finance';
import { getModel } from './model';

/**
 * Robust JSON extraction helper. Extracts and parses JSON from LLM markdown/text responses.
 */
function parseJSONRobustly<T>(text: string): T {
  // Clean potential markdown blocks
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  }
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch (e) {
    // Attempt regex extraction of the first matching JSON block
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as T;
      } catch (innerErr: any) {
        throw new Error(`Failed to parse extracted JSON block: ${innerErr.message || innerErr}`);
      }
    }
    throw new Error(`No JSON structure detected in response: ${text.slice(0, 200)}...`);
  }
}

/**
 * Node 1: Research Node
 * Resolves ticker and fetches all financial data and news.
 */
export async function researchNode(state: AgentStateType): Promise<AgentStateUpdate> {
  const companyName = state.companyName;
  const newLogs: string[] = [`[Research] Initiating investigation for "${companyName}"...`];

  try {
    let ticker = state.ticker;
    if (!ticker) {
      newLogs.push(`[Research] Looking up ticker symbol for "${companyName}"...`);
      ticker = await searchTicker(companyName);
      newLogs.push(`[Research] Identified ticker: ${ticker}`);
    }

    newLogs.push(`[Research] Fetching financial history and key statistics for ${ticker}...`);
    const financials = await getFinancialData(ticker);
    
    newLogs.push(`[Research] Retrieving recent market news for ${ticker}...`);
    const news = await getNews(ticker);
    
    newLogs.push(`[Research] Financial data and news successfully retrieved.`);

    return {
      ticker,
      financials,
      news,
      currentNode: 'research',
      logs: newLogs,
    };
  } catch (error: any) {
    console.error("Error in researchNode:", error);
    return {
      currentNode: 'research',
      logs: [
        ...newLogs,
        `[Research] ERROR: Failed to gather data. ${error.message || error}`,
      ],
    };
  }
}

/**
 * Node 2: Bull Analyst Node
 * Formulates the positive growth-oriented case for investment.
 */
export async function bullAnalystNode(state: AgentStateType): Promise<AgentStateUpdate> {
  const ticker = state.ticker;
  const financials = state.financials;
  const news = state.news;
  
  if (!financials) {
    return {
      currentNode: 'bull_analyst',
      logs: ['[Bull Analyst] Skipped: No financial data available.'],
    };
  }

  const newLogs = [`[Bull Analyst] Formulating growth drivers and upside potential for ${ticker}...`];

  try {
    const model = getModel();
    const systemPrompt = `You are a Senior Investment Analyst presenting a bullish (long) case for ${financials.summary.longName} (${ticker}).
Your job is to provide exactly 3 to 5 clear, highly analytical, numeric-supported arguments for why this stock represents a buy.
Rely strictly on provided numbers (FCF, revenues, profit margins, ROE). Do not make up facts.

You MUST reply with a valid JSON object in this exact schema (no markdown, no conversational text, just raw JSON):
{
  "bullPoints": [
    "Specific growth driver 1 with numbers...",
    "Specific growth driver 2 with numbers...",
    "Specific growth driver 3 with numbers..."
  ]
}`;

    const prompt = `Use the following gathered data:

Company Profile:
Sector: ${financials.summary.sector}
Industry: ${financials.summary.industry}
Business Summary: ${financials.summary.longBusinessSummary}

Key Metrics:
Current Price: $${financials.metrics.currentPrice}
Market Cap: $${financials.metrics.marketCap}
P/E Ratio: ${financials.metrics.peRatio || 'N/A'}
Forward P/E: ${financials.metrics.forwardPe || 'N/A'}
EPS: ${financials.metrics.eps || 'N/A'}
Return on Equity (ROE): ${financials.metrics.returnOnEquity ? (financials.metrics.returnOnEquity * 100).toFixed(2) + '%' : 'N/A'}
Profit Margin: ${financials.metrics.profitMargin ? (financials.metrics.profitMargin * 100).toFixed(2) + '%' : 'N/A'}
Debt to Equity: ${financials.metrics.debtToEquity || 'N/A'}
Free Cash Flow: $${financials.metrics.freeCashFlow || 'N/A'}

Historical Trend (Latest to Oldest):
Revenue History: ${JSON.stringify(financials.history.revenue)}
Net Income History: ${JSON.stringify(financials.history.netIncome)}
Operating Cash Flow History: ${JSON.stringify(financials.history.operatingCashflow)}

Recent News Articles:
${news.map((n, i) => `${i+1}. [${n.pubDate}] ${n.title} (Publisher: ${n.publisher})`).join('\n')}

Analyze the financials and generate your bullish case.`;

    const response = await model.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ]);

    const result = parseJSONRobustly<{ bullPoints: string[] }>(response.content as string);
    newLogs.push(`[Bull Analyst] Completed bullish thesis formulation with ${result.bullPoints.length} core pillars.`);

    return {
      bullCasePoints: result.bullPoints,
      currentNode: 'bull_analyst',
      logs: newLogs,
    };
  } catch (error: any) {
    console.error("Error in bullAnalystNode:", error);
    return {
      currentNode: 'bull_analyst',
      logs: [
        ...newLogs,
        `[Bull Analyst] ERROR: Failed to generate thesis. ${error.message || error}`,
      ],
    };
  }
}

/**
 * Node 3: Bear Analyst Node
 * Formulates the negative risk-oriented case against investment.
 */
export async function bearAnalystNode(state: AgentStateType): Promise<AgentStateUpdate> {
  const ticker = state.ticker;
  const financials = state.financials;
  const news = state.news;
  
  if (!financials) {
    return {
      currentNode: 'bear_analyst',
      logs: ['[Bear Analyst] Skipped: No financial data available.'],
    };
  }

  const newLogs = [`[Bear Analyst] Examining leverage, margin pressures, industry competition, and risks for ${ticker}...`];

  try {
    const model = getModel();
    const systemPrompt = `You are a Short Seller / Risk Officer presenting a bearish (short) case or critical risks for ${financials.summary.longName} (${ticker}).
Your job is to provide exactly 3 to 5 clear, highly critical, numeric-supported arguments outlining the structural, macro, valuation, or balance-sheet risks.
Rely strictly on provided numbers (debt levels, cash burn, profit margins). Do not make up facts.

You MUST reply with a valid JSON object in this exact schema (no markdown, no conversational text, just raw JSON):
{
  "bearPoints": [
    "Specific risk factor 1 with numbers...",
    "Specific risk factor 2 with numbers...",
    "Specific risk factor 3 with numbers..."
  ]
}`;

    const prompt = `Use the following gathered data:

Company Profile:
Sector: ${financials.summary.sector}
Industry: ${financials.summary.industry}
Business Summary: ${financials.summary.longBusinessSummary}

Key Metrics:
Current Price: $${financials.metrics.currentPrice}
Market Cap: $${financials.metrics.marketCap}
P/E Ratio: ${financials.metrics.peRatio || 'N/A'}
Forward P/E: ${financials.metrics.forwardPe || 'N/A'}
EPS: ${financials.metrics.eps || 'N/A'}
Return on Equity (ROE): ${financials.metrics.returnOnEquity ? (financials.metrics.returnOnEquity * 100).toFixed(2) + '%' : 'N/A'}
Profit Margin: ${financials.metrics.profitMargin ? (financials.metrics.profitMargin * 100).toFixed(2) + '%' : 'N/A'}
Debt to Equity: ${financials.metrics.debtToEquity || 'N/A'}
Free Cash Flow: $${financials.metrics.freeCashFlow || 'N/A'}

Historical Trend (Latest to Oldest):
Revenue History: ${JSON.stringify(financials.history.revenue)}
Net Income History: ${JSON.stringify(financials.history.netIncome)}
Operating Cash Flow History: ${JSON.stringify(financials.history.operatingCashflow)}

Recent News Articles:
${news.map((n, i) => `${i+1}. [${n.pubDate}] ${n.title} (Publisher: ${n.publisher})`).join('\n')}

Analyze the financials and generate your bearish risks.`;

    const response = await model.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ]);

    const result = parseJSONRobustly<{ bearPoints: string[] }>(response.content as string);
    newLogs.push(`[Bear Analyst] Completed risk thesis formulation with ${result.bearPoints.length} core risks identified.`);

    return {
      bearCasePoints: result.bearPoints,
      currentNode: 'bear_analyst',
      logs: newLogs,
    };
  } catch (error: any) {
    console.error("Error in bearAnalystNode:", error);
    return {
      currentNode: 'bear_analyst',
      logs: [
        ...newLogs,
        `[Bear Analyst] ERROR: Failed to generate risks. ${error.message || error}`,
      ],
    };
  }
}

/**
 * Node 4: Critic Node
 * Synthesizes the debate, validates mathematical facts, and issues the final recommendation.
 */
export async function criticNode(state: AgentStateType): Promise<AgentStateUpdate> {
  const ticker = state.ticker;
  const financials = state.financials;
  const bullPoints = state.bullCasePoints;
  const bearPoints = state.bearCasePoints;
  
  if (!financials) {
    return {
      currentNode: 'critic',
      logs: ['[Critic] Skipped: No financial data available.'],
    };
  }

  const newLogs = [`[Critic] Evaluating the dialectic debate points (Bull vs. Bear) and cross-checking claims...`];

  try {
    const model = getModel();
    const systemPrompt = `You are the Investment Committee Chair at Altuni AI Labs. Your task is to review the research and dialectic arguments, double-check any math, and output a final decision: INVEST, PASS, or HOLD.

You MUST reply with a valid JSON object in this exact schema (no markdown, no conversational text, just raw JSON):
{
  "recommendation": "INVEST" or "PASS" or "HOLD",
  "confidenceScore": 85,
  "reasoningSummary": "A concise 3-4 sentence justification explaining why this recommendation was reached, acknowledging the counter-thesis.",
  "mathValidationFeedback": "A short verification note checking if the numbers quoted in the bull/bear cases match the provided financial statements."
}`;

    const prompt = `Target: ${financials.summary.longName} (${ticker})

Financial Statements Data:
Current Price: $${financials.metrics.currentPrice}
Market Cap: $${financials.metrics.marketCap}
P/E Ratio: ${financials.metrics.peRatio || 'N/A'}
Return on Equity: ${financials.metrics.returnOnEquity ? (financials.metrics.returnOnEquity * 100).toFixed(2) + '%' : 'N/A'}
Debt to Equity: ${financials.metrics.debtToEquity || 'N/A'}
Free Cash Flow: $${financials.metrics.freeCashFlow || 'N/A'}
Revenue Trend: ${JSON.stringify(financials.history.revenue)}
Net Income Trend: ${JSON.stringify(financials.history.netIncome)}

PROPOSED ARGUMENTS TO CROSS-EXAMINE:
Bull Case (Growth Thesis):
${bullPoints.map((p, i) => `- ${p}`).join('\n')}

Bear Case (Risk Factors):
${bearPoints.map((p, i) => `- ${p}`).join('\n')}

INSTRUCTIONS:
1. Verify if any of the numbers claimed in the Bull/Bear case contradict the official numbers in the financial statements.
2. Synthesize the debate. Weigh the growth potential against the capital risk.
3. Decide the final Action: INVEST, PASS, or HOLD.
4. Assign a confidence score from 0 to 100.`;

    const response = await model.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ]);

    interface CriticResult {
      recommendation: "INVEST" | "PASS" | "HOLD";
      confidenceScore: number;
      reasoningSummary: string;
      mathValidationFeedback: string;
    }

    const result = parseJSONRobustly<CriticResult>(response.content as string);

    newLogs.push(`[Critic] Verdict rendered: ${result.recommendation} (${result.confidenceScore}% Confidence).`);
    newLogs.push(`[Critic] Validation check: "${result.mathValidationFeedback}"`);

    return {
      recommendation: result.recommendation,
      confidenceScore: result.confidenceScore,
      reasoningSummary: result.reasoningSummary,
      criticFeedback: result.mathValidationFeedback,
      currentNode: 'critic',
      logs: newLogs,
    };
  } catch (error: any) {
    console.error("Error in criticNode:", error);
    return {
      currentNode: 'critic',
      logs: [
        ...newLogs,
        `[Critic] ERROR: Failed to synthesize investment decision. ${error.message || error}`,
      ],
    };
  }
}
