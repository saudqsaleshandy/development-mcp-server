#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { TypeScriptExtractor } from './extractor.js';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const extractor = new TypeScriptExtractor();

// Token storage file path
const TOKENS_FILE = join(process.cwd(), '.mcp-tokens.json');

// Client token mapping: clientId -> token
const clientTokens = new Map<string, string>();

// Load tokens from file
function loadTokens() {
  try {
    if (existsSync(TOKENS_FILE)) {
      const data = readFileSync(TOKENS_FILE, 'utf-8');
      const tokens = JSON.parse(data);
      Object.entries(tokens).forEach(([clientId, token]) => {
        clientTokens.set(clientId, token as string);
      });
      console.error(`Loaded ${clientTokens.size} client token(s) from storage`);
    }
  } catch (error) {
    console.error('Error loading tokens:', error);
  }
}

// Save tokens to file
function saveTokens() {
  try {
    const tokens = Object.fromEntries(clientTokens);
    const existingTokens = JSON.parse(readFileSync(TOKENS_FILE, 'utf-8'));
    writeFileSync(TOKENS_FILE, JSON.stringify({...tokens, ...existingTokens}, null, 2));
  } catch (error) {
    console.error('Error saving tokens:', error);
  }
}

const mcpServer = new McpServer(
  {
    name: 'typescript-extractor',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register the list methods tool
mcpServer.registerTool(
  'list_typescript_methods',
  {
    description: 'List all method and function names in a TypeScript file. Finds function declarations, class methods (instance and static), arrow functions, interface methods, and type alias methods.',
    inputSchema: z.object({
      filePath: z.string().describe('Path to the TypeScript file (absolute or relative to current working directory)'),
    }),
  },
  async (args) => {
    const { filePath } = args;

    const result = extractor.listMethods(filePath);

    if (!result.success) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${result.error}`,
          },
        ],
      };
    }

    const methods = result.methods || [];
    const output = methods.length > 0
      ? `Found ${methods.length} method(s)/function(s):\n\n${methods.map(m => `- ${m}`).join('\n')}`
      : 'No methods or functions found in this file.';

    return {
      content: [
        {
          type: 'text',
          text: output,
        },
      ],
    };
  }
);

// Register the extract method tool
mcpServer.registerTool(
  'extract_typescript_method',
  {
    description: 'Extract TypeScript imports, class properties/constants, and method/function body from a file. Supports class methods, standalone functions, arrow functions, and interface/type method signatures. For class methods, extracts properties and constants from all referenced classes. Returns only the imports and properties that are actually used by the specified method.',
    inputSchema: z.object({
      filePath: z.string().describe('Path to the TypeScript file (absolute or relative to current working directory)'),
      methodName: z.string().describe('Name of the method, function, or variable containing the function to extract'),
    }),
  },
  async (args) => {
    const { filePath, methodName } = args;

    const result = extractor.extractMethod(filePath, methodName);

    if (!result.success) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${result.error}`,
          },
        ],
      };
    }

    const output = formatOutput(result.imports || '', result.properties || '', result.methodBody || '', methodName, filePath, result.lineNumber || 0);

    return {
      content: [
        {
          type: 'text',
          text: output,
        },
      ],
    };
  }
);

// Register the read file tool
mcpServer.registerTool(
  'read_file',
  {
    description: 'Read and return the entire contents of a file.',
    inputSchema: z.object({
      filePath: z.string().describe('Path to the file (absolute or relative to current working directory)'),
    }),
  },
  async (args) => {
    const { filePath } = args;

    try {
      const content = readFileSync(filePath, 'utf-8');
      return {
        content: [
          {
            type: 'text',
            text: content,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: Failed to read file - ${(error as Error).message}`,
          },
        ],
      };
    }
  }
);

function formatOutput(imports: string, properties: string, methodBody: string, methodName: string, filePath: string, lineNumber: number): string {
  const parts: string[] = [];

  // YAML header
  parts.push(`Method Name: ${methodName}`);
  parts.push(`File Path: ${filePath}`);
  parts.push(`Line Number: ${lineNumber}`);
  parts.push('');

  // Imports section
  parts.push('Imports:');
  if (imports) {
    parts.push(imports);
  } else {
    parts.push('(No imports used by this method)');
  }
  parts.push('');

  // Properties/Constants section
  parts.push('Properties/Constants:');
  if (properties) {
    parts.push(properties);
  } else {
    parts.push('(No class properties or constants used)');
  }
  parts.push('');

  // Method Body section
  parts.push('Method Body:');
  parts.push(methodBody);

  return parts.join('\n');
}

// Authentication middleware
function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : null;

  if (!token) {
    res.status(401).json({ error: 'Authentication token required' });
    return;
  }

  // Check if token exists in our storage
  const isValidToken = Array.from(clientTokens.values()).includes(token);
  if (!isValidToken) {
    res.status(403).json({ error: 'Invalid or expired token' });
    return;
  }

  next();
}

async function main() {
  const PORT = process.env.PORT || 4001;

  // Load existing tokens from file
  loadTokens();

  // Create MCP Express app with DNS rebinding protection
  const app = createMcpExpressApp({ host: '127.0.0.1' });

  // Create StreamableHTTPServerTransport in stateful mode
  const transport = new StreamableHTTPServerTransport();

  // Connect server to transport
  await mcpServer.connect(transport);

  // Registration endpoint - generates or returns existing authentication token
  app.post('/register', (req: Request, res: Response) => {
    const { clientId } = req.body;

    if (!clientId || typeof clientId !== 'string') {
      res.status(400).json({ error: 'clientId is required' });
      return;
    }

    // Return existing token if client already registered
    let token = clientTokens.get(clientId);

    if (!token) {
      // Generate new token for new client
      token = randomUUID();
      clientTokens.set(clientId, token);
      saveTokens();
      console.error(`New client registered: ${clientId}`);
    } else {
      console.error(`Existing client authenticated: ${clientId}`);
    }

    res.json({
      token,
      clientId,
      message: token === clientTokens.get(clientId) ? 'Registration successful' : 'Token retrieved',
      usage: 'Include this token in Authorization header as "Bearer <token>"',
    });
  });

  // Protected MCP endpoints - require authentication
  app.post('/mcp', authenticateToken, (req: Request, res: Response) => {
    transport.handleRequest(req, res, req.body);
  });

  // Optional: GET endpoint for SSE streaming
  app.get('/mcp', authenticateToken, (req: Request, res: Response) => {
    transport.handleRequest(req, res);
  });

  app.listen(PORT, () => {
    console.error(`TypeScript Extractor MCP Server running on http://localhost:${PORT}`);
    console.error(`Registration endpoint: POST http://localhost:${PORT}/register`);
    console.error(`MCP endpoint: http://localhost:${PORT}/mcp`);
    console.error(`Tokens stored in: ${TOKENS_FILE}`);
  });
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
