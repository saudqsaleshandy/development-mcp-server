# Usage Guide: TypeScript Extractor MCP Server

This guide shows you how to set up and use the TypeScript Extractor MCP server.

## Quick Start

### 1. Build the Project

```bash
cd /Users/saud/Projects/ai-tools/mcp-servers/context-tree
npm install
npm run build
```

### 2. Start the Server

```bash
npm start
```

The server will start on port 4001 (or the port specified by the `PORT` environment variable).

### 3. Register a Client

Before using the tools, you need to register and obtain an authentication token:

```bash
curl -X POST http://localhost:4001/register \
  -H "Content-Type: application/json" \
  -d '{"clientId": "my-client"}'
```

Save the returned token for subsequent requests.

## Server Endpoints

| Endpoint | Method | Authentication | Description |
|----------|--------|----------------|-------------|
| `/register` | POST | None | Register a client and get a Bearer token |
| `/mcp` | POST | Bearer token required | Call MCP tools |
| `/mcp` | GET | Bearer token required | SSE streaming endpoint |

## Authentication

All MCP tool calls require authentication via a Bearer token:

```bash
curl -X POST http://localhost:4001/mcp \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

Tokens are persisted to `.mcp-tokens.json` and survive server restarts.

## Available Tools

### 1. `list_typescript_methods`

Lists all method and function names in a TypeScript file. This is useful for exploring a file's structure before extracting specific methods.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `filePath` | string | Yes | Path to the TypeScript file (absolute or relative to server's working directory) |

**Example Request:**

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
      "arguments": {
        "filePath": "test-examples/sample.ts"
      }
    }
  }'
```

**Example Response:**

```
Found 7 method(s)/function(s):

- calculateTotal
- fetchUser
- formatDate
- formatUserName
- processData
- transform
- useUserData
```

### 2. `extract_typescript_method`

Extracts a method or function along with its relevant imports and class properties.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `filePath` | string | Yes | Path to the TypeScript file |
| `methodName` | string | Yes | Name of the method/function to extract |

**Example Request:**

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
        "methodName": "fetchUser"
      }
    }
  }'
```

**Example Response:**

```
Method Name: fetchUser
File Path: test-examples/sample.ts
Line Number: 42

Imports:
(No imports used by this method)

Properties/Constants:
private apiUrl: string;

Method Body:
async fetchUser(userId: number): Promise<User> {
  const response = await axios.get(`${this.apiUrl}/users/${userId}`);
  return response.data;
}
```

## What the Tool Returns

The extraction tool returns a YAML-style formatted output with the following sections:

### Header Information
- **Method Name**: The name of the extracted method/function
- **File Path**: The path to the source file
- **Line Number**: The line number where the method is defined

### 1. Imports

Only project-relative imports that are actually used by the method:
- Imports starting with `./`, `../`, or `src/`
- External dependencies (like `axios`, `react`) are filtered out

### 2. Properties/Constants

For class methods, this includes:
- Instance properties from the method's class that are referenced
- Static properties (constants) from the method's class
- Properties from other classes instantiated in the method

### 3. Method Body

The complete method body as it appears in the source file.

## Supported Method Types

The tool can extract:

1. **Class Methods** (instance methods)
   ```typescript
   class MyClass {
     myMethod() { ... }
   }
   ```

2. **Static Methods**
   ```typescript
   class MyClass {
     static myMethod() { ... }
   }
   ```

3. **Standalone Functions**
   ```typescript
   function myFunction() { ... }
   ```

4. **Arrow Functions**
   ```typescript
   const myFunction = () => { ... };
   ```

5. **Function Expressions**
   ```typescript
   const myFunction = function() { ... };
   ```

6. **Interface Method Signatures**
   ```typescript
   interface MyInterface {
     myMethod(): void;
   }
   ```

7. **Type Method Signatures**
   ```typescript
   type MyType = {
     myMethod(): void;
   };
   ```

## Common Use Cases

### Exploring a File

First, list all methods to understand what's available:

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
      "arguments": {"filePath": "src/auth/login.ts"}
    }
  }'
```

Then extract the specific method you're interested in.

### Learning a Codebase

Extract the authentication logic:

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
        "filePath": "src/auth/login.ts",
        "methodName": "authenticateUser"
      }
    }
  }'
