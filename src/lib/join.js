const inquirer = require('inquirer')
const fsEx = require('fs-extra')


async function join(options) {
	inquirer.prompt({
		name: 'pluginType',
		type: 'list',
		message: `选择 WPS 加载项类型:`,
		choices: [
			{
				name: '文字',
				value: 'wps'
			},
			{
				name: '演示',
				value: 'wpp'
			},
			{
				name: '电子表格',
				value: 'et'
			}
		]
	}).then(answers => {
		const cfgPath = 'package.json'
		var cfgData = fsEx.readFileSync(cfgPath)
		var oldCfg = JSON.parse(cfgData)

		var projectCfg = { name: "", addonType: answers.pluginType, version: "1.0.0" }
		for (key in oldCfg)
			projectCfg[key] = oldCfg[key]
		projectCfg.addonType = answers.pluginType
		cfgData = JSON.stringify(projectCfg, "", "\t")
		fsEx.writeFileSync(cfgPath, cfgData)
	})
}

module.exports = (...args) => {
	return join(...args).catch(err => {
		console.error(err)
		if (!process.env.VUE_CLI_TEST) {
			process.exit(1)
		}
	})
}