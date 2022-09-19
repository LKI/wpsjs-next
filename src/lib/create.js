const inquirer = require("inquirer");
const fs = require("fs");
const fsEx = require("fs-extra");
const path = require("path");
const execa = require("execa");
const chalk = require("chalk");
const cp = require("child_process");
const jsUtil = require("./util.js");

const pluginsDirPath = path.resolve(__dirname, "../../packages", "@wps-jsapi");
let context = "";

async function create(projectName, options) {
  const cwd = options.cwd || process.cwd();
  const targetDir = path.resolve(cwd, projectName || ".");
  if (fs.existsSync(targetDir)) {
    const { action } = await inquirer.prompt([
      {
        name: "action",
        type: "list",
        message: `目标文件夹 ${chalk.cyan(targetDir)} 已经存在。请选择操作:`,
        choices: [
          { name: "删除", value: "overwrite" },
          { name: "取消", value: false },
        ],
      },
    ]);
    if (!action) return false;
    console.log(`\n删除目录 ${chalk.cyan(targetDir)}...`);
    fsEx.removeSync(targetDir);
  }
  inquirer
    .prompt([
      {
        name: "pluginType",
        type: "list",
        message: `选择 WPS 加载项类型:`,
        choices: [
          {
            name: "文字",
            value: "wps",
          },
          {
            name: "演示",
            value: "wpp",
          },
          {
            name: "电子表格",
            value: "et",
          },
        ],
      },
      {
        name: "frameType",
        type: "list",
        message: `选择UI框架:`,
        choices: [
          {
            name: "无",
            value: "none",
          },
          {
            name: "Vue",
            value: "vue",
          },
          {
            name: "React",
            value: "react",
          },
        ],
      },
    ])
    .then((answers) => {
      context = targetDir;
      let demoType = answers.pluginType;
      if (answers.frameType !== "none") demoType = `${answers.pluginType}_${answers.frameType}`;
      const pluginPath = path.resolve(pluginsDirPath, demoType);
      fs.readdir(pluginPath, (_, files) => {
        files.forEach((file) => {
          const srcPath = path.resolve(pluginPath, file);
          const dstPath = path.resolve(targetDir, file);
          fsEx.copySync(srcPath, dstPath);
        });

        const cfgPath = path.resolve(targetDir, "package.json");
        let cfgData = fsEx.readFileSync(cfgPath);
        const oldCfg = JSON.parse(cfgData);

        const projectCfg = { name: projectName, addonType: answers.pluginType, version: "1.0.0" };
        for (let key in oldCfg) projectCfg[key] = oldCfg[key];
        projectCfg.name = projectName;
        projectCfg.addonType = answers.pluginType;
        projectCfg.version = "1.0.0";
        cfgData = JSON.stringify(projectCfg, "", "\t");
        fsEx.writeFileSync(cfgPath, cfgData);

        initAddOn(targetDir, projectName, answers);
      });
    });
}

async function initAddOn(targetDir, projectName) {
  if (jsUtil.hasGit()) {
    await run("git init");
    await run("git add -A");
    await run("git", ["commit", "-m", "init"]);
  }

  cp.spawnSync(jsUtil.GetNpmCmd(), ["i"], { stdio: "inherit", cwd: targetDir });

  console.log(
    `\n==>>  执行以下命令进行 WPS 加载项开发:\n\n` +
      chalk.cyan(` ${chalk.gray("$")} cd ${projectName}\n`) +
      chalk.cyan(` ${chalk.gray("$")} wpsjs debug\n`)
  );
}

function run(command, args) {
  if (!args) {
    [command, ...args] = command.split(/\s+/);
  }
  return execa(command, args, { cwd: context });
}

module.exports = (...args) => {
  return create(...args).catch((err) => {
    console.error(err);
    if (!process.env.VUE_CLI_TEST) {
      process.exit(1);
    }
  });
};
