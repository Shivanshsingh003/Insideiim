import { NextRequest } from 'next/server';
import { investmentAgentGraph } from '@/lib/agents/graph';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { companyName } = await req.json();
    if (!companyName) {
      return new Response(JSON.stringify({ error: "Company name is required." }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const encoder = new TextEncoder();
    
    // We instantiate a ReadableStream to stream Server-Sent Events (SSE)
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial starting ping
          const startPayload = {
            type: 'start',
            msg: `Agent initialized. Preparing research pipelines for "${companyName}"...`,
            timestamp: new Date().toLocaleTimeString(),
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(startPayload)}\n\n`));

          // Run the LangGraph streaming updates
          const eventStream = await investmentAgentGraph.stream(
            {
              companyName,
              logs: [`Investment search started for "${companyName}"`],
            },
            {
              streamMode: 'updates',
            }
          );

          for await (const chunk of eventStream) {
            // chunk is structured like: { nodeName: { stateUpdateValues } }
            const nodeName = Object.keys(chunk)[0];
            const stateUpdate = (chunk as any)[nodeName];

            const payload = {
              type: 'update',
              node: nodeName,
              state: stateUpdate,
              timestamp: new Date().toLocaleTimeString(),
            };

            controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
          }

          // Send finish signal
          const finishPayload = {
            type: 'complete',
            msg: 'Analysis cycle completed.',
            timestamp: new Date().toLocaleTimeString(),
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(finishPayload)}\n\n`));
          controller.close();
        } catch (error: any) {
          console.error("Error streaming LangGraph execution:", error);
          const errorPayload = {
            type: 'error',
            error: error.message || String(error),
            timestamp: new Date().toLocaleTimeString(),
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorPayload)}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error("HTTP Route Handler Error:", error);
    return new Response(JSON.stringify({ error: error.message || String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
