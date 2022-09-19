const path = require("path");
const cp = require("child_process");

//read config
function buildReact() {
  cp.execSync("npm run build", { stdio: "inherit" });
  return path.resolve(process.cwd(), "build");
}

module.exports = (...args) => {
  try {
    return buildReact(...args);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
