const fs = require("fs");
const path = require("path");

const packageJsonPath = path.join(__dirname, "package.json");

fs.readFile(packageJsonPath, "utf8", (err, data) => {
  if (err) {
    return process.exit(1);
  }

  const packageJson = JSON.parse(data);

  // Check if the dependency is present
  const dependency = "@react-native-async-storage/async-storage";
  const isPresent =
    packageJson.dependencies[dependency] ||
    packageJson.devDependencies[dependency] ||
    packageJson.peerDependencies[dependency];

  if (isPresent) return;

  console.error(`Error: The peer dependency "${dependency}" is missing.`);
  return process.exit(1);
});
