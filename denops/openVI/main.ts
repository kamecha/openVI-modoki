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

async function OpenPrompt(denops: Denops): Promise<fn.BufNameArg> {
  // make prompt buffer
  const promptName = "vi-prompt";
  const promptBuffer = await fn.bufnr(denops, promptName, true);
  await fn.setbufvar(denops, promptBuffer, "&filetype", "vi-prompt");
  // open prompt buffer
  const currentBuffer = await fn.bufnr(denops);
  await fn.setbufvar(denops, currentBuffer, "&splitbelow", 1);
  await denops.cmd(`sbuffer ${promptBuffer}`);
  await denops.cmd("setlocal buftype=nofile");
  await fn.setbufvar(denops, currentBuffer, "&splitbelow", 0);
  return promptBuffer;
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
