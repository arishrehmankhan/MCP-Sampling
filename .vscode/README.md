# VS Code MCP Configuration

This file configures the MCP server for VS Code's GitHub Copilot.

## How to Use

### For VS Code with GitHub Copilot

The `.vscode/mcp.json` file is already configured for this workspace. When you open this project in VS Code with GitHub Copilot, it should automatically detect and connect to the MCP server.

### Server Configuration

The server is configured to run with:
- **Command**: `node`
- **Args**: `${workspaceFolder}/dist/index.js`
- **Environment**: `PORT=3000`

### Testing the Connection

1. Make sure the project is built:
   ```bash
   npm run build
   ```

2. Open the project in VS Code

3. The MCP server should automatically connect when GitHub Copilot is active

### Alternative: Manual Connection

If you prefer to run the server manually for testing:

```bash
# Run in development mode
npm run dev

# Or run the built version
npm start
```

Then connect using MCP Inspector:
```bash
npx @modelcontextprotocol/inspector http://localhost:3000/mcp
```

### Available Tools

Once connected, the following tools will be available:

**Sampling Examples:**
- `summarize-text` - Summarize any text using LLM sampling
- `analyze-sentiment` - Analyze text sentiment
- `generate-story` - Generate creative stories
- `ask-question` - Answer questions with context

**Elicitation Examples:**
- `create-user-profile` - Interactive profile creation with automatic prompting for missing information
- `product-review-wizard` - Multi-step survey with conditional questions and state management

## Troubleshooting

If the MCP server doesn't connect in VS Code:

1. **Check the build**: Run `npm run build` to ensure the `dist/` folder exists
2. **Check VS Code version**: Ensure you have the latest VS Code and GitHub Copilot extension
3. **Check logs**: Look for MCP-related logs in VS Code's Output panel
4. **Restart VS Code**: Sometimes a restart helps pick up the configuration

## For Claude Desktop Users

If you want to use this with Claude Desktop instead, add this to your Claude Desktop config:

**macOS/Linux**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "sampling-demo": {
      "command": "node",
      "args": [
        "C:\\Users\\Arish Rehman Khan\\Desktop\\MCP-Sampling\\dist\\index.js"
      ]
    }
  }
}
```

Note: Use the absolute path to the `dist/index.js` file on your system.
