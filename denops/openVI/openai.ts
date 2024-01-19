import { OpenAI } from "./deps/openai.ts";
import { assertNotEquals } from "./deps/std/assert.ts";
import { logger } from "./logger.ts";

export function GetAPIKey(): string {
  let apiKey = "";
  // from env
  apiKey = Deno.env.get("OPENAI_API_KEY") ?? "";
  // from file ~/.config/openai.token
  if (apiKey === "") {
    try {
      apiKey = Deno.readTextFileSync(
        Deno.env.get("HOME") + "/.config/openai.token",
      );
    } catch (error) {
      console.error(error);
    }
  }
  return apiKey;
}

export function InitializeOpenAI(apiKey: string): OpenAI {
  return new OpenAI({
    apiKey: apiKey,
  });
}

Deno.test("Check API key", { permissions: { env: true, read: true } }, () => {
  assertNotEquals(GetAPIKey(), "");
});
