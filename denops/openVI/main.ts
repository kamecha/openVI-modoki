import { Denops } from "./deps/denops.ts";
import { GetAPIKey, InitializeOpenAI } from "./openai.ts";
import { OpenPrompt } from "./prompt.ts";
import { ChatStream, OpenChat } from "./chat.ts";

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
