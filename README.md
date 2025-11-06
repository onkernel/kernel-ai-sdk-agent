# Kernel AI SDK Agent

An AI-powered browser automation agent that combines [Kernel](https://onkernel.com) and the [Vercel AI SDK](https://sdk.vercel.ai) to execute natural language tasks using Playwright.

## What It Does

This tool creates an AI agent that can interact with websites through a browser. You describe what you want to accomplish in plain English, and the agent figures out how to do it by executing Playwright commands.

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

You'll be prompted to enter your task. Examples:
- "Navigate to google.com and search for 'AI agents'"
- "Go to example.com and extract all the links on the page"
- "Find the login button on website.com and click it"

The agent will create a browser session, execute the task, and display the results. A live view URL is provided so you can watch the browser in real-time.

## How It Works

1. **Interactive Prompt**: The CLI prompts you for a task
2. **Browser Session**: Kernel creates a managed browser session
3. **AI Agent**: The agent (powered by GPT-5-mini) plans and executes steps
4. **Playwright Tool**: The agent can execute Playwright code to interact with the page
5. **Results**: The agent reports what it accomplished and cleans up the session

The agent can take up to 20 steps to complete your task. Each step might involve:
- Navigating to a URL
- Clicking elements
- Filling forms
- Extracting data
- Taking screenshots
- Any other Playwright operation

## Architecture

- **Kernel**: Provides remote browser sessions and Playwright execution
- **Vercel AI SDK**: Manages agent behavior and tool calling
- **GPT-5-mini**: Powers the AI agent's reasoning and planning

## License

MIT
