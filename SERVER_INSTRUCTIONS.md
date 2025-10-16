# Server Instructions Feature

## Overview

The **Server Instructions** feature in MCP allows servers to provide context and guidance to AI assistants about how to effectively use that server. This implementation adds the `instructions/list` protocol handler to expose comprehensive usage documentation.

## What It Does

When an MCP client (like Claude Desktop or other AI assistants) connects to this server, it can request instructions via:

```
{ method: 'instructions/list' }
```

The server responds with a detailed guide that includes:

- **Tool descriptions**: What each tool does and when to use it
- **Parameters**: Required and optional parameters for each tool
- **Usage patterns**: Best practices and common workflows
- **Key concepts**: Explanation of sampling, elicitation, and roots
- **Model selection**: Guidance on which models work best for different tasks

## Implementation Details

### Code Structure

```typescript
// Define the instructions content
const SERVER_INSTRUCTIONS = `...comprehensive guide...`;

// Register the handler
mcpServer.server.setRequestHandler(
    z.object({ method: z.literal('instructions/list') }),
    async () => {
        return {
            instructions: [
                {
                    description: 'Comprehensive usage guide for the MCP Sampling Server',
                    text: SERVER_INSTRUCTIONS
                }
            ]
        };
    }
);
```

### Response Format

The handler returns an object with an `instructions` array containing:
- **description**: Brief summary of the instruction content
- **text**: Full markdown-formatted guidance text

## Benefits

1. **Self-documenting**: AI assistants automatically understand server capabilities
2. **Consistency**: All clients receive the same authoritative guidance
3. **Discoverability**: New tools and patterns are automatically explained
4. **Context-aware**: Instructions are always available when the server is active
5. **No external docs needed**: Guidance travels with the server

## Usage

### For MCP Clients

When supporting the instructions protocol, clients should:
1. Request instructions after connecting: `await server.request({ method: 'instructions/list' })`
2. Include the instructions in the AI assistant's context
3. Use the guidance to make better tool selection decisions

### For AI Assistants

The instructions provide:
- When to use each tool (task-specific guidance)
- How tools work together (multi-step workflows)
- Common patterns (elicitation, sampling, roots)
- Error handling approaches
- Model preferences for different operations

### Testing

You can test the instructions feature using MCP Inspector:

```bash
npx @modelcontextprotocol/inspector http://localhost:3000/mcp
```

In the inspector, you should see:
1. The server capabilities include instructions support
2. You can manually call the `instructions/list` method
3. The response contains the full usage guide

## Content Included

The current instructions cover:

### Tool Catalog
- **summarize-text**: Text summarization with length control
- **analyze-sentiment**: Sentiment analysis with confidence scores
- **generate-story**: Creative writing generation
- **ask-question**: General Q&A with context support
- **create-user-profile**: Interactive profile creation with elicitation
- **product-review-wizard**: Multi-step survey with conditional logic
- **analyze-workspace**: Workspace analysis using roots protocol

### Conceptual Guides
- **Sampling Pattern**: How LLM delegation works
- **Elicitation Pattern**: Interactive data gathering techniques
- **Roots Integration**: Workspace-aware functionality
- **Model Selection**: Intelligence/speed/cost trade-offs

### Best Practices
- Tool selection strategies
- Multi-step workflow design
- Error handling patterns
- Testing approaches

## Updating Instructions

To update the instructions content:

1. Edit the `SERVER_INSTRUCTIONS` constant in `src/index.ts`
2. Keep it in Markdown format for readability
3. Include practical examples and use cases
4. Update when adding new tools or capabilities
5. Rebuild the server: `npm run build`

## Protocol Compliance

This implementation follows the MCP specification for server instructions:

- Uses the standard `instructions/list` method
- Returns properly formatted instruction objects
- Provides both description and full text
- Works with all MCP-compliant clients

## Integration with Other Features

The instructions reference and complement:
- **Sampling**: Explains how LLM delegation works
- **Roots**: Documents workspace awareness
- **Tools**: Provides usage guide for each tool
- **Elicitation**: Describes interactive patterns

## Future Enhancements

Potential improvements:
- Multiple instruction sets for different use cases
- Versioned instructions matching server version
- Tool-specific instruction deep-dives
- Interactive examples or tutorials
- Language-specific variations
