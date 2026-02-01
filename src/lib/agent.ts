import { z } from "zod";

import { createAgentApp } from "@lucid-agents/hono";

import { createAgent } from "@lucid-agents/core";
import { http } from "@lucid-agents/http";
import { payments, paymentsFromEnv } from "@lucid-agents/payments";

import { findConstellation } from "./data";

const agent = await createAgent({
  name: process.env.AGENT_NAME ?? "constellation-shapes",
  version: process.env.AGENT_VERSION ?? "1.0.0",
  description: process.env.AGENT_DESCRIPTION ?? "Returns constellation stick-figure line segments in normalized 0-1 coordinate space. Token-efficient for agent-to-agent communication.",
})
  .use(http())
  .use(payments({ 
    config: {
      ...paymentsFromEnv(),
      facilitatorUrl: process.env.FACILITATOR_URL || 'https://x402.dexter.cash',
    }
  }))
  .build();

const { app, addEntrypoint } = await createAgentApp(agent);

const inputSchema = z.object({
  name: z.string().min(1, "Please provide a constellation name."),
});

addEntrypoint({
  key: "get-shape",
  description: "Get the shape of a constellation as line segments in 0-1 normalized coordinates",
  input: inputSchema,
  price: process.env.PRICE || "1000", // 0.001 USDC (6 decimals)
  handler: async (ctx) => {
    const input = ctx.input as z.infer<typeof inputSchema>;
    const query = input.name;

    if (!query) {
      return {
        output: { error: "missing_input", message: "Provide constellation name" },
      };
    }

    const match = findConstellation(query);

    if (!match) {
      return {
        output: { error: "unknown_constellation", input: query },
      };
    }

    return {
      output: { name: match.name, lines: match.lines },
    };
  },
});

// Health check endpoint
app.get("/health", (c) => c.json({ status: "ok", agent: "constellation-shapes" }));

export { app };
