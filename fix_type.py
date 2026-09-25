with open('src/types/game.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('readonly stateVersion: number;', 'readonly stateVersion?: number;')

with open('src/types/game.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("Made stateVersion optional")
