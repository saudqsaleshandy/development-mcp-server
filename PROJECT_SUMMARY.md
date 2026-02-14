# TypeScript Extractor MCP Server - Project Summary

## Overview

This project implements a Model Context Protocol (MCP) server that provides TypeScript code extraction capabilities. It runs as an HTTP server with authentication and offers tools to extract methods/functions with their relevant imports and class properties. The server uses the Streamable HTTP transport for MCP communication.

## Project Structure

```
context-tree/
├── src/
│   ├── index.ts           # MCP server entry point with HTTP transport
│   └── extractor.ts       # TypeScript parsing and extraction logic
├── test-examples/
│   ├── sample.ts          # Example TypeScript file for testing
│   └── test-extractor.ts  # Test script for manual testing
├── build/                 # Compiled JavaScript (generated)
├── node_modules/          # Dependencies (generated)
├── .mcp-tokens.json       # Stored client authentication tokens
├── package.json           # Project configuration and dependencies
├── tsconfig.json          # TypeScript compiler configuration
├── .gitignore             # Git ignore rules
├── README.md              # Project documentation
├── USAGE.md               # Detailed usage guide
├── QUICKSTART.md          # Quick start guide
└── PROJECT_SUMMARY.md     # This file
```

## Architecture

### 1. MCP HTTP Server (`src/index.ts`)

The entry point that:
 - Creates an MCP server using `@modelcontextprotocol/sdk`
 - Sets up Streamable HTTP transport for stateful communication
 - Registers three tools: `list_typescript_methods`, `extract_typescript_method`, and `read_file`
 - Implements Bearer token authentication via `/register` endpoint
 - Stores client tokens in `.mcp-tokens.json`

**Key Components:**
- `McpServer`: MCP server instance with tool capabilities
- `StreamableHTTPServerTransport`: HTTP transport for MCP protocol
- `createMcpExpressApp`: Express app with DNS rebinding protection
- `/register` endpoint: Client registration and token generation
- `/mcp` endpoint: Protected MCP tool invocation endpoint
- `authenticateToken`: Middleware for Bearer token validation
- `formatOutput()`: Formats extraction results with imports, properties, and method body

### 2. TypeScript Extractor (`src/extractor.ts`)

The core extraction logic that:
- Uses `ts-morph` library to parse TypeScript files
- Lists all methods/functions in a file
- Locates methods/functions by name
- Analyzes the AST to find used identifiers
- Filters imports to only those used by the target method
- Extracts class properties and constants from referenced classes

**Key Components:**
- `TypeScriptExtractor` class: Main extraction engine
- `listMethods()`: Lists all method/function names in a file
- `extractMethod()`: Main public API for extraction
- `findMethod()`: Locates methods across different TypeScript constructs
- `getUsedIdentifiers()`: Analyzes method body for identifier usage
- `extractRelevantImports()`: Filters imports based on usage
- `extractClassProperties()`: Extracts properties from class and referenced classes
- `isProjectImport()`: Filters to only project-relative imports

### 3. Authentication System

Token-based authentication:
- Clients register via `POST /register` with a `clientId`
- Server returns a Bearer token for authentication
- Tokens are persisted to `.mcp-tokens.json`
- Subsequent requests to `/mcp` require `Authorization: Bearer <token>` header

### 4. Test Files

- `test-examples/sample.ts`: Comprehensive example with various TypeScript patterns
- `test-examples/test-extractor.ts`: Manual test script for extractor functionality

## Technical Details

### Dependencies

**Runtime:**
- `@modelcontextprotocol/sdk`: MCP protocol implementation
- `ts-morph`: High-level TypeScript AST manipulation
- `express`: Web server framework
- `zod`: Schema validation for tool inputs

**Development:**
- `typescript`: TypeScript compiler
- `@types/node`: Node.js type definitions
- `@types/express`: Express type definitions
- `ts-node`: TypeScript execution for testing

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
3. Return only imports that:
   - Contain used identifiers
   - Are project-relative (start with `./`, `../`, or `src/`)

This ensures users see only relevant project dependencies.

### Class Properties Extraction

For class methods, the tool also extracts:
1. Instance properties from the method's class that are used
2. Static properties (constants) from the method's class
3. Properties from other classes referenced in the method

## How It Works

### Workflow for Method Extraction

1. **Client Registration**: Client calls `POST /register` with `clientId` to get a token
2. **Tool Invocation**: Client sends MCP request to `/mcp` with Bearer token
3. **File Parsing**: ts-morph parses the TypeScript file into an AST
4. **Method Location**: The tool searches for the method across all supported constructs
5. **Identifier Analysis**: The method body is analyzed to find all used identifiers
6. **Import Filtering**: Imports are filtered to only those providing used identifiers
7. **Property Extraction**: Class properties from the method's class and referenced classes are extracted
8. **Result Formatting**: The imports, properties, and method body are formatted for display
9. **Response**: Client receives the formatted result

