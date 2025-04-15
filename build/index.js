import { Anthropic } from "@anthropic-ai/sdk";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import readline from "node:readline/promises";
import dotenv from "dotenv";
dotenv.config();
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set");
}
class MCPClient {
    mcp;
    anthropic;
    transport = null;
    tools = [];
    messages = [];
    constructor() {
        this.anthropic = new Anthropic({
            apiKey: ANTHROPIC_API_KEY,
        });
        this.mcp = new Client({ name: "mcp-client-cli", version: "1.0.0" });
        // システムプロンプトを最初のユーザーメッセージとして追加
        this.messages.push({
            role: "assistant",
            content: `[システムプロンプト]
あなたはユーザーの質問に対して、以下の方針で応答してください：

1. 利用可能なツールが適切な場合は、それらを活用して応答してください。
2. ツールの使用が不適切な場合は、自然な会話を心がけてください。
3. ツールの使用有無に関わらず、常に丁寧で分かりやすい説明を心がけてください。
4. ユーザーの質問の意図を正確に理解し、適切な応答を提供してください。`
        });
    }
    async connectToServer(serverScriptPath) {
        try {
            const isJs = serverScriptPath.endsWith(".js");
            const isPy = serverScriptPath.endsWith(".py");
            if (!isJs && !isPy) {
                throw new Error("Server script must be a .js or .py file");
            }
            const command = isPy
                ? process.platform === "win32"
                    ? "python"
                    : "python3"
                : process.execPath;
            this.transport = new StdioClientTransport({
                command,
                args: [serverScriptPath],
            });
            this.mcp.connect(this.transport);
            const toolsResult = await this.mcp.listTools();
            this.tools = toolsResult.tools.map((tool) => {
                return {
                    name: tool.name,
                    description: tool.description,
                    input_schema: tool.inputSchema,
                };
            });
            console.log("Connected to server with tools:", this.tools.map(({ name }) => name));
        }
        catch (e) {
            console.log("Failed to connect to MCP server: ", e);
            throw e;
        }
    }
    async processQuery(query) {
        this.messages.push({
            role: "user",
            content: query,
        });
        console.error("--------------------------------");
        console.error("Messages:");
        console.error(this.messages);
        console.error("--------------------------------");
        console.error("Tools:");
        console.error(this.tools);
        console.error("--------------------------------");
        const response = await this.anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 1000,
            messages: this.messages,
            tools: this.tools,
        });
        console.error("--------------------------------");
        console.error("Response:");
        console.error(response);
        console.error("--------------------------------");
        const finalText = [];
        const toolResults = [];
        for (const content of response.content) {
            if (content.type === "text") {
                finalText.push(content.text);
                this.messages.push({
                    role: "assistant",
                    content: content.text,
                });
            }
            else if (content.type === "tool_use") {
                const toolName = content.name;
                const toolArgs = content.input;
                console.error("--------------------------------");
                console.error("Calling tool:");
                console.error(toolName);
                console.error(toolArgs);
                console.error("--------------------------------");
                const result = await this.mcp.callTool({
                    name: toolName,
                    arguments: toolArgs,
                });
                console.error("--------------------------------");
                console.error("Tool result:");
                console.error(result);
                console.error("--------------------------------");
                toolResults.push(result);
                finalText.push(`[Calling tool ${toolName} with args ${JSON.stringify(toolArgs)}]`);
                console.error("--------------------------------");
                console.error("Tool results:");
                console.error(toolResults);
                console.error("--------------------------------");
                console.error("Final text:");
                console.error(finalText);
                console.error("--------------------------------");
                this.messages.push({
                    role: "user",
                    content: result.content,
                });
                console.error("--------------------------------");
                console.error("Messages:");
                console.error(this.messages);
                console.error("--------------------------------");
                const response = await this.anthropic.messages.create({
                    model: "claude-3-5-sonnet-20241022",
                    max_tokens: 1000,
                    messages: this.messages,
                });
                console.error("--------------------------------");
                console.error("Response:");
                console.error(response);
                console.error("--------------------------------");
                const assistantResponse = response.content[0].type === "text" ? response.content[0].text : "";
                console.error("--------------------------------");
                console.error("Assistant response:");
                console.error(assistantResponse);
                console.error("--------------------------------");
                finalText.push(assistantResponse);
                console.error("--------------------------------");
                console.error("Final text:");
                console.error(finalText);
                console.error("--------------------------------");
                this.messages.push({
                    role: "assistant",
                    content: assistantResponse,
                });
                console.error("--------------------------------");
                console.error("Messages:");
                console.error(this.messages);
                console.error("--------------------------------");
            }
        }
        return finalText.join("\n");
    }
    async chatLoop() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        try {
            console.log("\nMCP Client Started!");
            console.log("Type your queries or 'quit' to exit.");
            while (true) {
                const message = await rl.question("\nQuery: ");
                if (message.toLowerCase() === "quit") {
                    break;
                }
                const response = await this.processQuery(message);
                console.log(`\n${response}`);
            }
        }
        finally {
            rl.close();
        }
    }
    async cleanup() {
        await this.mcp.close();
    }
}
async function main() {
    if (process.argv.length < 3) {
        console.log("Usage: node index.ts <path_to_server_script>");
        return;
    }
    const mcpClient = new MCPClient();
    try {
        await mcpClient.connectToServer(process.argv[2]);
        await mcpClient.chatLoop();
    }
    finally {
        await mcpClient.cleanup();
        process.exit(0);
    }
}
main();
