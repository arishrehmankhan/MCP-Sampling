import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// Create an MCP server with sampling capabilities
const mcpServer = new McpServer({
    name: 'sampling-demo-server',
    version: '1.0.0'
});

// Store roots information (will be populated when client supports roots)
let clientRoots: Array<{ uri: string; name?: string }> = [];

/**
 * Tool that uses sampling to summarize text
 * This demonstrates the sampling feature where the server requests
 * LLM completions from the connected client
 */
mcpServer.registerTool(
    'summarize-text',
    {
        title: 'Text Summarizer',
        description: 'Summarize any text using LLM sampling. The server requests the client to use an LLM to create a concise summary.',
        inputSchema: {
            text: z.string().describe('The text to summarize'),
            maxLength: z.number().optional().describe('Maximum length of summary in words (optional)')
        },
        outputSchema: {
            summary: z.string(),
            originalLength: z.number(),
            summaryLength: z.number()
        }
    },
    async ({ text, maxLength }) => {
        try {
            // Use MCP sampling to request an LLM completion from the client
            const response = await mcpServer.server.createMessage({
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: `Please provide a concise summary of the following text${maxLength ? ` in approximately ${maxLength} words` : ''}:\n\n${text}`
                        }
                    }
                ],
                maxTokens: 500,
                modelPreferences: {
                    hints: [
                        { name: 'claude-3-sonnet' }
                    ],
                    intelligencePriority: 0.8,
                    speedPriority: 0.5,
                    costPriority: 0.3
                }
            });

            const summary = response.content.type === 'text' 
                ? response.content.text 
                : 'Unable to generate summary';

            const originalLength = text.split(/\s+/).length;
            const summaryLength = summary.split(/\s+/).length;

            const output = {
                summary,
                originalLength,
                summaryLength
            };

            return {
                content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
                structuredContent: output
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                content: [{ type: 'text', text: `Error: ${errorMessage}` }],
                isError: true
            };
        }
    }
);

/**
 * Tool that uses sampling to analyze sentiment
 */
mcpServer.registerTool(
    'analyze-sentiment',
    {
        title: 'Sentiment Analyzer',
        description: 'Analyze the sentiment of text using LLM sampling',
        inputSchema: {
            text: z.string().describe('The text to analyze')
        },
        outputSchema: {
            sentiment: z.enum(['positive', 'negative', 'neutral', 'mixed']),
            confidence: z.number(),
            explanation: z.string()
        }
    },
    async ({ text }) => {
        try {
            const response = await mcpServer.server.createMessage({
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: `Analyze the sentiment of this text and respond in JSON format with: sentiment (positive/negative/neutral/mixed), confidence (0-1), and explanation.\n\nText: ${text}`
                        }
                    }
                ],
                maxTokens: 300,
                modelPreferences: {
                    intelligencePriority: 0.7,
                    speedPriority: 0.8
                }
            });

            const result = response.content.type === 'text' 
                ? response.content.text 
                : '{"sentiment": "neutral", "confidence": 0, "explanation": "Unable to analyze"}';

            // Try to parse JSON response
            let output;
            try {
                output = JSON.parse(result);
            } catch {
                // If not valid JSON, create a structured response
                output = {
                    sentiment: 'neutral',
                    confidence: 0.5,
                    explanation: result
                };
            }

            return {
                content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
                structuredContent: output
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                content: [{ type: 'text', text: `Error: ${errorMessage}` }],
                isError: true
            };
        }
    }
);

/**
 * Tool that uses sampling for creative writing
 */
mcpServer.registerTool(
    'generate-story',
    {
        title: 'Story Generator',
        description: 'Generate a creative story based on a prompt using LLM sampling',
        inputSchema: {
            prompt: z.string().describe('The story prompt or theme'),
            length: z.enum(['short', 'medium', 'long']).optional().describe('Story length')
        },
        outputSchema: {
            story: z.string(),
            wordCount: z.number()
        }
    },
    async ({ prompt, length = 'medium' }) => {
        const lengthInstructions = {
            short: 'Write a short story (100-200 words)',
            medium: 'Write a medium-length story (300-500 words)',
            long: 'Write a longer story (600-800 words)'
        };

        try {
            const response = await mcpServer.server.createMessage({
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: `${lengthInstructions[length]} based on this prompt: ${prompt}`
                        }
                    }
                ],
                maxTokens: 1000,
                systemPrompt: 'You are a creative writer who crafts engaging, well-structured stories.',
                modelPreferences: {
                    hints: [
                        { name: 'claude-3' }
                    ],
                    intelligencePriority: 0.9,
                    speedPriority: 0.4
                }
            });

            const story = response.content.type === 'text' 
                ? response.content.text 
                : 'Unable to generate story';

            const wordCount = story.split(/\s+/).length;

            const output = {
                story,
                wordCount
            };

            return {
                content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
                structuredContent: output
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                content: [{ type: 'text', text: `Error: ${errorMessage}` }],
                isError: true
            };
        }
    }
);

