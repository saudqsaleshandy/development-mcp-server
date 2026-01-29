# TypeScript Extractor MCP Server

An MCP (Model Context Protocol) server for extracting TypeScript imports and method bodies. This tool integrates with Claude Code and allows you to extract specific methods/functions along with their relevant imports from TypeScript files.

## Features

- **Comprehensive Method Detection**: Extracts class methods (instance & static), standalone functions, arrow functions, and interface/type method signatures
- **Smart Import Filtering**: Returns only imports that are actually used by the specified method
- **Plain Text Output**: Returns readable code with clear separation between imports and method body
- **Error Handling**: Provides clear error messages when methods are not found

## Installation

```bash
npm install
npm run build
```

## Configuration

Add this server to your Claude Code MCP settings file:

**For macOS/Linux**: `~/.config/claude/claude_desktop_config.json`
**For Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "typescript-extractor": {
      "command": "node",
      "args": ["/absolute/path/to/typescript-extractor-mcp/build/index.js"]
    }
  }
}
```

Replace `/absolute/path/to/typescript-extractor-mcp` with the actual path to this directory.

## Usage

Once configured, the tool becomes available in Claude Code as `extract_typescript_method`.

### Example Usage in Claude Code

```
Can you extract the `handleSubmit` method from src/components/Form.tsx?
```

Claude Code will use the `extract_typescript_method` tool to:
1. Parse the TypeScript file
2. Find the `handleSubmit` method
3. Identify which imports are used by that method
4. Return both the relevant imports and the complete method body

### Parameters

- **filePath** (string, required): Path to the TypeScript file (absolute or relative to current working directory)
- **methodName** (string, required): Name of the method, function, or variable containing the function to extract

### Output Format

```
=== IMPORTS ===
import { useState } from 'react';
import { validateForm } from './utils';

=== METHOD: handleSubmit ===
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  const isValid = validateForm(formData);
  if (isValid) {
    // ... rest of method
  }
};
```

## Supported TypeScript Constructs

- Class methods (instance methods)
- Static class methods
- Standalone function declarations
- Arrow functions assigned to variables
- Function expressions assigned to variables
- Interface method signatures
- Type alias method signatures

## Development

```bash
# Watch mode for development
npm run watch

# Build for production
npm run build
```

## Use Cases

- **Learning & Exploration**: Quickly understand how specific methods work and what they depend on
- **Code Review**: Extract methods with their dependencies for focused review
- **Documentation**: Generate examples showing method implementations with required imports
- **Refactoring**: See exact dependencies before moving code to different files

## License

MIT
