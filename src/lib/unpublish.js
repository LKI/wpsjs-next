const fs = require('fs')
const path = require('path')
const fsEx = require('fs-extra')
const jsUtil = require('./util.js')
const chalk = require('chalk')

let projectCfg = jsUtil.projectCfg()
const publishDirectory = "wps-addon-publish"

async function unpublish() {
	let curDir = process.cwd()
	let buildRoot = path.resolve(curDir, publishDirectory)
	fsEx.removeSync(buildRoot)

	let publishList = {}
	let publishListPath = path.resolve(__dirname, 'publishlist.json');
	if (fs.existsSync(publishListPath)) {
		publishList = require(publishListPath)
	}
	delete publishList[projectCfg.name]

	let publishData = JSON.stringify(publishList)
	fs.writeFileSync(publishListPath, publishData)

	let outList = []
	for (let item in publishList) {
		outList.push(publishList[item])
	}
	let outData = JSON.stringify(outList)
	fsEx.ensureDirSync(buildRoot)
	let pubHtmlName = 'publish.html'
	let pubHtmlPath = path.resolve(__dirname, 'res', pubHtmlName)
	let pubHtml = fs.readFileSync(pubHtmlPath, 'utf-8')
	pubHtml = pubHtml.replace(/PUBLISH_REPLACE_STRING/, outData)
	let outHtmlPath = path.resolve(buildRoot, pubHtmlName)
	fs.writeFileSync(outHtmlPath, pubHtml);

	console.log(chalk.cyan(`\n==>>  生成发布文件成功。请将目录${publishDirectory}下的静态网页部署到服务器...`))
}

module.exports = (...args) => {
	return unpublish(...args).catch(err => {
		console.error(err)
		if (!process.env.VUE_CLI_TEST) {
			process.exit(1)
		}
	})
}