/**
 * Tool that demonstrates multi-turn sampling conversation
 */
mcpServer.registerTool(
    'ask-question',
    {
        title: 'Question Answerer',
        description: 'Ask a question and get an answer using LLM sampling',
        inputSchema: {
            question: z.string().describe('Your question'),
            context: z.string().optional().describe('Additional context for the question')
        },
        outputSchema: {
            answer: z.string(),
            model: z.string()
        }
    },
    async ({ question, context }) => {
        try {
            const messageText = context 
                ? `Context: ${context}\n\nQuestion: ${question}`
                : question;

            const response = await mcpServer.server.createMessage({
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: messageText
                        }
                    }
                ],
                maxTokens: 500,
                modelPreferences: {
                    intelligencePriority: 0.8,
                    speedPriority: 0.6,
                    costPriority: 0.4
                }
            });

            const answer = response.content.type === 'text' 
                ? response.content.text 
                : 'Unable to generate answer';

            const output = {
                answer,
                model: response.model || 'unknown'
            };

            return {
                content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
                structuredContent: output
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                content: [{ type: 'text', text: `Error: ${errorMessage}` }],
                isError: true
            };
        }
    }
);

/**
 * Tool that demonstrates elicitation - using sampling to gather missing information
 * This simulates an interactive form by using LLM sampling to request user input
 * when required fields are missing.
 */
mcpServer.registerTool(
    'create-user-profile',
    {
        title: 'Interactive User Profile Creator',
        description: 'Create a user profile by using sampling to elicit missing information from the user',
        inputSchema: {
            name: z.string().optional().describe('User\'s name (will prompt if not provided)'),
            age: z.number().optional().describe('User\'s age (will prompt if not provided)'),
            occupation: z.string().optional().describe('User\'s occupation (will prompt if not provided)'),
            interests: z.string().optional().describe('User\'s interests, comma-separated (will prompt if not provided)')
        },
        outputSchema: {
            profile: z.object({
                name: z.string(),
                age: z.number(),
                occupation: z.string(),
                interests: z.array(z.string()),
                summary: z.string()
            }),
            missingFields: z.array(z.string())
        }
    },
    async ({ name, age, occupation, interests }) => {
        try {
            const missingFields: string[] = [];
            
            // Check for missing required fields and use sampling to request them
            if (!name || !age || !occupation || !interests) {
                const missing: string[] = [];
                if (!name) missing.push('name');
                if (!age) missing.push('age');
                if (!occupation) missing.push('occupation');
                if (!interests) missing.push('interests');
                
                // Use sampling to ask the user to provide missing information
                const promptText = `You're creating a user profile, but some information is missing. Please provide the following:

${missing.map(field => {
    switch(field) {
        case 'name': return '- Your full name';
        case 'age': return '- Your age (just the number)';
        case 'occupation': return '- Your occupation or job title';
        case 'interests': return '- Your interests or hobbies (comma-separated)';
        default: return `- ${field}`;
    }
}).join('\n')}

Please respond in JSON format like this:
{
  ${missing.map(field => `"${field}": "your ${field} here"`).join(',\n  ')}
}`;

                const response = await mcpServer.server.createMessage({
                    messages: [
                        {
                            role: 'user',
                            content: {
                                type: 'text',
                                text: promptText
                            }
                        }
                    ],
                    maxTokens: 300,
                    modelPreferences: {
                        intelligencePriority: 0.5,
                        speedPriority: 0.9
                    }
                });

                // Parse the response
                const responseText = response.content.type === 'text' 
                    ? response.content.text 
                    : '{}';

                try {
                    // Extract JSON from markdown code blocks if present
                    let jsonText = responseText;
                    const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
                    if (jsonMatch) {
                        jsonText = jsonMatch[1];
                    }
                    
                    const providedData = JSON.parse(jsonText);
                    
                    if (!name && providedData.name) {
                        name = String(providedData.name);
                        missingFields.push('name');
                    }
                    if (!age && providedData.age) {
                        age = Number(providedData.age);
                        missingFields.push('age');
                    }
                    if (!occupation && providedData.occupation) {
                        occupation = String(providedData.occupation);
                        missingFields.push('occupation');
                    }
                    if (!interests && providedData.interests) {
                        interests = String(providedData.interests);
                        missingFields.push('interests');
                    }
                } catch (parseError) {
                    // If parsing fails, return error with instructions
                    return {
                        content: [{
                            type: 'text',
                            text: `Unable to parse response. Please call this tool again with the required fields: ${missing.join(', ')}`
                        }],
                        isError: true
                    };
                }
            }

            // Validate we have all required fields
            if (!name || !age || !occupation || !interests) {
                const stillMissing = [];
                if (!name) stillMissing.push('name');
                if (!age) stillMissing.push('age');
                if (!occupation) stillMissing.push('occupation');
                if (!interests) stillMissing.push('interests');
                
                return {
                    content: [{
                        type: 'text',
                        text: `Still missing required fields: ${stillMissing.join(', ')}. Please provide them.`
                    }],
                    isError: true
                };
            }

            // Parse interests into an array
            const interestsArray = interests.split(',').map(i => i.trim()).filter(i => i.length > 0);

            // Use sampling to generate a personalized summary
            const summaryResponse = await mcpServer.server.createMessage({
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: `Create a brief, engaging profile summary (2-3 sentences) for a person with the following details:\nName: ${name}\nAge: ${age}\nOccupation: ${occupation}\nInterests: ${interestsArray.join(', ')}`
                        }
                    }
                ],
                maxTokens: 200,
                systemPrompt: 'You are a professional profile writer who creates engaging, concise summaries.',
                modelPreferences: {
                    intelligencePriority: 0.7,
                    speedPriority: 0.7
                }
            });

            const summary = summaryResponse.content.type === 'text' 
                ? summaryResponse.content.text 
                : `${name} is a ${age}-year-old ${occupation} who enjoys ${interestsArray.slice(0, 2).join(' and ')}.`;

            const output = {
                profile: {
                    name,
                    age,
                    occupation,
                    interests: interestsArray,
                    summary
                },
                missingFields
            };

            return {
                content: [
                    { 
                        type: 'text', 
                        text: `✅ Profile created successfully!\n\n${JSON.stringify(output.profile, null, 2)}\n\n${missingFields.length > 0 ? `Fields elicited through sampling: ${missingFields.join(', ')}` : 'All fields were provided directly.'}`
                    }
                ],
                structuredContent: output
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                content: [{ type: 'text', text: `Error: ${errorMessage}` }],
                isError: true
            };
        }
    }
);

