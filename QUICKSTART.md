# Quick Start - TypeScript Extractor MCP Server

Get up and running in 3 minutes.

## Installation

```bash
# 1. Navigate to project directory
cd /Users/saud/.claude/tools/context-tree

# 2. Install dependencies and build
npm install
```

The build happens automatically during install.

## Configuration

**Step 1:** Open your Claude Code MCP config file:

- **macOS/Linux**: `~/.config/claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

**Step 2:** Add this configuration:

```json
{
  "mcpServers": {
    "typescript-extractor": {
      "command": "node",
      "args": ["/Users/saud/.claude/tools/context-tree/build/index.js"]
    }
  }
}
```

**Step 3:** Restart Claude Code

## Test It

Try this in Claude Code:

```
Extract the fetchUser method from /Users/saud/.claude/tools/context-tree/test-examples/sample.ts
```

You should see:

```
=== IMPORTS ===
import axios from 'axios';

=== METHOD: fetchUser ===
async fetchUser(userId: number): Promise<User> {
  const response = await axios.get(`${this.apiUrl}/users/${userId}`);
  return response.data;
}
```

## Common Commands

```bash
# Rebuild after making changes
npm run build

# Watch mode for development
npm run watch

# View project structure
ls -la
```

## That's It!

You're ready to use the TypeScript Extractor. See:
- `USAGE.md` for detailed usage examples
- `README.md` for full documentation
- `PROJECT_SUMMARY.md` for architecture details

## Quick Examples

**Extract a class method:**
```
Extract the formatUserName method from test-examples/sample.ts
```

**Extract a hook:**
```
Show me the useUserData hook from test-examples/sample.ts
```

**Extract a function:**
```
Extract calculateTotal from test-examples/sample.ts
```

Each extraction shows only the imports that the method actually uses!
