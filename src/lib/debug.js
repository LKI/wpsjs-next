const cp = require("child_process");
const express = require("express");
const ini = require("ini");
const os = require("os");
const builder = require("xmlbuilder");
const fs = require("fs");
const fsEx = require("fs-extra");
const path = require("path");
const http = require("http");
const jsUtil = require("./util.js");
const rcWatch = require("recursive-watch");
const sudo = require("sudo-js");
const inquirer = require("inquirer");
const chalk = require("chalk");

const app = express();
const clients = [];

let jspluginsXmlUrl = "";
let serverHost = "";
let serverPort = 3889;
let remoteDebuggingPort = -1;
let bSuRoot = false;
let bServerOnly = false;
let projectCfg = jsUtil.projectCfg();
let bDebug = false;

function GetBackOemPath() {
  return path.resolve(__dirname, "back.json");
}

function GetBackJspluginsXmlPath() {
  return path.resolve(__dirname, "jsplugins.xml");
}

function suRoot(tryCount, cb) {
  if (bSuRoot) {
    cb(true);
    return;
  }
  if (tryCount <= 0) {
    cb(false);
    return;
  }
  inquirer
    .prompt([
      {
        type: "password",
        name: "password",
        message: "身份验证，请输入密码：",
      },
    ])
    .then((answers) => {
      sudo.setPassword(answers.password);
      sudo.check((res) => {
        if (res) {
          bSuRoot = true;
          cb(true);
        } else {
          suRoot(--tryCount, cb);
        }
      });
    });
}

async function debug(options) {
  if (options.clean) {
    let backOemPath = GetBackOemPath();
    if (fsEx.pathExistsSync(backOemPath)) {
      await GetOemPath((path) => {
        fsEx.move(backOemPath, path, { overwrite: true });
      });
    }
    let backPath = GetBackJspluginsXmlPath();
    if (fsEx.pathExistsSync(backPath)) {
      let directPath = GetJspluginsXmlPath();
      await fsEx.move(backPath, directPath, { overwrite: true });
    }
    return;
  }

  if (options.remotePort) remoteDebuggingPort = options.remotePort;
  if (options.server) bServerOnly = true;
  if (options.debug) bDebug = true;
  //config oem.ini
  return jsUtil.GetWebSiteHost(options.port, (host, port) => {
    if (options.port && options.port !== port) {
      console.log(chalk.red(`服务启动失败，端口（${options.port}）被占用`));
      return;
    }
    serverHost = host;
    serverPort = port;
    //jspluginsXmlUrl = `${serverHost}/jsplugins.xml`

    configOem((ret) => {
      if (ret.status !== 0) {
        console.error(ret.msg);
        return;
      }

      //write jsplugins.xml
      let pluginXml = builder.create("jsplugins");
      let addonType = projectCfg.addonType ? projectCfg.addonType : "et";
      if (bDebug) {
        pluginXml
          .ele("jspluginonline")
          .att("name", projectCfg.name)
          .att("type", addonType)
          .att("url", `${serverHost}/`)
          .att("debug", "code")
          .up();
      } else {
        pluginXml
          .ele("jspluginonline")
          .att("name", projectCfg.name)
          .att("type", addonType)
          .att("url", `${serverHost}/`)
          .up();
      }

      let jspluginsXml = pluginXml.toString({ pretty: true });
      if (DebugVue(jspluginsXml, "dev") || DebugVue(jspluginsXml, "serve")) return;
      if (DebugReact(jspluginsXml, "start" || DebugReact(jspluginsXml, "dev"))) return;
      StartServer(jspluginsXml, () => {
        StartWps(jspluginsXml);
      });
    });
  });
}

let wpsTryCount = 0;
let wpsJspluginsXml;

