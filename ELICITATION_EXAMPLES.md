# Elicitation Examples

This document provides detailed examples of how to use the elicitation features in this MCP server.

## What is Elicitation?

**Elicitation** is the pattern of gathering missing information from users interactively. In MCP, while there isn't a built-in `elicitInput` API, we can simulate elicitation by:

1. **Using sampling to prompt the user** - Request the LLM to ask the user for missing information
2. **Parsing user responses** - Extract structured data from natural language responses
3. **Multi-turn interactions** - Use state management across multiple tool calls

This server demonstrates both approaches!

---

## Example 1: Single-Step Elicitation

### Tool: `create-user-profile`

This tool creates user profiles and automatically elicits any missing information.

#### Scenario A: All Information Provided
```json
{
  "name": "create-user-profile",
  "arguments": {
    "name": "Alice Smith",
    "age": 28,
    "occupation": "Software Engineer",
    "interests": "hiking, photography, cooking"
  }
}
```

**Result:** Profile created immediately with all provided data.

#### Scenario B: Missing Information (Elicitation Triggered)
```json
{
  "name": "create-user-profile",
  "arguments": {
    "name": "Bob Johnson"
  }
}
```

**What happens:**
1. Tool detects missing fields: age, occupation, interests
2. Uses sampling to prompt: "Please provide your age, occupation, and interests"
3. User (via LLM) responds with the missing information
4. Tool parses response and creates complete profile
5. Uses sampling again to generate a personalized summary

**Example Response:**
```json
{
  "profile": {
    "name": "Bob Johnson",
    "age": 35,
    "occupation": "Teacher",
    "interests": ["reading", "gardening", "travel"],
    "summary": "Bob Johnson is a 35-year-old Teacher who enjoys exploring new books and nurturing his garden..."
  },
  "missingFields": ["age", "occupation", "interests"]
}
```

---

## Example 2: Multi-Step Elicitation with Conditional Logic

### Tool: `product-review-wizard`

This tool implements a survey wizard that guides users through multiple steps with conditional questions.

### Step 1: Start the Survey
```json
{
  "name": "product-review-wizard",
  "arguments": {
    "step": "start",
    "productName": "Wireless Headphones"
  }
}
```

**Response:**
```
Great! You're reviewing "Wireless Headphones".

Next, please rate it from 1 (poor) to 5 (excellent). 
Call this tool again with step='rating' and your rating.
```

### Step 2: Provide Rating
```json
{
  "name": "product-review-wizard",
  "arguments": {
    "step": "rating",
    "productName": "Wireless Headphones",
    "rating": 2
  }
}
```

**Response:**
```
😕 You rated "Wireless Headphones" 2/5.

Now, please share your thoughts: What did you like or dislike about the product?

Call this tool with step='feedback' and your comments.
```

### Step 3: Provide Feedback
```json
{
  "name": "product-review-wizard",
  "arguments": {
    "step": "feedback",
    "productName": "Wireless Headphones",
    "rating": 2,
    "comments": "The sound quality was disappointing and the battery life was shorter than advertised."
  }
}
```

**Response (Conditional - triggers because rating ≤ 3):**
```
Thank you for your feedback. Since you gave a rating of 2/5, we'd love to know:

What specific improvements would you suggest?

Call this tool with step='complete' and your improvement suggestions.
```

### Step 4: Complete the Survey
```json
{
  "name": "product-review-wizard",
  "arguments": {
    "step": "complete",
    "productName": "Wireless Headphones",
    "rating": 2,
    "comments": "The sound quality was disappointing and the battery life was shorter than advertised.",
    "improvements": "Better battery optimization and improved audio drivers would make a huge difference."
  }
}
```

**Final Response:**
```json
{
  "currentStep": "complete",
  "review": {
    "productName": "Wireless Headphones",
    "rating": 2,
    "comments": "The sound quality was disappointing and the battery life was shorter than advertised.",
    "improvements": "Better battery optimization and improved audio drivers would make a huge difference.",
    "sentiment": "negative",
    "isComplete": true
  }
}
```

### Alternative Path (High Rating - No Improvements Requested)
If the rating had been 4 or 5, the tool would skip the improvements question and go straight to completion.

---

## Key Patterns Demonstrated

### 1. **Automatic Field Detection**
The `create-user-profile` tool automatically detects which fields are missing and requests them all at once.

### 2. **Conditional Elicitation**
The `product-review-wizard` only asks for improvement suggestions when the rating is 3 or below.

### 3. **State Management**
The wizard maintains state across multiple tool calls using the `step` parameter.

### 4. **Structured Response Parsing**
The profile creator parses JSON responses from the LLM to extract user-provided data.

### 5. **Combining Elicitation with Sampling**
Both tools use sampling not just to gather information, but also to:
- Generate personalized summaries (profile creator)
- Analyze sentiment (review wizard)

---

## Benefits of This Approach

✅ **User-Friendly**: Natural language interaction feels conversational  
✅ **Flexible**: Works with any LLM that supports the MCP sampling feature  
✅ **No Client Changes**: Uses standard MCP sampling, no custom protocols  
✅ **Transparent**: Users can see and approve each LLM request  
✅ **Progressive Enhancement**: Works with partial data, requests what's needed  

---

## Try It Yourself!

1. Build the server: `npm run build`
2. Connect via MCP Inspector: `npx @modelcontextprotocol/inspector node dist/index.js`
3. Try the `create-user-profile` tool with only a name
4. Try the `product-review-wizard` tool and walk through all steps

Happy eliciting! 🎉
