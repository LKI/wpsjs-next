const inquirer = require("inquirer");
const fs = require("fs");
const path = require("path");
const fsEx = require("fs-extra");
const jsUtil = require("./util.js");
const chalk = require("chalk");
const buildMoudle = require("./build.js");

let projectCfg = jsUtil.projectCfg();
const publishDirectory = jsUtil.GetPublishDir();
let pluginUrl = "";
let pluginType = "true";
let publishSupportMultiUser = "false";

async function publish(options) {
  new Promise((resolve, reject) => {
    if (options.serverUrl) {
      resolve({ url: options.serverUrl });
    } else {
      console.log('服务器地址示例 "http://127.0.0.1/jsplugindir/"');
      inquirer
        .prompt({
          name: "url",
          type: "input",
          message: `请输入发布 WPS 加载项的服务器地址:`,
        })
        .then((answers) => {
          resolve(answers);
        });
    }
  }).then((answers) => {
    pluginUrl = answers.url;

    let buildRoot = path.resolve(process.cwd(), jsUtil.GetBuildDir());
    let offlineFile = path.resolve(buildRoot, `${projectCfg.name}.7z`);
    let onlineFile = path.resolve(buildRoot, "ribbon.xml");
    if (fs.existsSync(offlineFile)) {
      pluginType = "false";
      publishInner();
    } else if (fs.existsSync(onlineFile)) {
      pluginType = "true";
      publishInner();
    } else {
      inquirer
        .prompt({
          name: "pluginType",
          type: "list",
          message: `选择 WPS 加载项发布类型:`,
          choices: [
            {
              name: "在线模式",
              value: "online",
            },
            {
              name: "离线模式",
              value: "offline",
            },
          ],
        })
        .then((answers) => {
          inquirer
            .prompt({
              name: "publishSupportMultiUser",
              type: "list",
              message: `您的publish页面是否需要满足多用户同时使用:`,
              choices: [
                {
                  name: "否",
                  value: "false",
                },
                {
                  name: "是",
                  value: "true",
                },
              ],
            })
            .then((answers) => {
              pluginType = answers.pluginType !== "offline" ? "true" : "false";
              publishSupportMultiUser = answers.publishSupportMultiUser === "true" ? "true" : "false";

              if (!pluginUrl) {
                console.log(chalk.red(`\n  发布生成失败。请输入有效的服务器地址`));
                return;
              }

              let args = { pluginType: answers.pluginType };
              buildMoudle.buildWithArgs(args);
              publishInner();
            });
        });
    }
  });
}

async function publishInner() {
  let curDir = process.cwd();
  let publishRoot = path.resolve(curDir, publishDirectory);
  fsEx.removeSync(publishRoot);

  let publishList = {};
  let publishListPath = path.resolve(__dirname, "publishlist.json");
  if (fs.existsSync(publishListPath)) {
    publishList = require(publishListPath);
  }
  let addon = {
    name: projectCfg.name,
    addonType: projectCfg.addonType,
    online: pluginType,
    multiUser: publishSupportMultiUser,
  };
  let url = pluginUrl;
  if (pluginType === "false") {
    if (!url.endsWith("/")) {
      console.log(
        chalk.red(`输入服务器地址必须已'/'结束，并确保${pluginUrl + "/" + projectCfg.name + ".7z"}是一个有效地址`)
      );
      return;
    }
    addon.url = pluginUrl + projectCfg.name + ".7z";
    addon.version = projectCfg.version;
  } else {
    if (!url.endsWith("/")) {
      console.log(chalk.red(`输入服务器地址必须已'/'结束，并确保${pluginUrl + "/" + "ribbon.xml"}是一个有效地址`));
      return;
    }
    addon.url = url;
  }
  publishList[addon.name] = addon;
  let publishData = JSON.stringify(publishList);
  fs.writeFileSync(publishListPath, publishData);

  let outList = [];
  for (let item in publishList) {
    outList.push(publishList[item]);
  }
  let outData = JSON.stringify(outList);
  fsEx.ensureDirSync(publishRoot);
  let pubHtmlName = "publish.html";
  let pubHtmlPath = path.resolve(__dirname, "res", pubHtmlName);
  let pubHtml = fs.readFileSync(pubHtmlPath, "utf-8");
  pubHtml = pubHtml.replace(/PUBLISH_REPLACE_STRING/, outData);
  if (addon.multiUser === "true") {
    pubHtml = pubHtml.replace(/SERVERID_REPLACE_STRING/, "getServerId()");
  } else {
    pubHtml = pubHtml.replace(/SERVERID_REPLACE_STRING/, "undefined");
  }
  let outHtmlPath = path.resolve(publishRoot, pubHtmlName);
  fs.writeFileSync(outHtmlPath, pubHtml);

  let buildRoot = path.resolve(process.cwd(), jsUtil.GetBuildDir());
  console.log(chalk.cyan(`\n==>>  1.生成发布文件成功。请确保将目录${buildRoot}下的文件部署到${pluginUrl}`));
  let checkUrl = addon.url;
  let checkResult = "成功打开后是下载一个后缀为.7z的文件";
  if (pluginType !== "false") {
    checkUrl = addon.url + "ribbon.xml";
    checkResult = "成功打开后是以'<customUI...'开头的文本";
  }
  console.log(chalk.green(`\n        请用浏览器访问${checkUrl}来验证部署是否成功，${checkResult}`));
  console.log(chalk.cyan(`\n==>>  2.请将${outHtmlPath}分发给使用者，强烈建议同样将其部署到服务器...`));
}

module.exports = (...args) => {
  return publish(...args).catch((err) => {
    console.error(err);
    if (!process.env.VUE_CLI_TEST) {
      process.exit(1);
    }
  });
};
