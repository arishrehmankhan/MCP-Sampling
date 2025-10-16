# MCP Sampling Server

A Model Context Protocol (MCP) server that demonstrates the **sampling feature** in TypeScript. This server shows how MCP servers can request LLM completions from connected clients, enabling agentic behaviors without requiring server-side API keys.

## What is MCP Sampling?

Sampling in MCP allows servers to request LLM generations from clients. This enables:
- **Server-side intelligence** without API keys
- **Client-controlled model access** and permissions
- **Flexible model selection** based on client capabilities
- **Agentic workflows** where tools can leverage LLM capabilities

## Features

This server implements seven tools and four resources that demonstrate sampling, elicitation, roots, and resources:

### Sampling Examples
1. **📝 summarize-text**: Summarizes any text using LLM sampling
2. **💭 analyze-sentiment**: Analyzes text sentiment with confidence scores
3. **📚 generate-story**: Creates creative stories based on prompts
4. **❓ ask-question**: Answers questions with optional context

### Elicitation Examples
5. **👤 create-user-profile**: Interactive profile creation that uses sampling to gather missing information
6. **📋 product-review-wizard**: Multi-step survey with conditional questions based on user responses

### Roots Integration
7. **🗂️ analyze-workspace**: Demonstrates the roots feature by requesting workspace roots from the client and using sampling to provide intelligent analysis and recommendations

### Resources
8. **📦 server-info**: Static resource providing server metadata and capabilities
9. **📑 sample-data**: Dynamic resource with template parameters serving example data by ID
10. **📄 text-snippets**: Categorized text snippets for analysis and demonstration
11. **🔍 analyzed-texts**: Resources that combine with sampling to provide AI-enhanced data access

### Server Instructions
The server implements the **instructions feature** to provide comprehensive usage guidance to AI assistants. When connected, clients can request instructions via `instructions/list` to receive:
- Detailed tool descriptions and use cases
- Parameter specifications and examples
- Best practices for sampling, elicitation, roots, and resources
- Model selection guidance
- Error handling patterns

📖 **For implementation details, see [SERVER_INSTRUCTIONS.md](SERVER_INSTRUCTIONS.md)**

## Prerequisites

- Node.js 18 or higher
- npm or yarn package manager

## Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd MCP-Sampling
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

## Running the Server

### Development Mode (with hot reload)
```bash
npm run dev
```

### Production Mode
```bash
# Build the TypeScript code
npm run build

# Run the compiled JavaScript
npm start
```

The server will start on `http://localhost:3000/mcp`

## Testing the Server

### Using MCP Inspector

The easiest way to test your server is with the MCP Inspector:

```bash
npx @modelcontextprotocol/inspector http://localhost:3000/mcp
```

### Using Claude for Desktop

**Note:** The client must support the `sampling` capability for these tools to work.

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "sampling-demo": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

### Using Claude Code CLI

```bash
claude mcp add --transport http sampling-demo http://localhost:3000/mcp
```

## Example Usage

Once connected to a client, you can try:

### Text Summarization
```
Use the summarize-text tool to summarize this article: [paste long text]
```

### Sentiment Analysis
```
Analyze the sentiment of this review: "The product exceeded my expectations!"
```

### Story Generation
```
Generate a short story about a robot learning to paint
```

### Question Answering
```
Ask a question: What are the benefits of using the Model Context Protocol?
```

### Interactive Profile Creation (Elicitation)
```
Create a user profile
(The tool will use sampling to request missing information like name, age, occupation, and interests)
```

### Product Review Wizard (Multi-step Elicitation)
```
Start a product review
(The wizard will guide you through multiple steps: product selection, rating, feedback, and conditional follow-up questions)
```

### Workspace Analysis (Roots Feature)
```
Use the analyze-workspace tool
(The tool will request roots from the client, analyze your workspace structure, and provide intelligent recommendations)
```

