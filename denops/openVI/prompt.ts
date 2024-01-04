import { Denops, fn } from "./deps/denops.ts";

export async function OpenPrompt(denops: Denops): Promise<fn.BufNameArg> {
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
