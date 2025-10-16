# MCP Sampling Server - AI Agent Instructions

## Project Overview

This is a **Model Context Protocol (MCP) server** demonstrating the **sampling** and **roots** features. The server allows MCP clients to request LLM completions (sampling) and workspace directory information (roots) to enable agentic behaviors without server-side API keys.

**Key Technology**: TypeScript, MCP SDK (`@modelcontextprotocol/sdk`), Zod for schema validation, stdio transport.

## Architecture

### Core Pattern: Sampling-Based Tools

All tools follow this pattern:
1. Receive structured input from client
2. Use `mcpServer.server.createMessage()` to request LLM completion from client
3. Parse response (often JSON) from the LLM
4. Return structured results with both `content` (text) and `structuredContent` (JSON)

**Critical**: The server does NOT call LLMs directly—it delegates to the client via sampling requests.

### Tool Registration

Tools are registered using `mcpServer.registerTool()` with three components:
- **inputSchema**: Zod schema defining expected parameters
- **outputSchema**: Zod schema defining return structure
- **Handler function**: Async function implementing the tool logic

Example structure:
```typescript
mcpServer.registerTool(
    'tool-name',
    {
        title: 'Human-readable title',
        description: 'What the tool does',
        inputSchema: { param: z.string().describe('param description') },
        outputSchema: { result: z.string() }
    },
    async ({ param }) => {
        // Tool logic with sampling
        const response = await mcpServer.server.createMessage({...});
        return { content: [...], structuredContent: {...} };
    }
);
```

## Development Workflows

### Building & Running
- **Development**: `npm run dev` (uses tsx with hot reload)
- **Production**: `npm run build` then `npm start`
- **Watch mode**: `npm run watch` (TypeScript compilation)

### Testing
- **Primary**: Use MCP Inspector: `npx @modelcontextprotocol/inspector http://localhost:3000/mcp`
- **Integration**: Configure in Claude Desktop (`claude_desktop_config.json`)
- **Logging**: Server logs to stderr to avoid interfering with stdio transport

### Entry Point
`src/index.ts` contains ALL server logic—this is a single-file implementation for clarity.

## Project-Specific Patterns

### 1. Model Preferences Pattern
When creating sampling requests, specify preferences to guide client model selection:
```typescript
modelPreferences: {
    hints: [{ name: 'claude-3-sonnet' }],  // Model suggestions
    intelligencePriority: 0.8,  // 0-1: Need for advanced capabilities
    speedPriority: 0.5,         // 0-1: Importance of low latency
    costPriority: 0.3           // 0-1: Cost sensitivity
}
```

### 2. Elicitation Pattern (Interactive Data Gathering)
Two approaches demonstrated:

**Single-step** (`create-user-profile`): Detect missing fields, request all at once via sampling
**Multi-step** (`product-review-wizard`): State machine pattern with `step` parameter for sequential flow

See `ELICITATION_EXAMPLES.md` for detailed examples.

### 3. Roots Integration Pattern
The `analyze-workspace` tool shows proper roots implementation:
- Request roots with `mcpServer.server.request({ method: 'roots/list', params: {} })`
- Handle gracefully when unsupported (try/catch)
- Combine with sampling for intelligent workspace analysis
- Store in `clientRoots` array

### 4. Error Handling Convention
All tools follow this pattern:
```typescript
try {
    // Tool logic
    return { content: [...], structuredContent: {...} };
} catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { content: [{ type: 'text', text: `Error: ${errorMessage}` }], isError: true };
}
```

### 5. Response Parsing Strategy
LLM responses often need parsing:
- **JSON responses**: Extract from markdown code blocks with regex: `/```(?:json)?\s*(\{[\s\S]*?\})\s*```/`
- **Fallback values**: Always provide defaults if parsing fails
- **Validation**: Use try/catch around JSON.parse

## Key Files

- `src/index.ts`: Complete server implementation with 7 tools
- `package.json`: Scripts, dependencies (MCP SDK 1.20.0+, Zod, Express)
- `tsconfig.json`: ES2022 target, ESNext modules, strict mode enabled
- `README.md`: User-facing documentation with protocol details
- `ELICITATION_EXAMPLES.md`: Interactive data gathering patterns
- `ROOTS_IMPLEMENTATION.md`: Workspace roots feature guide

## Critical Implementation Details

### Transport Layer
Uses `StdioServerTransport` for JSON-RPC communication:
```typescript
const transport = new StdioServerTransport();
await mcpServer.connect(transport);
```

### Logging Rules
- Use `console.error()` for logs (stderr doesn't interfere with stdio)
- Never use `console.log()` (stdout is reserved for JSON-RPC)

### Schema Validation
All tool inputs/outputs use Zod schemas:
- Enables runtime validation
- Provides type safety
- Auto-generates documentation

### State Management
- `clientRoots`: Global array storing workspace roots
- Tools are stateless except for the wizard pattern which uses parameters for state

## Common Modifications

### Adding a New Sampling Tool
1. Register with `mcpServer.registerTool('tool-name', { schemas }, handler)`
2. Define Zod schemas for input/output
3. Implement handler with `createMessage()` for sampling
4. Return both text content and structured output
5. Follow error handling convention

### Integrating New MCP Features
Follow the roots pattern:
1. Request via `mcpServer.server.request({ method: '...' })`
2. Define Zod schema for response
3. Handle gracefully when unsupported (try/catch)
4. Combine with sampling for enhanced functionality

### Adjusting Sampling Behavior
Modify these parameters in `createMessage()`:
- `maxTokens`: Control response length
- `systemPrompt`: Set LLM behavior/personality
- `modelPreferences`: Guide model selection
- `messages`: Provide context and instructions

## External Dependencies

- **@modelcontextprotocol/sdk**: Core MCP server implementation
- **zod**: Schema definition and validation
- **express**: HTTP server (currently unused, stdio only)
- **tsx**: Development-time TypeScript execution

## Testing Checklist

When modifying tools:
1. ✅ Verify tool appears in MCP Inspector
2. ✅ Test with all required parameters
3. ✅ Test with missing optional parameters
4. ✅ Check error handling with invalid input
5. ✅ Confirm both text and structured output returned
6. ✅ Validate JSON response parsing works
7. ✅ Test client approval flow for sampling requests

## Performance Considerations

- Each sampling request requires client LLM call (user-visible latency)
- Multiple sampling calls in one tool = multiple user approvals needed
- Balance intelligence (multiple calls) vs. user experience (single call)

## Security Notes

- Server trusts client to handle sampling approval/rejection
- No direct LLM API access from server (by design)
- Roots provide workspace boundaries—respect them
- User controls all LLM access via client configuration
