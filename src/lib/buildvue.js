const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const defaultsDeep = require("lodash.defaultsdeep");
const cp = require("child_process");
const jsUtil = require("./util.js");
let projectCfg = jsUtil.projectCfg();

//read config
function loadUserOptions() {
  // vue.config.js
  let fileConfig, pkgConfig, resolved;
  const configPath = process.env.VUE_CLI_SERVICE_CONFIG_PATH || path.resolve(process.cwd(), "vue.config.js");
  if (fs.existsSync(configPath)) {
    try {
      fileConfig = require(configPath);

      if (typeof fileConfig === "function") {
        fileConfig = fileConfig();
      }

      if (!fileConfig || typeof fileConfig !== "object") {
        error(
          `Error loading ${chalk.bold("vue.config.js")}: should export an object or a function that returns object.`
        );
        fileConfig = null;
      }
    } catch (e) {
      error(`Error loading ${chalk.bold("vue.config.js")}:`);
      throw e;
    }
  }

  // package.vue
  pkgConfig = projectCfg.vue;
  if (pkgConfig && typeof pkgConfig !== "object") {
    error(`Error loading vue-cli config in ${chalk.bold(`package.json`)}: ` + `the "vue" field should be an object.`);
    pkgConfig = null;
  }

  if (fileConfig) {
    if (pkgConfig) {
      warn(`"vue" field in package.json ignored ` + `due to presence of ${chalk.bold("vue.config.js")}.`);
      warn(`You should migrate it into ${chalk.bold("vue.config.js")} ` + `and remove it from package.json.`);
    }
    resolved = fileConfig;
  } else if (pkgConfig) {
    resolved = pkgConfig;
  } else {
    resolved = {};
  }

  if (resolved.css && typeof resolved.css.modules !== "undefined") {
    if (typeof resolved.css.requireModuleExtension !== "undefined") {
      warn(
        `You have set both "css.modules" and "css.requireModuleExtension" in ${chalk.bold("vue.config.js")}, ` +
          `"css.modules" will be ignored in favor of "css.requireModuleExtension".`
      );
    } else {
      warn(
        `"css.modules" option in ${chalk.bold("vue.config.js")} ` +
          `is deprecated now, please use "css.requireModuleExtension" instead.`
      );
      resolved.css.requireModuleExtension = !resolved.css.modules;
    }
  }

  // normalize some options
  ensureSlash(resolved, "publicPath");
  if (typeof resolved.publicPath === "string") {
    resolved.publicPath = resolved.publicPath.replace(/^\.\//, "");
  }
  removeSlash(resolved, "outputDir");

  return resolved;
}

function ensureSlash(config, key) {
  const val = config[key];
  if (typeof val === "string") {
    config[key] = val.replace(/([^/])$/, "$1/");
  }
}

function removeSlash(config, key) {
  if (typeof config[key] === "string") {
    config[key] = config[key].replace(/\/$/g, "");
  }
}

function defaults() {
  return {
    // project deployment base
    publicPath: "/",

    // where to output built files
    outputDir: "dist",

    // where to put static assets (js/css/img/font/...)
    assetsDir: "",

    // filename for index.html (relative to outputDir)
    indexPath: "index.html",

    // whether filename will contain hash part
    filenameHashing: true,

    // boolean, use full build?
    runtimeCompiler: false,

    // deps to transpile
    transpileDependencies: [
      /* string or regex */
    ],

    // sourceMap for production build?
    productionSourceMap: !process.env.VUE_CLI_TEST,

    // use thread-loader for babel & TS in production build
    // enabled by default if the machine has more than 1 cores
    parallel: hasMultipleCores(),

    // multi-page config
    pages: undefined,

    // <script type="module" crossorigin="use-credentials">
    // #1656, #1867, #2025
    crossorigin: undefined,

    // subresource integrity
    integrity: false,

    css: {
      // extract: true,
      // modules: false,
      // sourceMap: false,
      // loaderOptions: {}
    },

    // whether to use eslint-loader
    lintOnSave: "default",

    devServer: {
      /*
			open: process.platform === 'darwin',
			host: '0.0.0.0',
			port: 8080,
			https: false,
			hotOnly: false,
			proxy: null, // string | Object
			before: app => {}
		  */
    },
  };
}

function hasMultipleCores() {
  try {
    return require("os").cpus().length > 1;
  } catch (e) {
    return false;
  }
}

function buildVue(options) {
  const userOptions = loadUserOptions();
  let projectOptions = defaultsDeep(userOptions, defaults());
  if (options.pluginType === "offline" && projectOptions.publicPath.trim() !== "") {
    throw new Error(
      "生成离线加载项 publicPath 必须为 ''，请修改后重试。参考在package.json中添加：" +
        `
"vue": {
	"publicPath": ""
}
`
    );
  }
  cp.execSync("npm run build", { stdio: "inherit" });
  return projectOptions.outputDir;
}

function warn(message) {
  console.log(chalk.yellow(message));
}

function error(message) {
  console.log(chalk.red(message));
}

module.exports = (...args) => {
  try {
    return buildVue(...args);
  } catch (err) {
    error(err);
    if (!process.env.VUE_CLI_TEST) {
      process.exit(1);
    }
  }
};
