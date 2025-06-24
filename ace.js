/*
|--------------------------------------------------------------------------
| JavaScript entrypoint for running ace commands
|--------------------------------------------------------------------------
|
| DO NOT MODIFY THIS FILE AS IT WILL BE OVERRIDDEN DURING THE BUILD
| PROCESS.
|
| See docs.adonisjs.com/guides/typescript-build-process#creating-production-build
|
| Since, we cannot run TypeScript source code using "node" binary, we need
| a JavaScript entrypoint to run ace commands.
|
| This file registers the "ts-node/esm" hook with the Node.js module system
| and then imports the "bin/console.ts" file.
|
*/

/**
 * This file is the entrypoint for Ace commands. It directly imports
 * the TypeScript version of the console kernel.
 *
 * The `ts-node/esm` loader should be activated via NODE_OPTIONS
 * in the package.json script.
 */

/**
 * Import ace console entrypoint
 */
await import('./bin/console.ts')
