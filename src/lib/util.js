const express = require("express");
const portfinder = require("portfinder");
const os = require("os");
const path = require("path");
const fsEx = require("fs-extra");
const fswin = require("fswin");
var cp = require("child_process");

const app = express();
let netPort = 3889;
let bInited = false;
let _hasGit;
let demoServerPort = 3999;
let bdemoServerInited = false;

//read config
function projectCfg() {
  const cwd = process.cwd();
  const cfgPath = path.resolve(cwd, "package.json");
  var cfgData = fsEx.readFileSync(cfgPath);
  return JSON.parse(cfgData);
}

//获取当前时间
function getNow() {
  let nowDate = new Date();
  let year = nowDate.getFullYear();
  let month = nowDate.getMonth() + 1;
  let day = nowDate.getDate();
  let hour = nowDate.getHours();
  let minute = nowDate.getMinutes();
  let second = nowDate.getSeconds();
  return year + "年" + month + "月" + day + "日 " + hour + ":" + minute + ":" + second + "  ";
}

async function GetWebSiteHost(port, cb) {
  cb = cb || function () {};
  if (bInited) {
    cb(`http://127.0.0.1:${netPort}`, netPort);
  } else {
    bInited = true;
    port = port || netPort;
    portfinder.basePort = port;
    netPort = await portfinder.getPortPromise();
    cb(`http://127.0.0.1:${netPort}`, netPort);
  }
}

function GetNpmCmd() {
  if (os.platform() == "win32") return "npm.cmd";
  return "npm";
}

function GetFrameType() {
  let cfg = projectCfg();
  if (typeof cfg.scripts != "undefined") {
    let devSctipt = cfg.scripts["dev"] ? cfg.scripts["dev"] : cfg.scripts["serve"];
    if (typeof devSctipt != "undefined") {
      devSctipt = devSctipt.trim();
      if (devSctipt.includes("vue-cli-service")) return "Vue";
    }
    if (typeof devSctipt === "undefined") devSctipt = cfg.scripts["start"];
    if (typeof devSctipt != "undefined") {
      devSctipt = devSctipt.trim();
      if (devSctipt.includes("react-scripts")) return "React";
    }
  }
  return "None";
}

function GetHandShake() {
  let remoteDebugID = path.resolve(GetDebugTempPath(), "wps-remote-debug.json");
  return remoteDebugID;
}

function GetDebugTempName() {
  return ".debugTemp";
}

function GetDebugTempPath(noCreate) {
  let tempPath = GetDebugTempName();
  let frameType = GetFrameType();
  if (frameType === "None") tempPath = path.resolve(process.cwd(), tempPath);
  else tempPath = path.resolve(process.cwd(), "public", tempPath);
  if (noCreate !== true && !fsEx.pathExistsSync(tempPath)) {
    fsEx.ensureDirSync(tempPath);
    if (os.platform() == "win32") fswin.setAttributesSync(tempPath, { IS_HIDDEN: true });
  }
  return tempPath;
}

function hasGit() {
  if (_hasGit != null) {
    return _hasGit;
  }
  try {
    cp.execSync("git --version", { stdio: "ignore" });
    return (_hasGit = true);
  } catch (e) {
    return (_hasGit = false);
  }
}

function GetBuildDir() {
  return "wps-addon-build";
}

function GetPublishDir() {
  return "wps-addon-publish";
}

async function GetDemoServerPort(cb) {
  cb = cb || function () {};
  if (bdemoServerInited) {
    cb(demoServerPort);
  } else {
    bdemoServerInited = true;
    portfinder.basePort = demoServerPort;
    demoServerPort = await portfinder.getPortPromise();
    cb(demoServerPort);
  }
}

module.exports = {
  GetWebSiteHost,
  getNow,
  GetNpmCmd,
  GetFrameType,
  projectCfg,
  GetHandShake,
  GetDebugTempName,
  GetDebugTempPath,
  hasGit,
  GetBuildDir,
  GetPublishDir,
  GetDemoServerPort,
};
