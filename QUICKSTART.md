# Quick Start - TypeScript Extractor MCP Server

Get up and running in 5 minutes.

## Installation

```bash
# 1. Navigate to project directory
cd /Users/saud/Projects/ai-tools/mcp-servers/context-tree

# 2. Install dependencies and build
npm install
```

The build happens automatically during install.

## Start the Server

```bash
npm start
```

You should see:
```
TypeScript Extractor MCP Server running on http://localhost:4001
Registration endpoint: POST http://localhost:4001/register
MCP endpoint: http://localhost:4001/mcp
Tokens stored in: /Users/saud/Projects/ai-tools/mcp-servers/context-tree/.mcp-tokens.json
```

## Register a Client

Before using the MCP tools, you need to register and obtain an authentication token:

```bash
curl -X POST http://localhost:4001/register \
  -H "Content-Type: application/json" \
  -d '{"clientId": "my-client"}'
```

Response:
```json
{
  "token": "550e8400-e29b-41d4-a716-446655440000",
  "clientId": "my-client",
  "message": "Registration successful",
  "usage": "Include this token in Authorization header as \"Bearer <token>\""
}
```

Save the token - you'll need it for all MCP requests.

## Test It

### List Methods in a File

```bash
curl -X POST http://localhost:4001/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "list_typescript_methods",
      "arguments": {
        "filePath": "test-examples/sample.ts"
      }
    }
  }'
```

You should see a list of all methods/functions in the file.

### Extract a Method

```bash
curl -X POST http://localhost:4001/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
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

You should see:

```
=== IMPORTS ===
(No imports used by this method)

=== PROPERTIES/CONSTANTS ===
private apiUrl: string;

=== METHOD: fetchUser ===
async fetchUser(userId: number): Promise<User> {
  const response = await axios.get(`${this.apiUrl}/users/${userId}`);
  return response.data;
}
```

## Common Commands

```bash
# Start the server
npm start

# Start with custom port
PORT=3000 npm start

# Rebuild after making changes
npm run build

# Watch mode for development
npm run watch

# Run tests
npm test

# View project structure
ls -la
```

## Server Endpoints

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/register` | POST | No | Register client and get token |
| `/mcp` | POST | Yes | Call MCP tools |
| `/mcp` | GET | Yes | SSE streaming endpoint |

## Available Tools

### `list_typescript_methods`

Lists all methods and functions in a TypeScript file.

**Parameters:**
- `filePath`: Path to the TypeScript file

### `extract_typescript_method`

Extracts a method with its imports and properties.

**Parameters:**
- `filePath`: Path to the TypeScript file
- `methodName`: Name of the method to extract

## That's It!

You're ready to use the TypeScript Extractor. See:
- `USAGE.md` for detailed usage examples
- `README.md` for full documentation
- `PROJECT_SUMMARY.md` for architecture details

## Quick Examples

**List all methods in a file:**
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

**Extract a class method:**
```bash
curl -X POST http://localhost:4001/mcp \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "extract_typescript_method",
      "arguments": {
        "filePath": "test-examples/sample.ts",
        "methodName": "formatUserName"
      }
    }
  }'
```

**Extract a hook:**
```bash
curl -X POST http://localhost:4001/mcp \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "extract_typescript_method",
      "arguments": {
        "filePath": "test-examples/sample.ts",
        "methodName": "useUserData"
      }
    }
  }'
```

**Extract a function:**
```bash
curl -X POST http://localhost:4001/mcp \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "extract_typescript_method",
      "arguments": {
        "filePath": "test-examples/sample.ts",
        "methodName": "calculateTotal"
      }
    }
  }'
```

Each extraction shows:
- Only project-relative imports that the method uses
- Class properties/constants referenced by the method
- The complete method body
