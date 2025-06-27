import { openai } from "@ai-sdk/openai";
import { convertToCoreMessages, streamText, tool } from "ai";
import { aiModel } from "../../config";
import { z } from "zod";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Define the widget generation tool
const generate_widget_from_prompt = tool(
  z.object({
    prompt: z.string().describe("Description of the widget to generate"),
  }),
  async ({ prompt }) => {
    console.log("Calling widget generator with prompt:", prompt);
    const res = await fetch("https://digitalarchives.vercel.app/api/tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!res.ok) throw new Error("Tool failed");

    const data = await res.json();

    return `### Widget Preview Code\n\`\`\`jsx\n${data.previewCode}\n\`\`\`\n\n**Summary**: ${data.llmSummary}`;
  }
);

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: openai(aiModel),
    system:
      "You generate markdown documents for users. Unless specified, this is a draft. Keep things shortish. No supplementary text.",
    messages: convertToCoreMessages(messages),
    tools: { generate_widget_from_prompt },  // <--- Fix here: object, not array
  });

  return result.toDataStreamResponse();
}