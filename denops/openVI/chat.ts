import { Denops, fn } from "./deps/denops.ts";
import { ChatCompletionChunk, OpenAI, Stream } from "./deps/openai.ts";
import { logger } from "./logger.ts";

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
  let lnum = 1;
  for await (const chunk of stream) {
    context += chunk.choices[0].delta.content || "";
    await fn.setbufline(denops, buf, lnum, context.trimEnd());
    if (chunk.choices[0].delta.content?.endsWith("\n")) {
      context = "";
      lnum += 1;
    }
  }
}

export async function OpenChat(denops: Denops): Promise<fn.BufNameArg> {
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

export async function ChatStream(
  denops: Denops,
  openai: OpenAI,
  chatBuffer: fn.BufNameArg,
  prompt: string,
) {
  const stream = await ChatCompletion(openai, prompt);
  await DrawStream(denops, chatBuffer, stream);
  console.log("done");
}
