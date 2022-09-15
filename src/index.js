#!/usr/bin/env node

var program = require("commander");
const chalk = require("chalk");
const leven = require("leven");
const minimist = require("minimist");

program.version(`${require("../package").name} ${require("../package").version}`).usage("<command> [options]");

program
  .command("create <app-name>")
  .description("创建一个 WPS 加载项")
  .action((name, cmd) => {
    const options = cleanArgs(cmd);

    if (minimist(process.argv.slice(3))._.length > 1) {
      console.log(
        chalk.yellow(
          "\n Info: You provided more than one argument. The first one will be used as the app's name, the rest are ignored."
        )
      );
    }
    require("./lib/create")(name, options);
  });

program
  .command("join")
  .description("接入 WPS 加载项，将已有的前端工程快速提升为 WPS 加载项，开始应用与 WPS 的交互功能")
  .allowUnknownOption()
  .action((plugin) => {
    require("./lib/join")();
  });

program
  .command("debug")
  .description("调试 WPS 加载项")
  .option("-c, --clean", "还原测试环境")
  .option("-p, --port <port>", "指定 WPS 加载项服务端口")
  .option("-r, --remotePort <port>", "指定 WPS 加载项远程调试端口")
  .option("-s, --server", "只启动服务，不启动 WPS 进程")
  .option("-d, --debug", "配置远程调试")
  .allowUnknownOption()
  .action((cmd) => {
    const options = cleanArgs(cmd);
    require("./lib/debug")(options);
  });

program
  .command("build")
  .description("打包 WPS 加载项")
  .allowUnknownOption()
  .action((cmd) => {
    require("./lib/build.js").build();
  });

program
  .command("publish")
  .description("发布 WPS 加载项")
  .option("-s, --serverUrl <serverUrl>", "服务器地址")
  .allowUnknownOption()
  .action((cmd) => {
    const options = cleanArgs(cmd);
    require("./lib/publish")(options);
  });

program
  .command("unpublish")
  .description("取消发布 WPS 加载项")
  .allowUnknownOption()
  .action((cmd) => {
    require("./lib/unpublish")();
  });

program.arguments("<command>").action((cmd) => {
  program.outputHelp();
  console.log(`  ` + chalk.red(`Unknown command ${chalk.yellow(cmd)}.`));
  console.log();
  suggestCommands(cmd);
});

// add some useful info on help
program.on("--help", () => {
  console.log();
});

program.commands.forEach((c) => c.on("--help", () => console.log()));

// enhance common error messages
const enhanceErrorMessages = require("./lib/enhanceErrorMessages");

enhanceErrorMessages("missingArgument", (argName) => {
  return `Missing required argument ${chalk.yellow(`<${argName}>`)}.`;
});

enhanceErrorMessages("unknownOption", (optionName) => {
  return `Unknown option ${chalk.yellow(optionName)}.`;
});

enhanceErrorMessages("optionMissingArgument", (option, flag) => {
  return (
    `Missing required argument for option ${chalk.yellow(option.flags)}` + (flag ? `, got ${chalk.yellow(flag)}` : ``)
  );
});

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

function suggestCommands(unknownCommand) {
  const availableCommands = program.commands.map((cmd) => cmd._name);

  let suggestion;

  availableCommands.forEach((cmd) => {
    const isBestMatch = leven(cmd, unknownCommand) < leven(suggestion || "", unknownCommand);
    if (leven(cmd, unknownCommand) < 3 && isBestMatch) {
      suggestion = cmd;
    }
  });

  if (suggestion) {
    console.log(`  ` + chalk.red(`Did you mean ${chalk.yellow(suggestion)}?`));
  }
}

function camelize(str) {
  return str.replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ""));
}

// commander passes the Command object itself as options,
// extract only actual options into a fresh object.
function cleanArgs(cmd) {
  const args = {};
  cmd.options.forEach((o) => {
    const key = camelize(o.long.replace(/^--/, ""));
    // if an option is not present and Command has a method with the same name
    // it should not be copied
    if (typeof cmd[key] !== "function" && typeof cmd[key] !== "undefined") {
      args[key] = cmd[key];
    }
  });
  return args;
}