/**
 * Tool that demonstrates conditional elicitation - gathering additional info based on responses
 * This uses sampling to conduct an interactive product review survey
 */
mcpServer.registerTool(
    'product-review-wizard',
    {
        title: 'Product Review Wizard',
        description: 'An interactive product review tool that uses sampling to guide users through a survey with conditional questions',
        inputSchema: {
            step: z.enum(['start', 'rating', 'feedback', 'complete']).optional().describe('Current step in the survey'),
            productName: z.string().optional().describe('Name of the product being reviewed'),
            rating: z.number().optional().describe('Rating from 1-5'),
            comments: z.string().optional().describe('User comments about the product'),
            improvements: z.string().optional().describe('Suggested improvements (for low ratings)')
        },
        outputSchema: {
            currentStep: z.string(),
            nextPrompt: z.string().optional(),
            review: z.object({
                productName: z.string().optional(),
                rating: z.number().optional(),
                comments: z.string().optional(),
                improvements: z.string().optional(),
                sentiment: z.string().optional(),
                isComplete: z.boolean()
            })
        }
    },
    async ({ step = 'start', productName, rating, comments, improvements }) => {
        try {
            // Multi-step survey flow with conditional logic
            switch (step) {
                case 'start':
                    if (!productName) {
                        return {
                            content: [{
                                type: 'text',
                                text: '📝 Welcome to the Product Review Wizard!\n\nTo get started, please tell me: Which product would you like to review?'
                            }],
                            structuredContent: {
                                currentStep: 'start',
                                nextPrompt: 'Please provide the product name',
                                review: { isComplete: false }
                            }
                        };
                    }
                    // Has product name, move to rating
                    return {
                        content: [{
                            type: 'text',
                            text: `Great! You're reviewing "${productName}".\n\nNext, please rate it from 1 (poor) to 5 (excellent). Call this tool again with step='rating' and your rating.`
                        }],
                        structuredContent: {
                            currentStep: 'rating',
                            nextPrompt: 'Please provide a rating (1-5)',
                            review: { productName, isComplete: false }
                        }
                    };

                case 'rating':
                    if (!productName || rating === undefined) {
                        return {
                            content: [{
                                type: 'text',
                                text: 'Please provide both productName and rating (1-5)'
                            }],
                            structuredContent: {
                                currentStep: 'rating',
                                review: { isComplete: false }
                            },
                            isError: true
                        };
                    }

                    if (rating < 1 || rating > 5) {
                        return {
                            content: [{
                                type: 'text',
                                text: 'Rating must be between 1 and 5'
                            }],
                            isError: true
                        };
                    }

                    const ratingEmoji = rating >= 4 ? '⭐' : rating >= 3 ? '👍' : '😕';
                    return {
                        content: [{
                            type: 'text',
                            text: `${ratingEmoji} You rated "${productName}" ${rating}/5.\n\nNow, please share your thoughts: What did you like or dislike about the product?\n\nCall this tool with step='feedback' and your comments.`
                        }],
                        structuredContent: {
                            currentStep: 'feedback',
                            nextPrompt: 'Please provide your comments',
                            review: { productName, rating, isComplete: false }
                        }
                    };

                case 'feedback':
                    if (!productName || rating === undefined || !comments) {
                        return {
                            content: [{
                                type: 'text',
                                text: 'Please provide productName, rating, and comments'
                            }],
                            isError: true
                        };
                    }

                    // Conditional: ask for improvements only if rating is low
                    if (rating <= 3 && !improvements) {
                        return {
                            content: [{
                                type: 'text',
                                text: `Thank you for your feedback. Since you gave a rating of ${rating}/5, we'd love to know:\n\nWhat specific improvements would you suggest?\n\nCall this tool with step='complete' and your improvement suggestions.`
                            }],
                            structuredContent: {
                                currentStep: 'feedback',
                                nextPrompt: 'Please suggest improvements',
                                review: { productName, rating, comments, isComplete: false }
                            }
                        };
                    }

                    // Fall through to complete
                    step = 'complete';
                    // eslint-disable-next-line no-fallthrough

                case 'complete':
                    if (!productName || rating === undefined || !comments) {
                        return {
                            content: [{
                                type: 'text',
                                text: 'Missing required fields for completion'
                            }],
                            isError: true
                        };
                    }

                    // Use sampling to analyze sentiment
                    const sentimentResponse = await mcpServer.server.createMessage({
                        messages: [
                            {
                                role: 'user',
                                content: {
                                    type: 'text',
                                    text: `Analyze the sentiment of this review and respond with just one word (positive, negative, or neutral): "${comments}"`
                                }
                            }
                        ],
                        maxTokens: 20,
                        modelPreferences: {
                            speedPriority: 0.9
                        }
                    });

                    const sentiment = sentimentResponse.content.type === 'text' 
                        ? sentimentResponse.content.text.trim().toLowerCase().replace(/[^a-z]/g, '')
                        : 'neutral';

                    const review = {
                        productName,
                        rating,
                        comments,
                        ...(improvements && { improvements }),
                        sentiment,
                        isComplete: true
                    };

                    return {
                        content: [{
                            type: 'text',
                            text: `✅ Thank you for your review!\n\n📊 Review Summary:\n${JSON.stringify(review, null, 2)}\n\nYour feedback has been recorded with a ${sentiment} sentiment.`
                        }],
                        structuredContent: {
                            currentStep: 'complete',
                            review
                        }
                    };

                default:
                    return {
                        content: [{
                            type: 'text',
                            text: 'Invalid step. Please use: start, rating, feedback, or complete'
                        }],
                        isError: true
                    };
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                content: [{ type: 'text', text: `Error: ${errorMessage}` }],
                isError: true
            };
        }
    }
);