function Debug(jspluginsXml, tag, cmd) {
  if (projectCfg.scripts[tag].trim() !== cmd) {
    let cfgData = JSON.stringify(projectCfg, null, 2);
    fsEx.writeFileSync("package.json", cfgData);
  }

  cp.spawn(jsUtil.GetNpmCmd(), ["run", tag], { stdio: "inherit" });
  wpsTryCount = 0;
  wpsJspluginsXml = jspluginsXml;
  setTimeout(TryStartWps, 1000);
}

function DebugVue(jspluginsXml, tag) {
  if (projectCfg.scripts && typeof projectCfg.scripts[tag] == "string") {
    let devCmd = projectCfg.scripts[tag].trim();
    if (devCmd.startsWith("vue-cli-service")) {
      Debug(jspluginsXml, tag, `vue-cli-service serve --port ${serverPort}`);
      return true;
    }
  }
  return false;
}

function DebugReact(jspluginsXml, tag) {
  if (projectCfg.scripts && typeof projectCfg.scripts[tag] == "string") {
    let devCmd = projectCfg.scripts[tag].trim();
    if (devCmd.includes("react-scripts")) {
      let cmd;
      if (os.platform() === "win32") {
        cmd = `set PORT=${serverPort} && react-scripts start`;
      } else {
        cmd = `export PORT=${serverPort} react-scripts start`;
      }
      Debug(jspluginsXml, tag, cmd);
      return true;
    }
  }
  return false;
}

function TryStartWps() {
  if (wpsTryCount > 5) return;
  http
    .get(`${serverHost}/index.html`, (res) => {
      wpsTryCount = 6;
      StartWps(wpsJspluginsXml);
      res.resume();
    })
    .on("error", () => {
      ++wpsTryCount;
      setTimeout(TryStartWps, 1000);
    });
}

function StartServer(jspluginsXml, callback) {
  //let rootPath = path.resolve(process.cwd(), "packages/@wps-jsapi/wps/")
  let rootPath = process.cwd();
  app.all("*", function (req, response, next) {
    if (req.originalUrl.endsWith(".html") || req.originalUrl.endsWith(".htm")) {
      let filePath = rootPath + req.originalUrl;
      let htmlData = fsEx.readFileSync(filePath);
      let pos = htmlData.indexOf("<body");
      if (pos === -1) pos = htmlData.indexOf("<script");
      if (pos === -1) {
        pos = htmlData.indexOf("<html>");
        pos += 6;
      }
      htmlData =
        htmlData.slice(0, pos) +
        `<script type="text/javascript" src="./hot-update-inject.js"></script>` +
        htmlData.slice(pos);
      response.writeHead(200, "OK", { "Content-Type": "text/html" });
      response.end(htmlData);
    } else if (req.originalUrl.endsWith("/hot-update-inject.js")) {
      response.writeHead(200, "OK", { "Content-Type": "application/javascript; charset=utf-8" });
      const inject = `function handleMessage(event) {
	var res = JSON.parse(event.data)
	if (res.update)
		window.location.reload()
}

function handleOnline(event) {
}

function handleDisconnect(event) {
	source.close();;
}

var source = new window.EventSource('${serverHost}/hot-update/${Math.random()}');
source.onopen = handleOnline;
source.onerror = handleDisconnect;
source.onmessage = handleMessage;`;
      response.end(inject);
    } else {
      next();
    }
  });
  app.use(express.static(rootPath));
  app.use("/jsplugins.xml", function (request, response) {
    response.writeHead(200, "OK", { "Content-Type": "text/xml" });
    response.end(jspluginsXml);
  });
  app.use("/hot-update/:id", function (request, response) {
    response.writeHead(200, "OK", {
      Connection: "keep-alive",
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    });
    clients.push(response);
  });

  let server = app.listen(serverPort, function () {
    console.log(jsUtil.getNow() + `启动本地web服务(${serverHost})成功！`);
    let lastTime = new Date();
    rcWatch(rootPath, () => {
      let nowTime = new Date();
      if (nowTime.getTime() - lastTime.getTime() > 300) {
        lastTime = nowTime;
        let res = { update: true };
        clients.forEach((response) => {
          response.write(`data:${JSON.stringify(res)}\n\n`);
        });
      }
    });
    callback();
  });

  server.on("error", (e) => {
    if (e.code === "EADDRINUSE") {
      console.log("地址正被使用，重试中...");
      setTimeout(() => {
        server.close();
        server.listen(serverPort);
      }, 2000);
    }
  });
}