### Example Flow

```
Client: POST /register {clientId: "my-client"}
Server: {token: "uuid-token", message: "Registration successful"}
  ↓
Client: POST /mcp (with Authorization: Bearer uuid-token)
  Body: {tool: "extract_typescript_method", params: {filePath: "sample.ts", methodName: "fetchUser"}}
  ↓
TypeScriptExtractor processes:
  1. Parse sample.ts with ts-morph
  2. Find fetchUser method in UserService class
  3. Analyze: uses axios, apiUrl, userId, response
  4. Filter imports: only axios is a project import (but it's from node_modules, so filtered out)
  5. Extract properties: apiUrl from UserService class
  6. Return: properties + method body
  ↓
MCP Server formats:
  Method Name: fetchUser
  File Path: test-examples/sample.ts
  Line Number: 42

  Imports:
  (No imports used by this method)

  Properties/Constants:
  private apiUrl: string;

  Method Body:
  async fetchUser(userId: number): Promise<User> { ... }
  ↓
Client receives result
```

## Configuration

### MCP Server Configuration

The server runs as an HTTP service:
- Default port: 4001 (configurable via `PORT` environment variable)
- Registration endpoint: `POST http://localhost:4001/register`
- MCP endpoint: `POST http://localhost:4001/mcp`
- SSE streaming: `GET http://localhost:4001/mcp`

### TypeScript Configuration

`tsconfig.json` is configured for:
- ES2022 target
- Node16 module system
- Strict type checking
- Source maps for debugging
- Declaration files for library usage

## Available Tools

### 1. `list_typescript_methods`

Lists all method and function names in a TypeScript file.

**Parameters:**
- `filePath`: Path to the TypeScript file

**Returns:** Sorted list of method/function names

### 2. `extract_typescript_method`

Extracts imports, properties, and method body from a TypeScript file.

**Parameters:**
 - `filePath`: Path to the TypeScript file
 - `methodName`: Name of the method/function to extract

**Returns:**
 - Relevant imports (project-relative only)
 - Class properties/constants used by the method
 - Complete method body

### 3. `read_file`

Reads and returns the entire contents of a file.

**Parameters:**
 - `filePath`: Path to the file

**Returns:**
 - File contents as text, or error message if file not found

## Use Cases

1. **Learning & Exploration**: Understand unfamiliar code by seeing methods with their exact dependencies
2. **Code Review**: Extract specific methods for focused review
3. **Refactoring**: See what a method depends on before moving it
4. **Documentation**: Generate examples showing method usage with required imports
5. **Dependency Analysis**: Understand what external libraries a method uses
6. **Code Navigation**: List all methods in a file to understand its structure

## Future Enhancements

Potential improvements:
- [ ] Support for method overloads
- [ ] Extract multiple related methods at once
- [ ] Show type definitions used by the method
- [ ] Export as standalone file with all dependencies
- [ ] Support for JavaScript files (not just TypeScript)
- [ ] Fuzzy matching for method names
- [ ] JSON output format option
- [ ] Inline documentation/JSDoc extraction
- [ ] HTTPS support with TLS certificates

## Development

### Building
```bash
npm run build        # Compile TypeScript
npm run watch        # Watch mode for development
```

### Testing
```bash
npm test             # Run test script (requires ts-node)
npm start            # Start MCP HTTP server
```

### Running the Server

```bash
# Start the server
npm start

# Or with custom port
PORT=3000 npm start
```

The server will:
1. Load existing tokens from `.mcp-tokens.json`
2. Start HTTP server on port 4001 (or PORT env var)
3. Log registration and MCP endpoints

### Adding New Features

To add new extraction capabilities:
1. Update `findMethod()` in `extractor.ts` to handle new construct types
2. Update `getMethodBody()` if special formatting is needed
3. Update tests in `test-examples/test-extractor.ts`
4. Update documentation in README.md and USAGE.md

## Notes

- The server uses stateful Streamable HTTP transport
- Tokens are persisted to `.mcp-tokens.json` for server restarts
- The tool works with both absolute and relative file paths
- Relative paths are resolved from the server's current working directory
- The tool requires valid, parseable TypeScript files
- Only project-relative imports are returned (external dependencies filtered out)
- Interface/type method signatures show only the signature, not implementation (as expected)

## License

MIT

## Author

Created as a custom MCP server for Claude Code integration.
