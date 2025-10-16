# Roots Feature Implementation Guide

This document explains how the **MCP Roots** feature is implemented in this sampling demo server.

## Overview

The roots feature allows MCP servers to request information about the workspace directories (roots) that the client has exposed. This enables workspace-aware functionality and helps servers understand the boundaries of their operations.

## Implementation Details

### 1. Root Storage

The server maintains a simple array to store roots information:

```typescript
// Store roots information (will be populated when client supports roots)
let clientRoots: Array<{ uri: string; name?: string }> = [];
```

### 2. The `analyze-workspace` Tool

This tool demonstrates the roots feature by:

#### A. Requesting Roots from the Client

```typescript
const rootsResponse = await mcpServer.server.request(
    { method: 'roots/list', params: {} },
    z.object({
        roots: z.array(z.object({
            uri: z.string(),
            name: z.string().optional()
        }))
    })
) as { roots: Array<{ uri: string; name?: string }> };

if (rootsResponse && rootsResponse.roots) {
    clientRoots = rootsResponse.roots;
}
```

**Key Points:**
- Uses the standard `roots/list` method
- Defines the expected response schema using Zod
- Handles the response gracefully

#### B. Error Handling

```typescript
try {
    const rootsResponse = await mcpServer.server.request(...);
    // Process response
} catch (rootsError) {
    // Client may not support roots
    console.error('Roots request failed:', rootsError);
}
```

**Why this matters:**
- Not all clients support the roots capability
- The server continues to work even if roots aren't available
- Provides clear feedback to users

#### C. Combining Roots with Sampling

The tool uses **both** roots and sampling features together:

1. **Requests roots** to understand the workspace
2. **Uses sampling** to analyze the workspace structure:

```typescript
const analysisPrompt = `Analyze these workspace roots and provide insights:

${rootsList}

Consider:
1. What type of project(s) these might be
2. Whether multiple related projects are present
3. Suggested best practices for organizing these workspaces
4. Any security considerations

Provide a concise analysis (3-4 sentences).`;

const response = await mcpServer.server.createMessage({
    messages: [{
        role: 'user',
        content: { type: 'text', text: analysisPrompt }
    }],
    maxTokens: 400
});
```

3. **Generates recommendations** using another sampling request
4. **Returns structured results** combining roots data and AI insights

## Usage Example

### Prerequisites

1. The client must support the `roots` capability
2. The client must have a workspace open with exposed roots

### Calling the Tool

```javascript
// Call the analyze-workspace tool
{
  "method": "tools/call",
  "params": {
    "name": "analyze-workspace",
    "arguments": {
      "analyzeStructure": true
    }
  }
}
```

### Expected Response

```json
{
  "rootsAvailable": true,
  "roots": [
    {
      "uri": "file:///home/user/projects/frontend",
      "name": "Frontend Repository"
    },
    {
      "uri": "file:///home/user/projects/backend",
      "name": "Backend Repository"
    }
  ],
  "analysis": "This appears to be a full-stack development workspace with separate frontend and backend projects. The organization suggests a microservices or API-based architecture...",
  "recommendations": [
    "Consider using a monorepo tool like Nx or Turborepo for better dependency management",
    "Ensure consistent code style across both repositories",
    "Set up shared configuration files for linting and formatting",
    "Implement CI/CD pipelines that can handle both projects",
    "Document the API contracts between frontend and backend"
  ]
}
```

## Client Capability Declaration

For roots to work, the client must declare support during initialization:

```json
{
  "capabilities": {
    "roots": {
      "listChanged": true
    }
  }
}
```

## Benefits of This Implementation

1. **🔄 Dual Feature Demonstration**: Shows how to combine roots with sampling
2. **🛡️ Graceful Degradation**: Works even if roots aren't supported
3. **🎯 Practical Use Case**: Provides real value through workspace analysis
4. **📚 Educational**: Demonstrates proper error handling and type safety
5. **🚀 Extensible**: Easy to add more roots-based functionality

## Extending the Implementation

### Adding Root Change Notifications

You can listen for changes to the roots list:

```typescript
mcpServer.server.onNotification(
    'notifications/roots/list_changed',
    async () => {
        // Refresh roots when they change
        const rootsResponse = await mcpServer.server.request(
            { method: 'roots/list', params: {} }
        );
        clientRoots = rootsResponse.roots;
        console.error('Roots updated:', clientRoots);
    }
);
```

### Creating More Roots-Aware Tools

Example ideas:

1. **File Search Tool**: Search only within root boundaries
```typescript
mcpServer.registerTool('search-in-roots', ...)
```

2. **Project Type Detector**: Analyze roots to detect project types
```typescript
mcpServer.registerTool('detect-project-type', ...)
```

3. **Security Auditor**: Check roots for security issues
```typescript
mcpServer.registerTool('audit-workspace-security', ...)
```

## Security Considerations

When implementing roots in your own server:

1. **Validate URIs**: Always validate root URIs before using them
2. **Respect Boundaries**: Never attempt to access files outside provided roots
3. **Path Traversal**: Prevent path traversal attacks
4. **User Consent**: Trust that the client has obtained proper user consent
5. **Access Controls**: Implement additional checks for sensitive operations

## Testing

### Using MCP Inspector

```bash
# Start the server
npm run dev

# In another terminal, run the inspector
npx @modelcontextprotocol/inspector http://localhost:3000/mcp
```

### Using Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "sampling-demo": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

Then try:
```
Use the analyze-workspace tool to analyze my current workspace
```

## Troubleshooting

### "No roots available" Message

**Possible causes:**
1. Client doesn't support roots capability
2. No workspace is currently open
3. Client hasn't exposed any roots

**Solution:** Use a client that supports roots (e.g., Claude Desktop) with an open workspace.

### Request Timeout

**Cause:** The roots request is taking too long

**Solution:** Check client logs and ensure the client is responding to requests.

### Invalid Response Format

**Cause:** Client returned roots in an unexpected format

**Solution:** Check the Zod schema matches the actual response structure.

## Learn More

- [MCP Roots Specification](https://modelcontextprotocol.io/specification/2025-06-18/client/roots)
- [MCP Sampling Specification](https://spec.modelcontextprotocol.io/specification/server/sampling/)
- [TypeScript SDK Documentation](https://github.com/modelcontextprotocol/typescript-sdk)

## Summary

This implementation demonstrates:
- ✅ How to request roots from MCP clients
- ✅ Proper error handling for unsupported features
- ✅ Combining multiple MCP features (roots + sampling)
- ✅ Creating practical, workspace-aware tools
- ✅ Type-safe implementation with Zod schemas

The `analyze-workspace` tool serves as a complete, production-ready example of roots feature implementation that can be adapted for your own MCP servers.
