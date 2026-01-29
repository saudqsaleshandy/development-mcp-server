# Usage Guide: TypeScript Extractor MCP Server

This guide shows you how to set up and use the TypeScript Extractor MCP server with Claude Code.

## Quick Start

### 1. Build the Project

```bash
cd /Users/saud/.claude/tools/context-tree
npm install
npm run build
```

### 2. Configure Claude Code

Add this server to your Claude Code MCP configuration file:

**macOS/Linux**: `~/.config/claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

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

### 3. Restart Claude Code

After updating the configuration, restart Claude Code to load the new MCP server.

## Using the Tool

Once configured, you can ask Claude Code to extract TypeScript methods and functions. The tool will automatically:
- Find the method/function in the file
- Analyze which imports it uses
- Return both the imports and the complete method body

### Example Queries

**Extract a class method:**
```
Can you extract the fetchUser method from test-examples/sample.ts?
```

**Extract a standalone function:**
```
Show me the calculateTotal function from test-examples/sample.ts
```

**Extract an arrow function:**
```
Extract the formatDate function and its imports from test-examples/sample.ts
```

**Extract a complex hook:**
```
I want to see the useUserData hook from test-examples/sample.ts
```

## What the Tool Returns

The tool returns a formatted output like this:

```
=== IMPORTS ===
import axios from 'axios';

=== METHOD: fetchUser ===
async fetchUser(userId: number): Promise<User> {
  const response = await axios.get(`${this.apiUrl}/users/${userId}`);
  return response.data;
}
```

Notice that:
- Only the `axios` import is shown (not `react`, `date-fns`, or `lodash`)
- This is because `fetchUser` only uses `axios`
- The method body is shown exactly as it appears in the source file

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

### Learning a Codebase
```
I'm new to this codebase. Can you extract the authentication logic from src/auth/login.ts?
```

### Code Review
```
Extract the handlePayment method from src/payments/processor.ts so I can review it
```

### Understanding Dependencies
```
What imports does the validateForm function use? Extract it from src/utils/validation.ts
```

### Preparing for Refactoring
```
I want to move the parseUserData function to a different file. Show me the function and its dependencies from src/api/users.ts
```

## Troubleshooting

### Method Not Found
If you get an error like "Method 'xyz' not found", check:
- The method name is spelled correctly (case-sensitive)
- The method exists in the specified file
- You're looking for the right type (class method vs standalone function)

### File Not Found
If you get an error about the file not being found:
- Use an absolute path, or
- Make sure you're in the correct working directory when running Claude Code
- Relative paths are resolved from the current working directory

### No Imports Returned
If the tool returns "(No imports used by this method)":
- The method might not use any external imports
- It might only use built-in JavaScript/TypeScript features
- This is normal for simple utility functions

## Example Session

Here's a complete example of using the tool:

**User:**
```
I'm working in the test-examples directory. Can you extract the useUserData hook from sample.ts?
```

**Claude Code (using the tool):**
```
=== IMPORTS ===
import { useState, useEffect } from 'react';

=== METHOD: useUserData ===
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

Notice how it correctly identified that `useUserData` uses `useState` and `useEffect` from React, even though the file imports many other things like `axios`, `date-fns`, and `lodash`.

## Advanced Usage

### Using with Specific File Paths

You can use absolute or relative paths:

```
Extract myFunction from /absolute/path/to/file.ts
Extract myFunction from ./relative/path/to/file.ts
Extract myFunction from src/utils/helpers.ts
```

### Combining with Other Tools

You can ask Claude Code to extract a method and then do something with it:

```
Extract the calculateDiscount function from src/pricing.ts and then write tests for it
```

```
Extract the authentication middleware from src/middleware/auth.ts and explain how it works
```

## Tips

1. **Be specific with method names**: Use the exact name as it appears in the code
2. **Provide context**: Mention the file path to help Claude Code locate the method
3. **Use for learning**: This tool is great for understanding unfamiliar code
4. **Check dependencies**: Use it to see what a method depends on before refactoring

## Need Help?

If you encounter issues:
1. Check that the MCP server is configured correctly in your Claude Code settings
2. Verify the build completed successfully (`npm run build`)
3. Ensure the TypeScript file you're querying is valid and parseable
4. Try using an absolute path to the file if relative paths aren't working
