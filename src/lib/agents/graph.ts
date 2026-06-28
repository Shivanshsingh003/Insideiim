import { StateGraph, START, END } from '@langchain/langgraph';
import { AgentState } from './state';
import { researchNode, bullAnalystNode, bearAnalystNode, criticNode } from './nodes';

// Build the LangGraph StateGraph topology
const builder = new StateGraph(AgentState)
  .addNode('research', researchNode)
  .addNode('bull_analyst', bullAnalystNode)
  .addNode('bear_analyst', bearAnalystNode)
  .addNode('critic', criticNode)
  
  // Set up execution flow sequentially to avoid rate-limiting on free API keys
  .addEdge(START, 'research')
  .addEdge('research', 'bull_analyst')
  .addEdge('bull_analyst', 'bear_analyst')
  .addEdge('bear_analyst', 'critic')
  
  // Decision endpoint
  .addEdge('critic', END);

// Compile the graph
export const investmentAgentGraph = builder.compile();
export default investmentAgentGraph;
