# Kernel AI SDK Agent

An AI-powered browser automation agent that combines [Kernel](https://onkernel.com) and the [Vercel AI SDK](https://ai-sdk.dev) to execute natural language tasks using Playwright. This demo project was built to showcase the flexibility and power of the new [Playwright Execution API](https://www.onkernel.com/docs/browsers/playwright-execution) from Kernel.

## What It Does

This tool creates an AI agent that can interact with websites through a remote browser. You describe what you want to accomplish in plain English, and the agent figures out how to do it by executing AI-generated Playwright commands.

## Prerequisites

- Node.js 18 or higher
- OpenAI API key
- Kernel API key

## Installation

```bash
npm install
```

## Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Add your API keys to `.env`:
```
OPENAI_API_KEY=your_openai_api_key
KERNEL_API_KEY=your_kernel_api_key
```

## Usage

```bash
npm run dev
```

<img width="1055" height="470" alt="Screenshot 2025-11-07 at 11 03 57 AM" src="https://github.com/user-attachments/assets/6e289fef-670d-49cd-ae7c-669b40056294" />

You'll be prompted to either choose from default example tasks or enter your own custom task. Examples:
- "Navigate to google.com and search for 'AI agents'"
- "Go to example.com and extract all the links on the page"
- "Find the login button on website.com and click it"

The agent will create a browser session, execute the task, and display the results. A live view URL is provided so you can watch the remote browser in real-time.

## How It Works

1. **Interactive Prompt**: The CLI prompts you for a task
2. **Browser Session**: Kernel creates a managed browser session
3. **AI Agent**: The agent (powered by GPT-5-mini) plans and executes steps
4. **Single Tool**: The agent utilizes a single tool called `execute_playwright` to interact with the page
5. **Results**: The agent reports what it accomplished and cleans up the session

The agent can take up to 20 steps to complete your task. Each step might involve:
- Navigating to a URL
- Clicking elements
- Filling forms
- Extracting data
- Taking screenshots
- Any other Playwright operation

## Architecture

- **Kernel**: Provides [cloud browser sessions](https://www.onkernel.com/docs/browsers/create-a-browser) and [Playwright Execution API](https://www.onkernel.com/docs/browsers/playwright-execution)
- **Vercel AI SDK**: Manages [Agent](https://ai-sdk.dev/docs/agents/overview) class behavior and tool calling
- **GPT-5-mini**: Powers the AI agent's reasoning and planning

## License

MIT
