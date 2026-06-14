import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@langchain/langgraph", "@langchain/mcp-adapters", "@langchain/openai"],
  env: {
    NEXT_PUBLIC_APP_NAME: "TripPlanner AI",
  },
};

export default nextConfig;
