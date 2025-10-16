# Resources Implementation Guide

This document explains how this MCP server implements the **resources feature** and demonstrates different resource patterns.

## What are Resources?

**Resources** in MCP expose data to LLMs without performing significant computation or having side effects. They are designed to be used in an application-driven way, meaning MCP client applications can decide how to expose them (e.g., through a resource picker UI or directly to the model).

### Resources vs. Tools

| Feature | Resources | Tools |
|---------|-----------|-------|
| **Purpose** | Expose data | Take actions |
| **Computation** | Minimal/none | Can be significant |
| **Side Effects** | None | Allowed |
| **Control** | Application-driven | Model-driven |
| **Use Case** | Reading data | Writing/modifying data |

## Implementation Patterns

This server demonstrates four resource patterns:

### 1. Static Resource (`server-info`)

**URI:** `mcp://server/info`

A simple static resource that provides information about the server itself.

```typescript
mcpServer.registerResource(
    'server-info',
    'mcp://server/info',
    {
        title: 'Server Information',
        description: 'Information about this MCP sampling server',
        mimeType: 'application/json'
    },
    async (uri) => ({
        contents: [
            {
                uri: uri.href,
                mimeType: 'application/json',
                text: JSON.stringify({
                    name: 'MCP Sampling Demo Server',
                    version: '1.0.0',
                    capabilities: ['sampling', 'tools', 'resources', 'roots']
                }, null, 2)
            }
        ]
    })
);
```

**Use Cases:**
- Server metadata
- Configuration information
- Static documentation
- API specifications

### 2. Dynamic Resource with Parameters (`sample-data`)

**URI Template:** `mcp://samples/{id}`

A resource that uses URI template parameters to serve different data based on the ID.

```typescript
mcpServer.registerResource(
    'sample-data',
    new ResourceTemplate('mcp://samples/{id}', { list: undefined }),
    {
        title: 'Sample Data',
        description: 'Example data resources indexed by ID'
    },
    async (uri, params) => {
        const id = Array.isArray(params.id) ? params.id[0] : params.id;
        const sample = samples[id]; // Lookup by ID
        
        return {
            contents: [{
                uri: uri.href,
                mimeType: 'application/json',
                text: JSON.stringify(sample, null, 2)
            }]
        };
    }
);
```

**Available IDs:** `1`, `2`, `3`

**Use Cases:**
- Database records
- File contents by path
- User profiles by ID
- Product catalogs

### 3. Categorized Content (`text-snippets`)

**URI Template:** `mcp://snippets/{category}`

Pre-defined text content organized by category, useful for demonstrations and testing.

**Available Categories:**
- `positive` - Positive product review
- `negative` - Negative product review
- `technical` - Technical documentation
- `story` - Creative story prompt

**Use Cases:**
- Example datasets
- Template libraries
- Documentation sections
- Code snippets by language

### 4. Resources + Sampling Integration (`analyzed-texts`)

**URI Template:** `mcp://analyzed/{textId}`

A sophisticated pattern that combines resources with the sampling feature. When accessed, this resource uses LLM sampling to analyze text on-demand.

```typescript
mcpServer.registerResource(
    'analyzed-texts',
    new ResourceTemplate('mcp://analyzed/{textId}', { list: undefined }),
    {
        title: 'Pre-Analyzed Texts',
        description: 'Text samples analyzed using sampling'
    },
    async (uri, params) => {
        const textId = Array.isArray(params.textId) ? params.textId[0] : params.textId;
        const text = texts[textId];
        
        // Use sampling to analyze
        const analysisResponse = await mcpServer.server.createMessage({
            messages: [{
                role: 'user',
                content: {
                    type: 'text',
                    text: `Analyze this text: "${text}"`
                }
            }],
            maxTokens: 200
        });
        
        return {
            contents: [{
                uri: uri.href,
                mimeType: 'application/json',
                text: JSON.stringify({ text, analysis }, null, 2)
            }]
        };
    }
);
```

**Available Text IDs:** `review1`, `review2`, `quote1`, `quote2`

**Use Cases:**
- AI-enhanced data access
- Dynamic content generation
- Intelligent search results
- Context-aware information retrieval

## Protocol Details

### Registering Resources

Resources are registered using `mcpServer.registerResource()`:

```typescript
mcpServer.registerResource(
    resourceName,        // Unique identifier
    uriOrTemplate,       // Static URI or ResourceTemplate
    metadata,            // Title, description, mimeType
    handler             // Async function returning contents
);
```

### Resource Templates

Templates use URI parameters in curly braces:

```typescript
new ResourceTemplate('scheme://path/{param1}/{param2}', {
    list: undefined,     // Optional: function to list all instances
    complete: {          // Optional: auto-completion support
        param1: (value) => ['suggestion1', 'suggestion2']
    }
})
```

### Response Format

Resource handlers return:

```typescript
{
    contents: [
        {
            uri: string,              // Resource URI
            mimeType?: string,        // Content type
            text?: string,            // Text content
            blob?: string,            // Base64 encoded binary
            description?: string      // Human-readable description
        }
    ]
}
```

## Client Interaction

