import { openai } from '@ai-sdk/openai';
import { Kernel } from '@onkernel/sdk';
import { Experimental_Agent as Agent, stepCountIs, tool } from 'ai';
import "dotenv/config";
import * as readline from 'readline';
import z from 'zod';

/**
 * Prompts the user for input via the command line
 */
function promptUser(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  console.log('Welcome to Kernel AI SDK Agent!\n');

  // Get task from user
  const task = await promptUser('Enter your task: ');

  if (!task.trim()) {
    console.error('Error: Task cannot be empty');
    process.exit(1);
  }

  console.log(`\nStarting agent to complete task: "${task}"\n`);

  // Initialize Kernel and create browser session
  const kernel = new Kernel();
  const session = await kernel.browsers.create();
  console.log(`Browser session created: ${session.browser_live_view_url}\n`);

  try {
    // Create AI agent with Playwright execution tool
    const agent = new Agent({
      model: openai("gpt-5-mini"),
      tools: {
        execute_playwright: tool({
          description: "execute some playwright typescript code against the current page. The code can assume the existence of a page variable that is a playwright page object. The code should have a return statement at the end that returns a value. The value will be available in the result property of the output schema.",
          inputSchema: z.object({
            code: z.string().describe("the playwright code to execute")
          }),
          outputSchema: z.object({
            success: z.boolean().describe("Whether the code executed successfully"),
            error: z.string().optional().describe("Error message if execution failed"),
            result: z.unknown().optional().describe("The value returned by the code (if any)"),
            stderr: z.string().optional().describe("Standard error from the execution"),
            stdout: z.string().optional().describe("Standard output from the execution"),
            newSnapshot: z.string().optional().describe("The new snapshot of the page"),
          }),
          execute: async ({ code }) => {
            console.log("Executing Playwright code...");
            const result = await kernel.browsers.playwright.execute(session.session_id, { code });
            const newSnapshot = await kernel.browsers.playwright.execute(session.session_id, {
              code: "return await page._snapshotForAI()"
            });
            return {
              ...result,
              newSnapshot: newSnapshot.result as string,
            };
          }
        }),
      },
      stopWhen: stepCountIs(20),
    });

    // Execute the agent with the user's task
    const result = await agent.generate({
      prompt: task
    });

    // Display results
    console.log('\n--- Agent Completed ---');
    console.log(`\nFinal Answer: ${result.text}`);
    console.log(`\nSteps Taken: ${result.steps.length}`);

    // Log each step
    result.steps.forEach((step, index) => {
      console.log(`\nStep ${index + 1}:`);
      console.log(`  Type: ${step.type}`);
      if (step.text) {
        console.log(`  Text: ${step.text}`);
      }
    });

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    // Clean up browser session
    console.log('\nCleaning up browser session...');
    await kernel.browsers.deleteByID(session.session_id);
    console.log('Done!');
  }
}

main();
