import { Annotation } from '@langchain/langgraph';
import { CleanFinancials, NewsArticle } from '../tools/finance';

export const AgentState = Annotation.Root({
  companyName: Annotation<string>(),
  ticker: Annotation<string>(),
  financials: Annotation<CleanFinancials | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  news: Annotation<NewsArticle[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  bullCasePoints: Annotation<string[]>({
    reducer: (x, y) => y,
    default: () => [],
  }),
  bearCasePoints: Annotation<string[]>({
    reducer: (x, y) => y,
    default: () => [],
  }),
  criticFeedback: Annotation<string>({
    reducer: (x, y) => y,
    default: () => '',
  }),
  recommendation: Annotation<"INVEST" | "PASS" | "HOLD" | null>({
    reducer: (x, y) => y,
    default: () => null,
  }),
  confidenceScore: Annotation<number>({
    reducer: (x, y) => y,
    default: () => 0,
  }),
  reasoningSummary: Annotation<string>({
    reducer: (x, y) => y,
    default: () => '',
  }),
  logs: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  currentNode: Annotation<string>({
    reducer: (x, y) => y,
    default: () => 'START',
  }),
});

export type AgentStateType = typeof AgentState.State;
export type AgentStateUpdate = Partial<typeof AgentState.State>;
