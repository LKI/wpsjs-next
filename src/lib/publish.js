const inquirer = require("inquirer");
const fs = require("fs");
const path = require("path");
const fsEx = require("fs-extra");
const jsUtil = require("./util.js");
const chalk = require("chalk");
const buildModule = require("./build.js");

let projectCfg = jsUtil.projectCfg();
const publishDirectory = jsUtil.GetPublishDir();
let pluginConfig = {
  serverUrl: "",
  type: "online",
  isMulti: "false",
  isDynamicUrl: "false",
};

async function publish(options) {
  if (!options.serverUrl) {
    console.log('服务器地址示例 "http://127.0.0.1/jsplugindir/"');
    const result = await inquirer.prompt({
      name: "url",
      type: "input",
      message: `请输入发布 WPS 加载项的服务器地址:`,
    });
    options.serverUrl = result.url;
  }

  pluginConfig.serverUrl = options.serverUrl;
  if (!pluginConfig.serverUrl.endsWith("/")) {
    console.log(
      chalk.red(`输入服务器地址必须已'/'结束，并确保${pluginConfig.serverUrl + "/" + "ribbon.xml"}是一个有效地址`)
    );
    return;
  }

  pluginConfig.type = options.isOnline ? "online" : "offline";
  pluginConfig.isMulti = options.isMultiUser ? "true" : "false";
  pluginConfig.isDynamicUrl = options.isDynamicUrl ? "true" : "false";

  let buildRoot = path.resolve(process.cwd(), jsUtil.GetBuildDir());
  let offlineFile = path.resolve(buildRoot, `${projectCfg.name}.7z`);
  let onlineFile = path.resolve(buildRoot, "ribbon.xml");

  if (!fs.existsSync(offlineFile) && !fs.existsSync(onlineFile)) {
    await buildModule.buildWithArgs({ pluginType: pluginConfig.type });
  }
  await publishInner();
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
    online: pluginConfig.type === "online" ? "true" : "false",
    multiUser: pluginConfig.isMulti,
  };
  if (pluginConfig.type === "offline") {
    addon.url = pluginConfig.serverUrl + projectCfg.name + ".7z";
    addon.version = projectCfg.version;
  } else {
    addon.url = pluginConfig.serverUrl;
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
  pubHtml = pubHtml
    .replace(/PUBLISH_REPLACE_STRING/, outData)
    .replace(/SERVERID_REPLACE_STRING/, addon.multiUser === "true" ? "getServerId()" : "undefined")
    .replace(/DYNAMIC_REPLACE_STRING/, pluginConfig.isDynamicUrl);

  let outHtmlPath = path.resolve(publishRoot, pubHtmlName);
  fs.writeFileSync(outHtmlPath, pubHtml);

  let buildRoot = path.resolve(process.cwd(), jsUtil.GetBuildDir());
  console.log(
    chalk.cyan(`\n==>>  1.生成发布文件成功。请确保将目录${buildRoot}下的文件部署到${pluginConfig.serverUrl}`)
  );
  let checkUrl = addon.url;
  let checkResult = "成功打开后是下载一个后缀为.7z的文件";
  if (pluginConfig.type !== "offline") {
    checkUrl = addon.url + "ribbon.xml";
    checkResult = "成功打开后是以'<customUI...'开头的文本";
  }
  console.log(chalk.green(`\n        请用浏览器访问${checkUrl}来验证部署是否成功，${checkResult}`));
  if (pluginConfig.isDynamicUrl === "true") {
    console.log(
      chalk.cyan(
        `\n==>>  2.请也将${outHtmlPath}部署至服务器，用浏览器访问${addon.url + "publish.html"}验证是否部署成功`
      )
    );
  } else {
    console.log(chalk.cyan(`\n==>>  2.请将${outHtmlPath}分发给使用者，强烈建议同样将其部署到服务器...`));
  }
}

module.exports = (...args) => {
  return publish(...args).catch((err) => {
    console.error(err);
    if (!process.env.VUE_CLI_TEST) {
      process.exit(1);
    }
  });
};
