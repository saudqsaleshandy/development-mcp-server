# TypeScript Extractor MCP Server

An MCP (Model Context Protocol) server for extracting TypeScript imports and method bodies. This tool runs as an HTTP server with authentication and provides tools to extract specific methods/functions along with their relevant imports and class properties from TypeScript files.

## Features

- **HTTP-based MCP Server**: Uses Streamable HTTP transport for stateful communication
- **Authentication**: Bearer token authentication with client registration
- **List Methods Tool**: Discover all methods/functions in a TypeScript file
- **Extract Method Tool**: Extract methods with their dependencies
- **Smart Import Filtering**: Returns only project-relative imports that are actually used
- **Class Property Extraction**: Extracts properties from the method's class and referenced classes
- **Comprehensive Method Detection**: Handles class methods (instance & static), standalone functions, arrow functions, and interface/type method signatures
- **Plain Text Output**: Returns readable code with clear separation between imports, properties, and method body

## Architecture

This is an HTTP-based MCP server that:
- Runs on a configurable port (default: 4001)
- Requires client registration for authentication
- Uses Bearer tokens for API security
- Persists tokens to `.mcp-tokens.json`

## Installation

```bash
npm install
npm run build
```

## Running the Server

```bash
npm start
```

The server will start on port 4001. You can customize the port:

```bash
PORT=3000 npm start
```

## Quick Start

### 1. Start the Server

```bash
npm start
```

### 2. Register a Client

```bash
curl -X POST http://localhost:4001/register \
  -H "Content-Type: application/json" \
  -d '{"clientId": "my-client"}'
```

Save the returned token.

### 3. List Methods in a File

```bash
curl -X POST http://localhost:4001/mcp \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "list_typescript_methods",
      "arguments": {"filePath": "test-examples/sample.ts"}
    }
  }'
```

### 4. Extract a Method

```bash
curl -X POST http://localhost:4001/mcp \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "extract_typescript_method",
      "arguments": {
        "filePath": "test-examples/sample.ts",
        "methodName": "fetchUser"
      }
    }
  }'
```

## API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/register` | POST | No | Register client and obtain Bearer token |
| `/mcp` | POST | Bearer | Call MCP tools |
| `/mcp` | GET | Bearer | SSE streaming endpoint |

## Available Tools

### `list_typescript_methods`

Lists all method and function names in a TypeScript file.

**Parameters:**
- `filePath` (string, required): Path to the TypeScript file

**Example:**
```bash
curl -X POST http://localhost:4001/mcp \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "list_typescript_methods",
      "arguments": {"filePath": "src/app.ts"}
    }
  }'
```

### `extract_typescript_method`

Extracts a method/function with its relevant imports and class properties.

**Parameters:**
- `filePath` (string, required): Path to the TypeScript file
- `methodName` (string, required): Name of the method/function to extract

**Example:**
```bash
curl -X POST http://localhost:4001/mcp \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "extract_typescript_method",
      "arguments": {
        "filePath": "src/app.ts",
        "methodName": "handleRequest"
      }
    }
  }'
```

**Output Format:**
```
=== IMPORTS ===
import { helper } from './utils';

=== PROPERTIES/CONSTANTS ===
private config: Config;
static MAX_RETRIES = 3;

=== METHOD: handleRequest ===
async handleRequest(req: Request): Promise<Response> {
  // method body
}
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

# Run tests
npm test
```

## How It Works

1. **Parse**: Uses `ts-morph` to parse TypeScript files into an AST
2. **Locate**: Finds the requested method across all supported constructs
3. **Analyze**: Identifies all identifiers used in the method body
4. **Filter Imports**: Returns only project-relative imports (`./`, `../`, `src/`) that are used
5. **Extract Properties**: For class methods, extracts properties from the class and referenced classes
6. **Format**: Returns structured output with imports, properties, and method body

## Use Cases

- **Learning & Exploration**: Quickly understand how specific methods work and what they depend on
- **Code Review**: Extract methods with their dependencies for focused review
- **Documentation**: Generate examples showing method implementations with required imports
- **Refactoring**: See exact dependencies before moving code to different files
- **Code Navigation**: List all methods in a file to understand its structure

## Project Structure

```
context-tree/
├── src/
│   ├── index.ts           # MCP HTTP server
│   └── extractor.ts       # TypeScript extraction logic
├── test-examples/
│   ├── sample.ts          # Example TypeScript file
│   └── test-extractor.ts  # Test script
├── build/                 # Compiled JavaScript
├── package.json
├── tsconfig.json
└── .mcp-tokens.json       # Stored authentication tokens
```

## Dependencies

- `@modelcontextprotocol/sdk`: MCP protocol implementation
- `ts-morph`: TypeScript AST manipulation
- `express`: Web server
- `zod`: Schema validation

## Documentation

- `QUICKSTART.md` - Get up and running in minutes
- `USAGE.md` - Detailed usage guide with examples
- `PROJECT_SUMMARY.md` - Architecture and technical details

## License

MIT
