const fs = require('fs')
const fsEx = require('fs-extra')
const path = require('path')
const chalk = require('chalk');
var cp = require('child_process');
const jsUtil = require('./util.js')
let projectCfg = jsUtil.projectCfg()

//read config
function buildReact(options) {
	cp.execSync("npm run build", { stdio: 'inherit' })
	return path.resolve(process.cwd(), "build");
}

module.exports = (...args) => {
	try {
		return buildReact(...args)
	} catch(err) {
		error(err)
		process.exit(1)
	}
}