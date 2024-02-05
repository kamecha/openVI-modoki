
command! VISetup call denops#request('openVI', 'setup', [])

command! VIPromptOpen call denops#request('openVI', 'openPrompt', [])

command! VIPromptSend call denops#notify('openVI', 'sendPrompt', [getline(1, '$')])