### Using Resources
```
Access resources through your MCP client:
- mcp://server/info - View server information
- mcp://samples/1 - Read sample data by ID (1, 2, or 3)
- mcp://snippets/positive - Access text snippets by category
- mcp://analyzed/review1 - Get AI-analyzed text samples
```

## How Sampling Works

When a tool is called:

1. **Tool receives input** from the client (e.g., text to summarize)
2. **Server creates a sampling request** using `mcpServer.server.createMessage()`
3. **Client receives the request** and may show it to the user for approval
4. **Client executes the LLM call** using its configured model
5. **Response is sent back** to the server
6. **Server processes and returns** the result to the client

## How Elicitation Works

**Elicitation** is the process of gathering missing information from users interactively. This implementation demonstrates two approaches:

### Single-Step Elicitation (`create-user-profile`)
When required fields are missing, the tool uses sampling to request all missing information at once:
- Detects which required fields are not provided
- Uses `createMessage()` to ask the LLM to prompt the user for missing data
- Parses the response to extract the provided information
- Combines the elicited data with any originally provided values
- Uses sampling again to generate a personalized summary

### Multi-Step Elicitation (`product-review-wizard`)
Implements a guided wizard pattern with conditional questions:
- **Step-by-step flow**: Each call advances through predefined steps (start → rating → feedback → complete)
- **Conditional logic**: Low ratings trigger additional questions about improvements
- **State tracking**: The tool maintains the survey state across multiple calls
- **Sentiment analysis**: Uses sampling to analyze the final feedback

Both approaches demonstrate how MCP servers can create interactive, conversational experiences by leveraging the sampling capability.

📖 **For detailed examples and usage patterns, see [ELICITATION_EXAMPLES.md](ELICITATION_EXAMPLES.md)**

## How Resources Work

**Resources** in MCP expose data to LLMs without performing significant computation or having side effects. Unlike tools (which are model-controlled), resources are application-driven, meaning MCP clients decide how to expose them.

This server implements four types of resources:

1. **Static Resources** (`mcp://server/info`): Server metadata and configuration
2. **Dynamic Resources** (`mcp://samples/{id}`): Data served based on URI parameters
3. **Categorized Content** (`mcp://snippets/{category}`): Pre-defined text snippets
4. **AI-Enhanced Resources** (`mcp://analyzed/{textId}`): Resources that use sampling for intelligent data access

**Key capabilities:**
- 📦 Expose structured data without side effects
- 🔗 Use URI templates for dynamic content
- 🎯 Combine with sampling for AI-enhanced data
- 📝 Support multiple MIME types (JSON, text, markdown)
- 🔄 Application-controlled access patterns

📖 **For complete implementation details, see [RESOURCES_IMPLEMENTATION.md](RESOURCES_IMPLEMENTATION.md)**

## How Roots Integration Works

This server implements the **roots feature** to demonstrate workspace-aware functionality. The `analyze-workspace` tool:

1. **Requests roots** from the client using `roots/list`
2. **Handles gracefully** when roots aren't supported
3. **Combines with sampling** to analyze workspace structure
4. **Generates intelligent insights** about the workspace organization
5. **Provides recommendations** based on the workspace structure

**Key capabilities:**
- 🗂️ Discovers available workspace directories
- 🧠 Uses AI to analyze project structure
- 💡 Provides context-aware recommendations
- 🔒 Demonstrates proper security boundaries
- 🔄 Combines multiple MCP features effectively

📖 **For complete implementation details, see [ROOTS_IMPLEMENTATION.md](ROOTS_IMPLEMENTATION.md)**

### Sample Code

```typescript
const response = await mcpServer.server.createMessage({
    messages: [
        {
            role: 'user',
            content: {
                type: 'text',
                text: 'Please summarize: ' + text
            }
        }
    ],
    maxTokens: 500,
    modelPreferences: {
        hints: [{ name: 'claude-3-sonnet' }],
        intelligencePriority: 0.8,
        speedPriority: 0.5,
        costPriority: 0.3
    }
});
```

