import OpenAI from "https://deno.land/x/openai@v4.20.1/mod.ts";
import { assertNotEquals } from "https://deno.land/std@0.209.0/assert/mod.ts";
import { getLogger } from "https://deno.land/std@0.209.0/log/mod.ts";
import { Stream } from "https://deno.land/x/openai@v4.20.1/streaming.ts";
import { ChatCompletionChunk } from "https://deno.land/x/openai@v4.20.1/resources/chat/mod.ts";

function logger() {
  return getLogger("my-awesome-module");
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

async function ChatCompletion(openai: OpenAI, prompt: string): Promise<Stream<ChatCompletionChunk>> {
  const result = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
    stream: true,
  });
  return result;
}

async function main() {
  const openai = InitializeOpenAI(GetAPIKey());
  const stream = await ChatCompletion(openai, "");

  for await (const chunk of stream) {
    Deno.stdout.write(
      new TextEncoder().encode(chunk.choices[0].delta.content || ""),
    );
  }
}

main();

Deno.test("Check API key", { permissions: { env: true, read: true} }, () => {
  assertNotEquals(GetAPIKey(), "");
});

Deno.bench("Initialize OpenAI", { permissions: { env: true } }, () => {
  new OpenAI({
    apiKey: Deno.env.get("OPENAI_API_KEY") || "",
  });
});
