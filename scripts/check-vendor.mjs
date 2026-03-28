import { spawnSync } from "node:child_process";

function run(command, args, options = {}) {
    const result = spawnSync(command, args, {
        stdio: "inherit",
        ...options
    });

    if (result.error) {
        throw result.error;
    }

    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

run(process.execPath, ["scripts/sync-vendor.mjs"]);

const diffNames = spawnSync(
    "git",
    ["diff", "--name-only", "--", "assets/vendor", "index.html"],
    { encoding: "utf-8" }
);

if (diffNames.error) {
    throw diffNames.error;
}

const changedFiles = diffNames.stdout
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);

if (changedFiles.length > 0) {
    console.error("");
    console.error("Vendored assets are out of sync.");
    console.error("Changed files:");
    for (const file of changedFiles) {
        console.error(`- ${file}`);
    }
    console.error("");
    console.error("Run 'npm run vendor:sync' locally and commit the updated files.");
    process.exit(1);
}

console.log("Vendored assets are in sync.");