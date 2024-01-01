import OpenAI from "https://deno.land/x/openai@v4.20.1/mod.ts";
import { assertNotEquals } from "https://deno.land/std@0.209.0/assert/mod.ts";
import * as log from "https://deno.land/std@0.209.0/log/mod.ts";
import { Stream } from "https://deno.land/x/openai@v4.20.1/streaming.ts";
import { ChatCompletionChunk } from "https://deno.land/x/openai@v4.20.1/resources/chat/mod.ts";
import { Denops } from "https://deno.land/x/denops_std@v5.2.0/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v5.2.0/function/mod.ts";

function logger() {
  log.setup({
    handlers: {
      file: new log.handlers.FileHandler("DEBUG", {
        filename: "./log.txt",
        formatter: "{levelName} {msg}",
      }),
    },
    loggers: {
      default: {
        level: "DEBUG",
        handlers: ["file"],
      },
    },
  });
  return log.getLogger();
}

function InitializeOpenAI(apiKey: string): OpenAI {
  logger().debug("Initialize OpenAI");
  return new OpenAI({
    apiKey: apiKey,
  });
}

function GetAPIKey(): string {
  let apiKey = "";
  // from env
  apiKey = Deno.env.get("OPENAI_API_KEY") ?? "";
  // from file ~/.config/openai.token
  if (apiKey === "") {
    logger().info("env OPENAI_API_KEY is not set");
    try {
      apiKey = Deno.readTextFileSync(
        Deno.env.get("HOME") + "/.config/openai.token",
      );
    } catch (error) {
      logger().info(error);
    }
  }
  return apiKey;
}

async function ChatCompletion(
  openai: OpenAI,
  prompt: string,
): Promise<Stream<ChatCompletionChunk>> {
  const result = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
    stream: true,
  });
  return result;
}

export async function main(denops: Denops) {
  const openai = InitializeOpenAI(GetAPIKey());
  const stream = await ChatCompletion(openai, "");

  let context = "";
  let i = 1;
  for await (const chunk of stream) {
    logger().debug(chunk.choices);
    context += chunk.choices[0].delta.content || "";
    if (context.includes("\n")) {
      await fn.setline(denops, i, context.trimEnd());
      context = "";
      i += 1;
    }
  }
}

Deno.test("Check API key", { permissions: { env: true, read: true } }, () => {
  assertNotEquals(GetAPIKey(), "");
});
