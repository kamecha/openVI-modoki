import OpenAI from "https://deno.land/x/openai@v4.20.1/mod.ts";
import { assertNotEquals } from "https://deno.land/std@0.209.0/assert/mod.ts";

function InitializeOpenAI(apiKey: string): OpenAI {
  return new OpenAI({
    apiKey: apiKey,
  });
}

async function main() {
  const openai = InitializeOpenAI(Deno.env.get("OPENAI_API_KEY") || "");
  const stream = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: "Hello, World!" }],
    stream: true,
  });

  for await (const chunk of stream) {
    Deno.stdout.write(
      new TextEncoder().encode(chunk.choices[0].delta.content || ""),
    );
  }
}

main();

Deno.test("Check API key", { permissions: { env: true } }, () => {
  assertNotEquals(Deno.env.get("OPENAI_API_KEY"), undefined);
});

Deno.bench("Initialize OpenAI", { permissions: { env: true } }, () => {
  new OpenAI({
    apiKey: Deno.env.get("OPENAI_API_KEY") || "",
  });
});
