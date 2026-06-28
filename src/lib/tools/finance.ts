import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

/**
 * Searches for a ticker symbol given a company name.
 * Returns the best match ticker or throws an error.
 */
export async function searchTicker(companyName: string): Promise<string> {
  try {
    const result = (await yahooFinance.search(companyName)) as any;
    const quotes = result.quotes;
    if (quotes && quotes.length > 0) {
      // Find the first equity type quote
      const equityQuote = quotes.find((q: any) => q.quoteType === 'EQUITY');
      if (equityQuote && equityQuote.symbol) {
        return equityQuote.symbol;
      }
      if (quotes[0].symbol) {
        return quotes[0].symbol;
      }
    }
    throw new Error(`No ticker found for company: ${companyName}`);
  } catch (error: any) {
    console.error(`Error in searchTicker for "${companyName}":`, error);
    throw error;
  }
}

export interface CleanFinancials {
  symbol: string;
  summary: {
    longName: string;
    sector: string;
    industry: string;
    longBusinessSummary: string;
    website: string;
  };
  metrics: {
    currentPrice: number;
    marketCap: number;
    peRatio: number | null;
    forwardPe: number | null;
    eps: number | null;
    dividendYield: number | null;
    beta: number | null;
    profitMargin: number | null;
    operatingMargin: number | null;
    returnOnEquity: number | null;
    debtToEquity: number | null;
    freeCashFlow: number | null;
  };
  history: {
    revenue: { year: number; value: number }[];
    netIncome: { year: number; value: number }[];
    operatingCashflow: { year: number; value: number }[];
  };
}

/**
 * Fetches quote summary and financial history for a given ticker symbol.
 */
export async function getFinancialData(symbol: string): Promise<CleanFinancials> {
  try {
    const quoteSummary = (await yahooFinance.quoteSummary(symbol, {
      modules: [
        'price',
        'summaryProfile',
        'financialData',
        'defaultKeyStatistics',
        'incomeStatementHistory',
        'balanceSheetHistory',
        'cashflowStatementHistory',
      ],
    })) as any;

    const price = quoteSummary.price || {};
    const profile = quoteSummary.summaryProfile || {};
    const financialData = quoteSummary.financialData || {};
    const keyStats = quoteSummary.defaultKeyStatistics || {};
    
    // Parse historical statements for charts
    const incomeHistory = quoteSummary.incomeStatementHistory?.incomeStatementHistory || [];
    const cashflowHistory = quoteSummary.cashflowStatementHistory?.cashflowStatementHistory || [];

    const revenueHistory = incomeHistory.map((item: any) => ({
      year: new Date(item.endDate).getFullYear(),
      value: item.totalRevenue || 0,
    })).reverse();

    const netIncomeHistory = incomeHistory.map((item: any) => ({
      year: new Date(item.endDate).getFullYear(),
      value: item.netIncome || 0,
    })).reverse();

    const ocfHistory = cashflowHistory.map((item: any) => ({
      year: new Date(item.endDate).getFullYear(),
      value: item.totalCashFromOperatingActivities || 0,
    })).reverse();

    return {
      symbol,
      summary: {
        longName: price.longName || symbol,
        sector: profile.sector || 'N/A',
        industry: profile.industry || 'N/A',
        longBusinessSummary: profile.longBusinessSummary || '',
        website: profile.website || '',
      },
      metrics: {
        currentPrice: financialData.currentPrice || price.regularMarketPrice || 0,
        marketCap: price.marketCap || 0,
        peRatio: keyStats.trailingPE || null,
        forwardPe: keyStats.forwardPE || null,
        eps: keyStats.trailingEps || null,
        dividendYield: keyStats.dividendYield || null,
        beta: keyStats.beta || null,
        profitMargin: financialData.profitMargins || keyStats.profitMargins || null,
        operatingMargin: financialData.operatingMargins || null,
        returnOnEquity: financialData.returnOnEquity || null,
        debtToEquity: financialData.debtToEquity || null,
        freeCashFlow: financialData.freeCashflow || null,
      },
      history: {
        revenue: revenueHistory,
        netIncome: netIncomeHistory,
        operatingCashflow: ocfHistory,
      },
    };
  } catch (error: any) {
    console.error(`Error in getFinancialData for symbol "${symbol}":`, error);
    throw error;
  }
}

export interface NewsArticle {
  title: string;
  publisher: string;
  link: string;
  pubDate: string;
  snippet: string;
}

/**
 * Fetches recent news for a symbol using Yahoo Finance search.
 */
export async function getNews(symbol: string): Promise<NewsArticle[]> {
  try {
    const searchRes = (await yahooFinance.search(symbol, { newsCount: 8 })) as any;
    const news = searchRes.news || [];
    
    return news.map((item: any) => ({
      title: item.title || 'No Title',
      publisher: item.publisher || 'Yahoo Finance',
      link: item.link || '',
      pubDate: item.providerPublishTime 
        ? new Date(item.providerPublishTime * 1000).toLocaleDateString()
        : 'N/A',
      snippet: item.uuid || '',
    }));
  } catch (error: any) {
    console.error(`Error in getNews for symbol "${symbol}":`, error);
    return [];
  }
}
