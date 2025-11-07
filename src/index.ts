import { openai } from '@ai-sdk/openai';
import { Kernel, NotFoundError } from '@onkernel/sdk';
import { Experimental_Agent as Agent, stepCountIs, tool } from 'ai';
import "dotenv/config";
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import z from 'zod';

/**
 * Prompts the user to select from default tasks or enter their own
 */
async function promptTaskSelection(): Promise<string> {
  const TASK_OPTIONS = {
    COINBASE: 'Visit https://www.ycombinator.com/companies, search for Coinbase, and report the company\'s team size.',
    ONE_PIECE: "Visit https://onepiece.fandom.com/wiki/One_Piece_Wiki, find the 'On This Day' section, and tell me a fact from it.",
    CUSTOM: 'Enter your own task'
  };

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'taskChoice',
      message: 'Select a task:',
      choices: [
        { name: TASK_OPTIONS.COINBASE, value: 'coinbase' },
        { name: TASK_OPTIONS.ONE_PIECE, value: 'onepiece' },
        { name: TASK_OPTIONS.CUSTOM, value: 'custom' }
      ]
    }
  ]);

  switch (answers.taskChoice) {
    case 'coinbase':
      return TASK_OPTIONS.COINBASE;
    case 'onepiece':
      return TASK_OPTIONS.ONE_PIECE;
    case 'custom':
      return 'custom';
    default:
      return 'custom';
  }
}

/**
 * Prompts the user for input via inquirer with validation
 */
async function promptUser(question: string): Promise<string> {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'task',
      message: question,
      validate: (input: string) => {
        if (!input.trim()) {
          return 'Task cannot be empty. Please enter a valid task.';
        }
        return true;
      }
    }
  ]);
  return answers.task;
}

async function main() {
  // Display welcome message with boxen
  console.log(boxen(chalk.cyan.bold('Welcome to Kernel AI SDK Agent!'), {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'cyan'
  }));

  // Get task from user - either from menu or custom input
  const selectedOption = await promptTaskSelection();
  const task = selectedOption === 'custom'
    ? await promptUser(chalk.yellow('Enter your task:'))
    : selectedOption;

  console.log(chalk.green('\n✓ Task received!\n'));
  console.log(chalk.blue(`Starting agent to complete task: ${chalk.bold(`"${task}"`)}\n`));

  // Initialize Kernel and create browser session with spinner
  const kernel = new Kernel();
  const browserSpinner = ora(chalk.cyan('Creating browser session...')).start();

  const session = await kernel.browsers.create({
    stealth: true,
  });
  browserSpinner.succeed(chalk.green(`Browser session created: ${chalk.underline(session.browser_live_view_url)}`));
  console.log();

  try {
    // Create AI agent with Playwright execution tool
    const agent = new Agent({
      model: openai("gpt-5-mini"),
      tools: {
        execute_playwright: tool({
          description: `Execute a focused Playwright action against the current page.
          This tool works best for ATOMIC OPERATIONS - one action per call.
          Examples of good uses: navigate to URL, click element, extract text, check visibility, fill form field, take screenshot.
          Do NOT combine multiple actions in one call (e.g., navigate + click in same code).
          If you need to do multiple things, make separate tool calls.
          IMPORTANT: Always use short timeouts (5000ms or less) for selector methods to fail fast.
          Add { timeout: 5000 } to methods like click(), fill(), isVisible(), etc.
          Examples: .click({ timeout: 5000 }), .isVisible({ timeout: 3000 })
          If a selector times out, try a different selector strategy instead of retrying.
          Expected to receive a 'page' variable (Playwright Page object).
          Always include a return statement with the result.
          The return value appears in the 'result' field of the response.`,
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
    const agentSpinner = ora(chalk.cyan('Agent is working on your task...')).start();
    const result = await agent.generate({
      prompt: task
    });
    agentSpinner.succeed(chalk.green('Agent completed the task!'));

    // Display results header with boxen
    console.log('\n' + boxen(chalk.green.bold('✓ Agent Completed Successfully'), {
      padding: 1,
      margin: { top: 1, bottom: 1, left: 0, right: 0 },
      borderStyle: 'round',
      borderColor: 'green'
    }));

    console.log(chalk.bold.cyan('\nFinal Answer:'));
    console.log(chalk.white(result.text));
    console.log(chalk.bold.cyan(`\nSteps Taken: ${chalk.yellow(result.steps.length.toString())}\n`));

  } catch (error) {
    console.log('\n' + boxen(chalk.red.bold('✗ Error Occurred'), {
      padding: 1,
      margin: { top: 1, bottom: 1, left: 0, right: 0 },
      borderStyle: 'round',
      borderColor: 'red'
    }));
    console.error(chalk.red('Error details:'), error);
    process.exit(1);
  } finally {
    // Clean up browser session
    const cleanupSpinner = ora(chalk.cyan('Cleaning up browser session...')).start();
    try {
      await kernel.browsers.deleteByID(session.session_id);
      cleanupSpinner.succeed(chalk.green('Cleanup complete!'));
    } catch (error) {
      // If session is already deleted (404), that's fine - cleanup already happened
      if (error instanceof NotFoundError || (error as any)?.status === 404) {
        cleanupSpinner.succeed(chalk.yellow(`Session already cleaned up (ID: ${session.session_id})`));
      } else {
        cleanupSpinner.fail(chalk.red('Cleanup failed'));
        throw error; // Re-throw unexpected errors
      }
    }
    console.log(chalk.bold.green('\n✓ Done!\n'));
  }
}

main();
