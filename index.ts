import { Atlas } from "./src";
import { anthropic } from "@ai-sdk/anthropic";

const atlas = new Atlas({ model: anthropic("claude-fable-5") });
const { report } = await atlas.research(
  "What's changing in browser automation for AI agents?",
);