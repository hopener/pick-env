#!/usr/bin/env node
import inquirer from "inquirer";
import { config, parse } from "dotenv";
import { expand } from "dotenv-expand";
import { Command } from "commander";
import spawn from "cross-spawn";
import { readEnvFiles } from "./utils.js";

const filesPromise = readEnvFiles();
const program = new Command();

program
  .version("0.0.0", "-v, --version")
  .name("pick-env")
  .option("-f, --file <file>", "default env file to use")
  .option("-e, --empty", "use an empty env file");

program.parse();

if (!program.args.length) {
  program.outputHelp();
  process.exit(0);
}

const { file, empty } = program.opts();
const overridenVars = program.args.filter((arg) => arg.match(/.*?=\s*(.*)/));
let environment = {
  ...(process.env as Record<PropertyKey, string>),
  ...parse(overridenVars.join("\n")),
};
const files = await filesPromise;
const validArgs = program.args.filter((arg) => !overridenVars.includes(arg));
let envFile = file;

if (file && !files.includes(file)) {
  console.error(`The specified env file does not exist: '${file}'`);
  process.exit(1);
}

if (empty && file) {
  console.log("Both --empty and --file flag provided, ignoring --file");
}

if (!file && !empty) {
  if (!files.length) {
    console.error('No env files found matching pattern: ".env"');
    process.exit(1);
  }

  const { file } = await inquirer.prompt({
    type: "list",
    name: "file",
    choices: files,
  });

  envFile = file;
}

if (!empty) {
  const env = config({ path: envFile, processEnv: environment });
  const { parsed } = expand({
    ignoreProcessEnv: true,
    ...env,
    parsed: {
      ...env.parsed,
      ...environment,
    },
  });

  if (parsed) environment = parsed;
}

const childProcess = spawn(validArgs.join(" "), {
  stdio: "inherit",
  shell: true,
  env: environment,
});

process.on("exit", () => childProcess.kill());
