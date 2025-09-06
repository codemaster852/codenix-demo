import { action, query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import OpenAI from "openai";
import { api } from "./_generated/api";

const openai = new OpenAI({
  baseURL: process.env.CONVEX_OPENAI_BASE_URL,
  apiKey: process.env.CONVEX_OPENAI_API_KEY,
});

export const askNix = action({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    
    // Nix 1 system prompt to establish its personality and capabilities
    const systemPrompt = `You are Nix 1, an advanced large language model with deep knowledge across all domains. You have the ability to:

1. Search and synthesize information from your vast knowledge base
2. Reason through complex problems step by step
3. Provide accurate, insightful, and nuanced responses
4. Adapt your communication style to the user's needs

Your responses should be:
- Accurate and well-reasoned
- Comprehensive yet concise
- Insightful and thoughtful
- Professional but approachable

When answering, briefly indicate your reasoning process when helpful, and provide detailed, actionable information.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: args.query }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const nixResponse = response.choices[0].message.content || "I apologize, but I couldn't generate a response. Please try again.";

      // Save the conversation
      await ctx.runMutation(api.nix.saveConversation, {
        userId: userId || undefined,
        query: args.query,
        response: nixResponse,
      });

      return nixResponse;
    } catch (error) {
      console.error("Error calling Nix 1:", error);
      throw new Error("I'm experiencing technical difficulties. Please try again in a moment.");
    }
  },
});

export const getRecentConversations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    
    if (!userId) {
      return [];
    }

    return await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("asc")
      .collect();
  },
});

export const saveConversation = mutation({
  args: {
    userId: v.optional(v.id("users")),
    query: v.string(),
    response: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("conversations", {
      userId: args.userId,
      query: args.query,
      response: args.response,
      timestamp: Date.now(),
    });
  },
});
