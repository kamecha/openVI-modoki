import { Denops } from "./deps/denops.ts";
import { GetAPIKey, InitializeOpenAI } from "./openai.ts";
import { OpenPrompt } from "./prompt.ts";
import { ChatStream, OpenChat } from "./chat.ts";
import { OpenAI } from "./deps/openai.ts";

export function main(denops: Denops) {
  let openai: OpenAI;
  denops.dispatcher = {
    setup(): Promise<unknown> {
      openai = InitializeOpenAI(GetAPIKey());
      return Promise.resolve();
    },
    async openPrompt(): Promise<unknown> {
      await OpenPrompt(denops);
      return Promise.resolve();
    },
    async sendPrompt(prompt: unknown): Promise<unknown> {
      const content = (prompt as string[]).join("\n");
      const chatBuffer = await OpenChat(denops);
      if (!openai) {
        console.error("OpenAI is not initialized");
        console.error("Please run :VISetup to initialize OpenAI");
        return Promise.resolve();
      }
      await ChatStream(denops, openai, chatBuffer, content);
      return Promise.resolve();
    },
  };
}