function GetJspluginsXmlPath() {
  if (os.platform() === "win32") {
    return path.resolve(process.env.APPDATA, "kingsoft/wps/jsaddons/jsplugins.xml");
  }
  return path.resolve(process.env.HOME, ".local/share/Kingsoft/wps/jsaddons/jsplugins.xml");
}

function StartWps(jspluginsXml) {
  if (os.platform() === "win32") {
    StartWpsInner(jspluginsXml);
  } else {
    try {
      StartWpsInner(jspluginsXml);
    } catch (e) {
      if (os.platform() === "win32") {
        console.log(e);
      } else {
        suRoot(3, (res) => {
          if (res) {
            let directPath = GetBackJspluginsXmlPath();
            directPath = path.resolve(directPath, "..");
            sudo.exec(["chmod", "a+rw", directPath], () => {
              StartWpsInner(jspluginsXml);
            });
          }
        });
      }
    }
  }
}

function StartWpsInner(jspluginsXml) {
  //立即生效
  let directPath = GetJspluginsXmlPath();
  if (fsEx.pathExistsSync(directPath)) {
    let backPath = GetBackJspluginsXmlPath();
    if (!fsEx.pathExistsSync(backPath)) {
      fsEx.copySync(directPath, backPath);
    }
  }
  fsEx.ensureDirSync(path.dirname(directPath));
  fsEx.writeFileSync(directPath, jspluginsXml);

  let handShake = jsUtil.GetHandShake();
  fsEx.writeFileSync(handShake, process.cwd());

  let demoName = "systemdemo.html";
  let systemDemoPath = path.resolve(__dirname, "res", demoName);
  let demoData = fs.readFileSync(systemDemoPath);
  let htmlDemo = path.resolve(jsUtil.GetDebugTempPath(), demoName);
  fsEx.writeFileSync(htmlDemo, demoData);

  let sdkName = "wpsjsrpcsdk.js";
  let systemDemoJs = path.resolve(__dirname, "../../node_modules/wpsjs-rpc-sdk", sdkName);
  let sdkData = fs.readFileSync(systemDemoJs);
  let sdkDemo = path.resolve(jsUtil.GetDebugTempPath(), sdkName);
  fsEx.writeFileSync(sdkDemo, sdkData);

  let infoDemo = path.resolve(jsUtil.GetDebugTempPath(), "project.js");
  fsEx.writeFileSync(infoDemo, `var projInfo = {"name":"${projectCfg.name}","type":"${projectCfg.addonType}"}`);

  let urlDemo = path.resolve(jsUtil.GetDebugTempPath(), "NotifyDemoUrl");
  fsEx.writeFileSync(urlDemo, `${serverHost}/${jsUtil.GetDebugTempName()}/${demoName}`);

  if (projectCfg.addonType === "wps") {
    let wpsfileName = "wpsDemo.docx";
    let wpsfilePath = path.resolve(__dirname, "res", wpsfileName);
    let wpsfileData = fs.readFileSync(wpsfilePath);
    let wpsfileDst = path.resolve(jsUtil.GetDebugTempPath(), wpsfileName);
    fsEx.writeFileSync(wpsfileDst, wpsfileData);
  } else if (projectCfg.addonType === "wpp") {
    let wppfileName = "wppDemo.pptx";
    let wppfilePath = path.resolve(__dirname, "res", wppfileName);
    let wppfileData = fs.readFileSync(wppfilePath);
    let wppfileDst = path.resolve(jsUtil.GetDebugTempPath(), wppfileName);
    fsEx.writeFileSync(wppfileDst, wppfileData);
  } else if (projectCfg.addonType === "et") {
    let etfileName = "etDemo.xlsx";
    let etfilePath = path.resolve(__dirname, "res", etfileName);
    let etfileData = fs.readFileSync(etfilePath);
    let etfileDst = path.resolve(jsUtil.GetDebugTempPath(), etfileName);
    fsEx.writeFileSync(etfileDst, etfileData);
  }

  if (bServerOnly) return;

  //start wps
  GetExePath((cmd, args) => {
    //cmd = "f:\\work\\one\\debug\\WPSOffice\\office6\\wps.exe /prometheus /wps /t"
    if (remoteDebuggingPort !== -1) {
      cmd += " " + `/JsApiremotedebuggingPort=${remoteDebuggingPort}`;
      let userDataDir = path.join(os.tmpdir(), `wpsjs-userdatadir_${remoteDebuggingPort}`);
      cmd += " " + `/JsApiUserDataDir=${userDataDir}`;
    }
    if (os.platform() === "win32") {
      cp.spawn(cmd, args, { detached: true, stdio: ["ignore"] });
    } else {
      cp.spawn(cmd, { detached: true, stdio: ["ignore"] });
    }
  });
}

