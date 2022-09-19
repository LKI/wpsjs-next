const inquirer = require("inquirer");
const fsEx = require("fs-extra");

async function join() {
  inquirer
    .prompt({
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
    })
    .then((answers) => {
      const cfgPath = "package.json";
      let cfgData = fsEx.readFileSync(cfgPath);
      const oldCfg = JSON.parse(cfgData);

      const projectCfg = { name: "", addonType: answers.pluginType, version: "1.0.0" };
      for (let key in oldCfg) projectCfg[key] = oldCfg[key];
      projectCfg.addonType = answers.pluginType;
      cfgData = JSON.stringify(projectCfg, "", "\t");
      fsEx.writeFileSync(cfgPath, cfgData);
    });
}

module.exports = (...args) => {
  return join(...args).catch((err) => {
    console.error(err);
    if (!process.env.VUE_CLI_TEST) {
      process.exit(1);
    }
  });
};