## Model Preferences

The server uses model preferences to guide client model selection:

- **hints**: Suggest specific models (e.g., `claude-3-sonnet`)
- **intelligencePriority** (0-1): How important are advanced capabilities?
- **speedPriority** (0-1): How important is low latency?
- **costPriority** (0-1): How important is minimizing cost?

Clients are free to map these preferences to their available models.

## Project Structure

```
MCP-Sampling/
├── src/
│   └── index.ts                   # Main server implementation
├── dist/                          # Compiled JavaScript (after build)
├── package.json                   # Dependencies and scripts
├── tsconfig.json                  # TypeScript configuration
├── .gitignore                     # Git ignore rules
├── README.md                      # Main documentation
├── ELICITATION_EXAMPLES.md        # Elicitation feature examples
├── ROOTS_IMPLEMENTATION.md        # Roots feature implementation guide
├── RESOURCES_IMPLEMENTATION.md    # Resources feature implementation guide
└── SERVER_INSTRUCTIONS.md         # Server instructions feature documentation
```

## Key Concepts

### Resources in MCP

**Resources** expose data to LLMs in a structured way without computation or side effects. They are fundamentally different from tools:

- **Tools** are model-controlled and can take actions
- **Resources** are application-controlled and provide read-only data

**Resource Types:**
1. **Static resources**: Fixed data like configuration or documentation
2. **Dynamic resources**: Parameterized data using URI templates
3. **AI-enhanced resources**: Combine resources with sampling for intelligent data access

**Example:**
```typescript
mcpServer.registerResource(
    'sample-data',
    new ResourceTemplate('mcp://samples/{id}', { list: undefined }),
    {
        title: 'Sample Data',
        description: 'Example data by ID'
    },
    async (uri, params) => {
        const id = Array.isArray(params.id) ? params.id[0] : params.id;
        return {
            contents: [{
                uri: uri.href,
                mimeType: 'application/json',
                text: JSON.stringify(data[id], null, 2)
            }]
        };
    }
);
```

### Security Considerations

1. **Human in the loop**: Clients SHOULD require user approval for sampling requests
2. **User control**: Users should be able to review and edit prompts
3. **Rate limiting**: Clients should implement appropriate rate limits
4. **Data handling**: Both parties must handle sensitive data appropriately

### Client Requirements

For sampling to work, clients must:
1. Declare the `sampling` capability during initialization
2. Handle `sampling/createMessage` requests
3. Implement user approval flows (recommended)
4. Return properly formatted responses

## Troubleshooting

### Server won't start
- Ensure Node.js 18+ is installed: `node --version`
- Check if port 3000 is available: `lsof -i :3000` (macOS/Linux)
- Install dependencies: `npm install`

### Tools not working
- Verify the client supports the `sampling` capability
- Check server logs for errors
- Ensure the client has model access and API keys configured

### Sampling requests fail
- The client must approve sampling requests (check client UI)
- Verify the client has LLM access configured
- Check network connectivity between client and server

## Roots in MCP

### What are Roots?

**Roots** in MCP provide a standardized way for clients to expose filesystem locations to servers. They define the boundaries of where servers can operate within the filesystem, establishing clear access controls and workspace contexts.

### Key Concepts

- **Workspace Boundaries**: Roots define which directories and files a server has access to
- **Client-Controlled**: Clients expose roots to servers, maintaining security and user control
- **Dynamic Updates**: Clients can notify servers when the list of roots changes
- **Multiple Roots**: Support for multiple project directories, repositories, or workspaces

### How Roots Work

1. **Client declares roots capability** during initialization
2. **Server requests roots** using the `roots/list` method
3. **Client returns accessible locations** (e.g., project directories)
4. **Server respects root boundaries** in all operations
5. **Client notifies of changes** when roots are added/removed

### Root Structure