function tryconfigOemFileInner(oemPath, callback) {
  try {
    configOemFileInner(oemPath);
    callback({ status: 0, msg: "wps安装正常，" + oemPath + "文件设置正常。" });
  } catch (e) {
    let oemResult = "配置" + oemPath + "失败，请尝试以管理员重新运行！！";
    console.log(oemResult);
    console.log(e);
    return callback({ status: 1, msg: oemResult });
  }
}

function configOemFileInner(oemPath) {
  let config = ini.parse(fs.readFileSync(oemPath, "utf-8"));
  let sup = config.support || config.Support;
  let ser = config.server || config.Server;
  let needUpdate = false;
  if (!sup || !sup.JsApiPlugin || !sup.JsApiShowWebDebugger) needUpdate = true;
  if (!ser || ser.JSPluginsServer === undefined) needUpdate = true;
  if (ser && ser.JSPluginsServer !== jspluginsXmlUrl) {
    needUpdate = true;
    let backPath = GetBackOemPath();
    if (os.platform() === "win32") {
      if (!fsEx.pathExistsSync(backPath)) fs.writeFileSync(backPath, ini.stringify(config));
    } else {
      sudo.exec(["chmod", "a+rw", backPath], () => {
        if (!fsEx.pathExistsSync(backPath)) fs.writeFileSync(backPath, ini.stringify(config));
      });
    }
  }
  if (!sup) {
    sup = {};
    config.Support = sup;
  }
  if (!ser) {
    ser = {};
    config.Server = ser;
  }
  sup.JsApiPlugin = true;
  sup.JsApiShowWebDebugger = true;
  ser.JSPluginsServer = jspluginsXmlUrl;
  if (needUpdate) fs.writeFileSync(oemPath, ini.stringify(config));
}