```

### Code Review

Extract the payment handling method:

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
        "filePath": "src/payments/processor.ts",
        "methodName": "handlePayment"
      }
    }
  }'
```

### Understanding Dependencies

Extract to see what imports and properties a method uses:

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
        "filePath": "src/utils/validation.ts",
        "methodName": "validateForm"
      }
    }
  }'
```

### Preparing for Refactoring

Extract to understand dependencies before moving code:

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
        "filePath": "src/api/users.ts",
        "methodName": "parseUserData"
      }
    }
  }'
```

## Example Session

Here's a complete example:

**Step 1: Start the server**
```bash
npm start
```

**Step 2: Register a client**
```bash
curl -X POST http://localhost:4001/register \
  -H "Content-Type: application/json" \
  -d '{"clientId": "my-app"}'
```

Response:
```json
{
  "token": "550e8400-e29b-41d4-a716-446655440000",
  "clientId": "my-app",
  "message": "Registration successful"
}
```

**Step 3: List methods in the file**
```bash
curl -X POST http://localhost:4001/mcp \
  -H "Authorization: Bearer 550e8400-e29b-41d4-a716-446655440000" \
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

**Step 4: Extract the useUserData hook**
```bash
curl -X POST http://localhost:4001/mcp \
  -H "Authorization: Bearer 550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
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

Response:
```
Method Name: useUserData
File Path: test-examples/sample.ts
Line Number: 95

Imports:
(No imports used by this method)

Properties/Constants:
private apiUrl: string;

Method Body:
export const useUserData = (userId: number) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const service = new UserService('https://api.example.com');
        const userData = await service.fetchUser(userId);
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  return { user, loading };
};
```

Notice that:
- No imports are shown (React hooks are external dependencies)
- The `apiUrl` property from `UserService` is extracted because it's referenced
- The complete method body is shown

## Advanced Usage

### Using with Specific File Paths

You can use absolute or relative paths:

```bash
# Absolute path
{"filePath": "/absolute/path/to/file.ts"}

# Relative to server's working directory
{"filePath": "./relative/path/to/file.ts"}
{"filePath": "src/utils/helpers.ts"}
```

### Custom Port

Start the server on a custom port:

```bash
PORT=3000 npm start
```

Then use `http://localhost:3000` for all requests.

### Token Persistence

Tokens are stored in `.mcp-tokens.json`. The server loads these on startup, so registered clients remain valid after server restarts.

To view registered tokens:

```bash
cat .mcp-tokens.json
```

## Troubleshooting

### Authentication Errors

If you get a 401 or 403 error:
- Ensure you're including the `Authorization: Bearer <token>` header
- Verify the token is valid (check `.mcp-tokens.json`)
- Re-register if needed to get a new token

### Method Not Found

If you get "Method 'xyz' not found", check:
- The method name is spelled correctly (case-sensitive)
- The method exists in the specified file
- You're looking for the right type (class method vs standalone function)
- Try listing all methods first with `list_typescript_methods`

### File Not Found

If you get an error about the file not being found:
- Use an absolute path, or
- Ensure the path is relative to the server's working directory
- Verify the file exists: `ls -la <path>`

### No Imports Returned

If the tool returns "(No imports used by this method)":
- The method might not use any project-relative imports
- It might only use external dependencies (which are filtered out)
- It might only use built-in JavaScript/TypeScript features
- This is normal for many methods

### Server Not Running

If you can't connect to the server:
- Check if the server is running: `ps aux | grep node`
- Verify the port isn't in use: `lsof -i :4001`
- Check server logs for errors

## Tips

1. **List before extracting**: Use `list_typescript_methods` to see what's available
2. **Be specific with method names**: Use the exact name as it appears in the code
3. **Provide correct paths**: Paths are relative to the server's working directory
4. **Use for learning**: This tool is great for understanding unfamiliar code
5. **Check dependencies**: Use it to see what a method depends on before refactoring

## Need Help?

If you encounter issues:
1. Check that the server is running (`npm start`)
2. Verify the build completed successfully (`npm run build`)
3. Ensure the TypeScript file you're querying is valid and parseable
4. Try using an absolute path to the file
5. Check the server logs for error messages
