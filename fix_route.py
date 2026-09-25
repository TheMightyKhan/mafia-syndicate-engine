import re

with open('src/app/api/lobby/[lobbyId]/route.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Make GET resilient
if 'export async function GET' in content:
    content = re.sub(
        r'(export async function GET.*?\{)(.*?)(\n\})',
        r'\1\n  try {\2  } catch (error) { return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 }); }\3',
        content,
        flags=re.DOTALL
    )

# Write back
with open('src/app/api/lobby/[lobbyId]/route.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("Added try/catch to GET route")