/**
 * Tool that demonstrates using roots to provide workspace-aware functionality
 * This tool requests roots from the client and uses sampling to analyze them
 */
mcpServer.registerTool(
    'analyze-workspace',
    {
        title: 'Workspace Analyzer',
        description: 'Analyze the workspace roots using MCP roots feature and provide insights',
        inputSchema: {
            analyzeStructure: z.boolean().optional().describe('Whether to analyze the directory structure (default: true)')
        },
        outputSchema: {
            rootsAvailable: z.boolean(),
            roots: z.array(z.object({
                uri: z.string(),
                name: z.string().optional()
            })),
            analysis: z.string(),
            recommendations: z.array(z.string()).optional()
        }
    },
    async ({ analyzeStructure = true }) => {
        try {
            // Request roots from the client
            try {
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
            } catch (rootsError) {
                // Client may not support roots
                console.error('Roots request failed:', rootsError);
            }

            if (clientRoots.length === 0) {
                return {
                    content: [{
                        type: 'text',
                        text: '⚠️ No roots available. The client may not support the roots capability, or no workspace is currently open.\n\nRoots allow servers to understand which directories they have access to.'
                    }],
                    structuredContent: {
                        rootsAvailable: false,
                        roots: [],
                        analysis: 'No roots available from client'
                    }
                };
            }

            // Format roots information
            const rootsList = clientRoots.map(root => 
                `• ${root.name || 'Unnamed'}: ${root.uri}`
            ).join('\n');

            let analysis = '';
            let recommendations: string[] = [];

            if (analyzeStructure) {
                // Use sampling to analyze the workspace structure
                const analysisPrompt = `Analyze these workspace roots and provide insights:

${rootsList}

Consider:
1. What type of project(s) these might be
2. Whether multiple related projects are present
3. Suggested best practices for organizing these workspaces
4. Any security considerations

Provide a concise analysis (3-4 sentences).`;

                const response = await mcpServer.server.createMessage({
                    messages: [
                        {
                            role: 'user',
                            content: {
                                type: 'text',
                                text: analysisPrompt
                            }
                        }
                    ],
                    maxTokens: 400,
                    modelPreferences: {
                        intelligencePriority: 0.7,
                        speedPriority: 0.6
                    }
                });

                analysis = response.content.type === 'text' 
                    ? response.content.text 
                    : 'Unable to generate analysis';

                // Use sampling to generate recommendations
                const recommendationPrompt = `Based on these workspace roots:

${rootsList}

Provide 3-5 specific, actionable recommendations for workspace organization, security, or workflow improvements. Return as a JSON array of strings.`;

                const recResponse = await mcpServer.server.createMessage({
                    messages: [
                        {
                            role: 'user',
                            content: {
                                type: 'text',
                                text: recommendationPrompt
                            }
                        }
                    ],
                    maxTokens: 300,
                    modelPreferences: {
                        intelligencePriority: 0.6,
                        speedPriority: 0.7
                    }
                });

                const recText = recResponse.content.type === 'text' 
                    ? recResponse.content.text 
                    : '[]';

                try {
                    // Try to parse JSON recommendations
                    let jsonText = recText;
                    const jsonMatch = recText.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
                    if (jsonMatch) {
                        jsonText = jsonMatch[1];
                    } else {
                        // Try to extract array directly
                        const arrayMatch = recText.match(/\[[\s\S]*?\]/);
                        if (arrayMatch) {
                            jsonText = arrayMatch[0];
                        }
                    }
                    
                    recommendations = JSON.parse(jsonText);
                } catch {
                    // If parsing fails, create some default recommendations
                    recommendations = [
                        'Ensure all workspace roots have appropriate access controls',
                        'Consider organizing related projects under a common parent directory',
                        'Regularly review which directories are exposed to MCP servers'
                    ];
                }
            } else {
                analysis = `Found ${clientRoots.length} workspace root${clientRoots.length !== 1 ? 's' : ''}.`;
            }

            const output = {
                rootsAvailable: true,
                roots: clientRoots,
                analysis,
                ...(recommendations.length > 0 && { recommendations })
            };

            const resultText = `🗂️ Workspace Analysis

📍 Available Roots (${clientRoots.length}):
${rootsList}

📊 Analysis:
${analysis}

${recommendations.length > 0 ? `💡 Recommendations:
${recommendations.map((rec, idx) => `${idx + 1}. ${rec}`).join('\n')}` : ''}

✅ Server can now operate within these root boundaries.`;

            return {
                content: [{ type: 'text', text: resultText }],
                structuredContent: output
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                content: [{ type: 'text', text: `Error: ${errorMessage}` }],
                isError: true
            };
        }
    }
);

// Set up stdio transport
async function main() {
    const transport = new StdioServerTransport();
    await mcpServer.connect(transport);
    
    // Log to stderr so it doesn't interfere with stdio communication
    console.error('MCP Sampling Server running on stdio');
    console.error('\nAvailable tools:');
    console.error('  - summarize-text: Summarize any text using LLM sampling');
    console.error('  - analyze-sentiment: Analyze sentiment of text');
    console.error('  - generate-story: Generate creative stories');
    console.error('  - ask-question: Ask questions and get answers');
    console.error('  - create-user-profile: Interactive profile creation with elicitation');
    console.error('  - product-review-wizard: Multi-step survey with conditional questions');
    console.error('  - analyze-workspace: Analyze workspace roots and provide insights');
    console.error('\n📍 Roots feature: This server can request workspace roots from supporting clients');
}

main().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
});
