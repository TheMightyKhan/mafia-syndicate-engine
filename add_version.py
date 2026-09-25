import re

with open('src/types/game.ts', 'r', encoding='utf-8') as f:
    content = f.read()

if 'stateVersion?: number;' not in content:
    content = content.replace(
        'isBotEnabled: boolean;',
        'isBotEnabled: boolean;\n  stateVersion?: number;'
    )
    with open('src/types/game.ts', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Added stateVersion to src/types/game.ts")

with open('src/server/state/memory.ts', 'r', encoding='utf-8') as f:
    mem_content = f.read()

if '(lobby.stateVersion ?? 0) + 1' not in mem_content:
    mem_content = mem_content.replace(
        'const updated = updater(lobby);',
        'const updated = { ...updater(lobby), stateVersion: (lobby.stateVersion ?? 0) + 1 };'
    )
    with open('src/server/state/memory.ts', 'w', encoding='utf-8') as f:
        f.write(mem_content)
    print("Added version bumping to InMemoryLobbyStore")