function GetExePath(callback) {
  if (os.platform() === "win32") {
    let type = "KET.Sheet.12";
    if (projectCfg.addonType === "wps") type = "KWPS.Document.12";
    else if (projectCfg.addonType === "wpp") type = "KWPP.Presentation.12";
    cp.exec(`REG QUERY HKEY_CLASSES_ROOT\\${type}\\shell\\new\\command /ve`, function (error, stdout) {
      let strList = stdout.split("    ");
      let val = strList.length > 2 ? strList[3] : undefined;
      if (typeof val == "undefined" || val == null) {
        throw new Error("WPS未安装，请安装WPS 2019 最新版本。");
      }
      let pos = val.indexOf(".exe");
      if (pos < 0) {
        throw new Error("wps安装异常，请确认有没有正确的安装 WPS 2019最新版本！");
      }
      val = val.trim();
      if (!val.endsWith('"%1"')) {
        console.log("获取 WPS 启动路径异常，继续尝试启动");
      }
      let cmdString = val.replace('"%1"', "");
      let cmds = cmdString.split('"');
      let exePath = cmds[0] ? cmds[0] : cmds[1];
      let rawArgs = [];
      if (cmds.length === 1) {
        let data = cmds[0].split(" ");
        exePath = data[0];
        rawArgs = data.splice(1);
      } else if (cmds.length > 1) {
        let idx = cmds[0] ? 1 : 2;
        if (cmds[idx]) {
          rawArgs = cmds[idx].split(" ");
        }
      }
      let args = [];
      rawArgs.forEach(function (item) {
        if (item) args.push(item);
      });
      callback(exePath, args);
    });
  } else {
    let exePath = `/opt/kingsoft/wps-office/office6/${projectCfg.addonType}`;
    if (!fsEx.existsSync(exePath))
      exePath = `/opt/apps/cn.wps.wps-office-pro/files/kingsoft/wps-office/office6/${projectCfg.addonType}`;
    callback(exePath, []);
  }
}

function GetOffice6Path(callback) {
  if (os.platform() === "win32") {
    cp.exec("REG QUERY HKEY_CLASSES_ROOT\\KWPS.Document.12\\shell\\open\\command /ve", function (error, stdout) {
      let val = undefined;
      try {
        val = stdout.split("    ")[3].split('"')[1];
      } catch (err) {
        throw new Error("WPS未安装，请安装WPS 2019 最新版本。");
      }
      if (typeof val == "undefined" || val == null) {
        throw new Error("WPS未安装，请安装WPS 2019 最新版本。");
      }
      let pos = val.indexOf("wps.exe");
      if (pos < 0) pos = val.indexOf("wpsoffice.exe");
      if (pos < 0) {
        console.log(val);
        throw new Error("wps安装异常，请确认有没有正确的安装WPS 2019 最新版本！");
      }
      let oemPath = val.substring(0, pos);
      callback(oemPath);
    });
  } else {
    let oemPath = "/opt/kingsoft/wps-office/office6/";
    if (!fsEx.existsSync(oemPath)) oemPath = "/opt/apps/cn.wps.wps-office-pro/files/kingsoft/wps-office/office6/";
    callback(oemPath);
  }
}

function GetOemPath(callback) {
  GetOffice6Path((path) => {
    let oemPath = path + "cfgs/oem.ini";
    callback(oemPath);
  });
}

function configOem(callback) {
  try {
    GetOemPath((oemPath) => {
      try {
        configOemFileInner(oemPath, callback);
        callback({ status: 0, msg: "wps安装正常，" + oemPath + "文件设置正常。" });
      } catch (e) {
        if (os.platform() === "win32") {
          let oemResult = "配置" + oemPath + "失败，请尝试以管理员重新运行！！";
          console.log(oemResult);
          console.log(e);
          return callback({ status: 1, msg: oemResult });
        } else {
          suRoot(3, (res) => {
            if (res) {
              sudo.exec(["chmod", "a+rw", oemPath], () => {
                tryconfigOemFileInner(oemPath, callback);
                cp.exec("quickstartoffice restart");
              });
            } else {
              let oemResult = "配置" + oemPath + "失败，请尝试以管理员重新运行！！";
              console.log(oemResult);
              console.log(e);
              return callback({ status: 1, msg: oemResult });
            }
          });
        }
      }
    });
  } catch (e) {
    return callback({
      status: 1,
      msg: e,
    });
  }
}

module.exports = (...args) => {
  return debug(...args).catch((err) => {
    console.error(err);
    if (!process.env.VUE_CLI_TEST) {
      process.exit(1);
    }
  });
};
