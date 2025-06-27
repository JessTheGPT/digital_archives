import { openai } from "@ai-sdk/openai";
import { convertToCoreMessages, streamText } from "ai";
import { aiModel } from "../../config";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const functions = [
    {
      name: "generate_widget_from_prompt",
      description: "Generate a React widget config from a natural language prompt.",
      parameters: {
        type: "object",
        properties: {
          prompt: {
            type: "string",
            description: "Description of the widget to generate",
          },
        },
        required: ["prompt"],
      },
    },
  ];

  const result = await streamText({
    model: openai(aiModel),
    system:
      "You generate markdown documents for users. Unless specified, this is a draft. Keep things shortish. No supplementary text.",
    messages: convertToCoreMessages(messages),
    functions,
    async function_call({ name, arguments: args }) {
      if (name === "generate_widget_from_prompt") {
        const { prompt } = JSON.parse(args);
        const res = await fetch("https://digitalarchives.vercel.app/api/tools", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });
        if (!res.ok) throw new Error("Tool failed");
        const data = await res.json();
        return `### Widget Preview Code\n\`\`\`jsx\n${data.previewCode}\n\`\`\`\n\n**Summary**: ${data.llmSummary}`;
      }
      throw new Error("Unknown function call");
    },
  });

  return result.toDataStreamResponse();
}