### Listing Resources

Clients can discover available resources:

```json
{
  "jsonrpc": "2.0",
  "method": "resources/list",
  "id": 1
}
```

### Reading Resources

Clients request specific resources by URI:

```json
{
  "jsonrpc": "2.0",
  "method": "resources/read",
  "params": {
    "uri": "mcp://samples/1"
  },
  "id": 2
}
```

### Resource Updates

Servers can notify clients when resources change:

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/resources/updated",
  "params": {
    "uri": "mcp://server/info"
  }
}
```

## Best Practices

### 1. Use Appropriate MIME Types

Specify the correct `mimeType` to help clients render content:
- `application/json` for structured data
- `text/plain` for plain text
- `text/markdown` for Markdown
- `text/html` for HTML
- `image/png`, `image/jpeg` for images (use `blob` field)

### 2. Keep Resources Lightweight

Resources should return data quickly without heavy computation:
- ✅ Reading from cache
- ✅ Returning pre-computed data
- ✅ Simple data transformations
- ❌ Long-running computations
- ❌ External API calls with high latency
- ❌ Complex aggregations

**Exception:** Resources can use sampling (as in `analyzed-texts`) because the computation happens on the client side via the LLM.

### 3. Handle Missing Resources Gracefully

Always check if the requested resource exists:

```typescript
if (!data) {
    return {
        contents: [{
            uri: uri.href,
            mimeType: 'text/plain',
            text: `Resource not found. Available IDs: ${availableIds.join(', ')}`
        }]
    };
}
```

### 4. Use Descriptive URIs

Choose URI schemes that clearly indicate the resource type:
- `config://` for configuration
- `data://` for datasets
- `file://` for filesystem resources
- `mcp://` for MCP-specific resources

### 5. Provide Helpful Metadata

Use clear titles and descriptions:

```typescript
{
    title: 'User Profile',                    // Short, clear name
    description: 'User profile information',  // Detailed explanation
    mimeType: 'application/json'             // Content type
}
```

## Security Considerations

### Read-Only Access

Resources should NEVER modify state:
- ✅ Reading configuration
- ✅ Returning cached data
- ✅ Listing directory contents
- ❌ Modifying files
- ❌ Deleting records
- ❌ Triggering side effects

### Access Control

Consider implementing access control:
- Validate resource URIs
- Check permissions before returning data
- Sanitize user-provided parameters
- Prevent directory traversal attacks

### Sensitive Data

Be cautious with sensitive information:
- Don't expose credentials in resources
- Consider what data LLMs should access
- Implement appropriate filtering
- Log access to sensitive resources

## Combining Features

This server demonstrates how resources work with other MCP features:

### Resources + Sampling

The `analyzed-texts` resource uses sampling to provide AI-enhanced data:
1. Client requests resource
2. Server uses sampling to analyze content
3. Client's LLM performs the analysis
4. Server returns analyzed result

### Resources + Tools

Tools can return `resource_link` objects:

```typescript
return {
    content: [
        {
            type: 'resource_link',
            uri: 'mcp://samples/1',
            name: 'Sample Data',
            description: 'Introduction to MCP'
        }
    ]
};
```

This allows tools to reference resources without embedding their full content.

### Resources + Roots

Resources can respect workspace boundaries:
- Use roots to determine accessible paths
- Only expose resources within allowed directories
- Filter resource lists based on roots

## Testing Resources

### Using MCP Inspector

```bash
npx @modelcontextprotocol/inspector http://localhost:3000/mcp
```

Then:
1. Navigate to the "Resources" tab
2. Browse available resources
3. Click on a resource to view its contents
4. Test dynamic resources with different parameters

### Using Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "sampling-demo": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

Resources will appear in the resources picker UI.

## Examples

### Reading Server Info

```bash
# Using MCP Inspector or client
GET mcp://server/info
```

Returns:
```json
{
  "name": "MCP Sampling Demo Server",
  "version": "1.0.0",
  "capabilities": ["sampling", "tools", "resources", "roots"]
}
```

### Reading Sample Data

```bash
GET mcp://samples/2
```

Returns:
```json
{
  "id": "2",
  "title": "Sampling Feature",
  "content": "Sampling allows MCP servers to request LLM completions...",
  "category": "feature",
  "tags": ["sampling", "llm", "api"]
}
```

### Reading Text Snippets

```bash
GET mcp://snippets/positive
```

Returns:
```markdown
# Positive Review

This product absolutely exceeded my expectations! The quality is outstanding...
```

### Reading Analyzed Texts

```bash
GET mcp://analyzed/review1
```

Returns (with sampling):
```json
{
  "textId": "review1",
  "originalText": "The restaurant had amazing ambiance...",
  "analysis": "Sentiment: positive\nKey themes: dining experience, ambiance...",
  "analyzedAt": "2025-10-16T16:30:00.000Z"
}
```

## Learn More

- [MCP Specification - Resources](https://modelcontextprotocol.io/specification/latest/server/resources)
- [TypeScript SDK Documentation](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Resources Examples](https://github.com/modelcontextprotocol/servers)

---

**Built with ❤️ using the Model Context Protocol**