Each root includes:
- **uri**: Unique identifier (must be a `file://` URI)
- **name**: Optional human-readable name for display

Example root:
```json
{
  "uri": "file:///home/user/projects/myproject",
  "name": "My Project"
}
```

### Protocol Messages

#### Listing Roots (Server → Client)
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "roots/list"
}
```

#### Response (Client → Server)
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "roots": [
      {
        "uri": "file:///home/user/projects/frontend",
        "name": "Frontend Repository"
      },
      {
        "uri": "file:///home/user/projects/backend",
        "name": "Backend Repository"
      }
    ]
  }
}
```

#### Root List Changed Notification (Client → Server)
```json
{
  "jsonrpc": "2.0",
  "method": "notifications/roots/list_changed"
}
```

### Client Capabilities

Clients supporting roots declare the capability during initialization:
```json
{
  "capabilities": {
    "roots": {
      "listChanged": true
    }
  }
}
```

`listChanged` indicates whether the client will emit notifications when roots change.

### Security Considerations

**Clients MUST:**
- Only expose roots with appropriate permissions
- Validate all root URIs to prevent path traversal attacks
- Implement proper access controls
- Prompt users for consent before exposing roots
- Monitor root accessibility

**Servers SHOULD:**
- Check for roots capability before requesting
- Handle cases where roots become unavailable
- Respect root boundaries during all operations
- Validate all paths against provided roots
- Handle root list changes gracefully

### Use Cases

1. **Project Workspaces**: Expose project directories to enable context-aware operations
2. **Multi-Repository Development**: Work across multiple related repositories
3. **Sandboxed Operations**: Limit server access to specific directories
4. **Version Control Integration**: Automatically detect and expose VCS roots
5. **Monorepo Support**: Expose multiple packages within a monorepo structure

### Implementation in This Server

This server implements roots functionality in the **`analyze-workspace`** tool, which demonstrates:

1. **Requesting roots from the client:**
```typescript
const rootsResponse = await mcpServer.server.request(
    { method: 'roots/list', params: {} },
    z.object({
        roots: z.array(z.object({
            uri: z.string(),
            name: z.string().optional()
        }))
    })
);
```

2. **Storing and using roots information:**
```typescript
if (rootsResponse && rootsResponse.roots) {
    clientRoots = rootsResponse.roots;
}
```

3. **Combining roots with sampling:**
   - The tool requests workspace roots from the client
   - Uses LLM sampling to analyze the workspace structure
   - Generates intelligent recommendations based on the roots
   - Provides context-aware insights about the workspace

4. **Graceful handling when roots aren't supported:**
```typescript
if (clientRoots.length === 0) {
    return {
        content: [{
            type: 'text',
            text: 'No roots available. The client may not support the roots capability.'
        }]
    };
}
```

This demonstrates how servers can combine multiple MCP features (roots + sampling) to provide sophisticated, context-aware functionality.

### Benefits of Using Roots

- 🔒 **Enhanced Security**: Clear boundaries for server operations
- 🎯 **Context Awareness**: Servers understand their workspace context
- 🔄 **Dynamic Updates**: Adapt to changing project structures
- 👥 **User Control**: Users explicitly grant filesystem access
- 🏗️ **Multi-Project Support**: Work across multiple projects simultaneously

## Learn More

- [MCP Documentation](https://modelcontextprotocol.io/)
- [MCP Specification - Sampling](https://spec.modelcontextprotocol.io/specification/server/sampling/)
- [MCP Specification - Resources](https://modelcontextprotocol.io/specification/latest/server/resources)
- [MCP Specification - Roots](https://modelcontextprotocol.io/specification/2025-06-18/client/roots)
- [TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Example Servers](https://github.com/modelcontextprotocol/servers)

## License

MIT License - See LICENSE file for details

## Contributing

Contributions are welcome! This is a demonstration project to help developers understand MCP sampling.

---

**Built with ❤️ using the Model Context Protocol**
