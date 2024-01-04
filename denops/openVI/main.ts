import { assertNotEquals } from "./deps/std/assert.ts";
import { ChatCompletionChunk, OpenAI, Stream } from "./deps/openai.ts";
import { Denops, fn } from "./deps/denops.ts";
import { logger } from "./logger.ts";
import { GetAPIKey, InitializeOpenAI } from "./openai.ts";
import { OpenPrompt } from "./prompt.ts";

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

async function DrawStream(
  denops: Denops,
  buf: fn.BufNameArg,
  stream: Stream<ChatCompletionChunk>,
) {
  let context = "";
  let i = 1;
  for await (const chunk of stream) {
    logger().debug(chunk.choices);
    context += chunk.choices[0].delta.content || "";
    if (context.includes("\n")) {
      await fn.setbufline(denops, buf, i, context.trimEnd());
      context = "";
      i += 1;
    }
  }
}

async function OpenChat(denops: Denops): Promise<fn.BufNameArg> {
  // make chat buffer
  const chatName = "vi-chat";
  const chatBuffer = await fn.bufnr(denops, chatName, true);
  await fn.setbufvar(denops, chatBuffer, "&filetype", "vi-chat");
  await fn.setbufvar(denops, chatBuffer, "&buftype", "nofile");
  await fn.setbufvar(denops, chatBuffer, "&number", 0);
  // open chat buffer
  await denops.cmd(`sbuffer ${chatBuffer}`);
  return chatBuffer;
}

async function ChatStream(
  denops: Denops,
  openai: OpenAI,
  chatBuffer: fn.BufNameArg,
  prompt: string,
) {
  const stream = await ChatCompletion(openai, prompt);
  await DrawStream(denops, chatBuffer, stream);
  console.log("done");
}

export function main(denops: Denops) {
  const openai = InitializeOpenAI(GetAPIKey());
  denops.dispatcher = {
    async openPrompt(): Promise<unknown> {
      await OpenPrompt(denops);
      return Promise.resolve();
    },
    async sendPrompt(prompt: unknown): Promise<unknown> {
      const content = (prompt as string[]).join("\n");
      const chatBuffer = await OpenChat(denops);
      await ChatStream(denops, openai, chatBuffer, content);
      return Promise.resolve();
    },
  };
}

Deno.test("Check API key", { permissions: { env: true, read: true } }, () => {
  assertNotEquals(GetAPIKey(), "");
});
