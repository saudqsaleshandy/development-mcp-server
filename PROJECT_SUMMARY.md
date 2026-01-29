# TypeScript Extractor MCP Server - Project Summary

## Overview

This project implements a Model Context Protocol (MCP) server that integrates with Claude Code to extract TypeScript imports and method bodies. The tool enables intelligent code exploration by analyzing TypeScript files and returning only the relevant imports used by specific methods.

## Project Structure

```
typescript-extractor-mcp/
├── src/
│   ├── index.ts           # MCP server entry point
│   └── extractor.ts       # TypeScript parsing and extraction logic
├── test-examples/
│   ├── sample.ts          # Example TypeScript file for testing
│   └── test-extractor.ts  # Test script (for manual testing)
├── build/                 # Compiled JavaScript (generated)
├── node_modules/          # Dependencies (generated)
├── package.json           # Project configuration and dependencies
├── tsconfig.json          # TypeScript compiler configuration
├── .gitignore            # Git ignore rules
├── README.md             # Project documentation
├── USAGE.md              # Detailed usage guide
└── PROJECT_SUMMARY.md    # This file
```

## Architecture

### 1. MCP Server (`src/index.ts`)

The entry point that:
- Sets up an MCP server using the `@modelcontextprotocol/sdk`
- Registers the `extract_typescript_method` tool
- Handles tool requests from Claude Code
- Formats and returns extraction results

**Key Components:**
- `EXTRACT_METHOD_TOOL`: Tool definition with name, description, and input schema
- `server`: MCP server instance
- Request handlers for `ListToolsRequest` and `CallToolRequest`
- `formatOutput()`: Formats the extraction results for display

### 2. TypeScript Extractor (`src/extractor.ts`)

The core extraction logic that:
- Uses `ts-morph` library to parse TypeScript files
- Locates methods/functions by name
- Analyzes the AST to find used identifiers
- Filters imports to only those used by the target method

**Key Components:**
- `TypeScriptExtractor` class: Main extraction engine
- `extractMethod()`: Main public API
- `findMethod()`: Locates methods across different TypeScript constructs
- `getUsedIdentifiers()`: Analyzes method body for identifier usage
- `extractRelevantImports()`: Filters imports based on usage

### 3. Test Files

- `test-examples/sample.ts`: Comprehensive example with various TypeScript patterns
- `test-examples/test-extractor.ts`: Manual test script (can be extended)

## Technical Details

### Dependencies

**Runtime:**
- `@modelcontextprotocol/sdk`: MCP protocol implementation
- `ts-morph`: High-level TypeScript AST manipulation

**Development:**
- `typescript`: TypeScript compiler
- `@types/node`: Node.js type definitions

### Supported TypeScript Constructs

The extractor handles:
1. Class instance methods
2. Class static methods
3. Standalone function declarations
4. Arrow functions assigned to variables
5. Function expressions assigned to variables
6. Interface method signatures
7. Type alias method signatures

### Smart Import Filtering

The tool analyzes the method's Abstract Syntax Tree (AST) to:
1. Extract all identifiers used in the method body
2. Check each import declaration for matches
3. Return only imports that contain used identifiers

This ensures users see only relevant dependencies, making it easier to understand and refactor code.

## How It Works

### Workflow

1. **User Request**: User asks Claude Code to extract a method
2. **Tool Invocation**: Claude Code calls `extract_typescript_method` with file path and method name
3. **File Parsing**: ts-morph parses the TypeScript file into an AST
4. **Method Location**: The tool searches for the method across all supported constructs
5. **Identifier Analysis**: The method body is analyzed to find all used identifiers
6. **Import Filtering**: Imports are filtered to only those providing used identifiers
7. **Result Formatting**: The imports and method body are formatted for display
8. **Response**: Claude Code receives and presents the formatted result

### Example Flow

```
User: "Extract fetchUser from sample.ts"
  ↓
Claude Code invokes: extract_typescript_method
  Parameters: {filePath: "sample.ts", methodName: "fetchUser"}
  ↓
TypeScriptExtractor processes:
  1. Parse sample.ts with ts-morph
  2. Find fetchUser method in UserService class
  3. Analyze: uses axios, apiUrl, userId, response
  4. Filter imports: only axios is from an import
  5. Return: axios import + fetchUser method body
  ↓
MCP Server formats:
  === IMPORTS ===
  import axios from 'axios';

  === METHOD: fetchUser ===
  async fetchUser(userId: number): Promise<User> { ... }
  ↓
Claude Code displays result to user
```

## Configuration

### MCP Server Configuration

Add to Claude Code's config file (`~/.config/claude/claude_desktop_config.json`):

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

### TypeScript Configuration

`tsconfig.json` is configured for:
- ES2022 target
- Node16 module system
- Strict type checking
- Source maps for debugging
- Declaration files for library usage

## Use Cases

1. **Learning & Exploration**: Understand unfamiliar code by seeing methods with their exact dependencies
2. **Code Review**: Extract specific methods for focused review
3. **Refactoring**: See what a method depends on before moving it
4. **Documentation**: Generate examples showing method usage with required imports
5. **Dependency Analysis**: Understand what external libraries a method uses

## Future Enhancements

Potential improvements:
- [ ] Support for method overloads
- [ ] Extract multiple related methods at once
- [ ] Show type definitions used by the method
- [ ] Export as standalone file with all dependencies
- [ ] Support for JavaScript files (not just TypeScript)
- [ ] Fuzzy matching for method names
- [ ] List all available methods when method not found
- [ ] JSON output format option
- [ ] Inline documentation/JSDoc extraction

## Development

### Building
```bash
npm run build        # Compile TypeScript
npm run watch        # Watch mode for development
```

### Testing
```bash
npm test             # Run test script (requires ts-node)
node build/index.js  # Start MCP server manually
```

### Adding New Features

To add new extraction capabilities:
1. Update `findMethod()` in `extractor.ts` to handle new construct types
2. Update `getMethodBody()` if special formatting is needed
3. Update tests in `test-examples/test-extractor.ts`
4. Update documentation in README.md and USAGE.md

## Notes

- The MCP SDK's `Server` class shows a deprecation warning but is fully functional
- The tool works with both absolute and relative file paths
- Relative paths are resolved from the current working directory
- The tool requires valid, parseable TypeScript files
- Interface/type method signatures show only the signature, not implementation (as expected)

## License

MIT

## Author

Created as a custom MCP server for Claude Code integration.
