const inquirer = require('inquirer')
const fs = require('fs')
const fsEx = require('fs-extra')
const path = require('path')
var builder = require('xmlbuilder');
const _7z = require('7zip-min');
const jsUtil = require('./util.js')
let projectCfg = jsUtil.projectCfg()
const chalk = require('chalk')

const buildDirectory = jsUtil.GetBuildDir()

async function build() {
    inquirer.prompt({
        name: 'pluginType',
        type: 'list',
        message: `选择 WPS 加载项发布类型:`,
        choices: [{
                name: '在线插件',
                value: 'online'
            },
            {
                name: '离线插件',
                value: 'offline'
            }
        ]
    }).then(answers => {
        buildWithArgs(answers)
    })
}

async function buildWithArgs(answers) {
    let debugTemp = jsUtil.GetDebugTempPath(true);
    fsEx.removeSync(debugTemp)

    let curDir = process.cwd()
    let buildDir = curDir
    if (projectCfg.scripts && typeof projectCfg.scripts.build == 'string') {
        let buildCmd = projectCfg.scripts.build.trim();
        if (buildCmd.includes("vue-cli-service")) {
            buildDir = require('./buildvue')(answers)
        } else if (buildCmd.includes("react-scripts")) {
            buildDir = require('./buildreact')(answers)
        }
    }
    let publishRoot = path.resolve(curDir, jsUtil.GetPublishDir());
    fsEx.removeSync(publishRoot);
    let buildRoot = path.resolve(curDir, buildDirectory);
    let distPath = buildRoot
    if (answers.pluginType == "offline")
        distPath = path.resolve(buildRoot, `${projectCfg.name}_${projectCfg.version}`)
    fsEx.removeSync(buildRoot)
    fs.readdir(buildDir, (_, files) => {
        files.forEach(file => {
            if (file != buildDirectory && file != "node_modules" &&
                file != ".vscode" && file != ".git" &&
                file != "package.json" && file != "package-lock.json") {
                const srcPath = path.resolve(buildDir, file)
                fsEx.copySync(srcPath, path.resolve(distPath, file))
            }
        })

        if (answers.pluginType == "offline") {
            let path7z = path.resolve(buildRoot, `${projectCfg.name}.7z`)
            _7z.pack(distPath, path7z, err => {
                fsEx.removeSync(distPath)
            })
        }
    })

    console.log(chalk.cyan(`\n==>>  编译成功。请将目录${buildDirectory}下的文件署到服务器...`))
}

module.exports = {
    build,
    buildWithArgs
}