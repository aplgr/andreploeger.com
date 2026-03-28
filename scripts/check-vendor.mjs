import { spawnSync } from "node:child_process";

function run(command, args) {
    const result = spawnSync(command, args, {
        stdio: "inherit"
    });

    if (result.error) {
        throw result.error;
    }

    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

run(process.execPath, ["scripts/sync-vendor.mjs"]);

const diff = spawnSync("git", ["diff", "--quiet", "--", "assets/vendor", "index.html"], {
    stdio: "inherit"
});

if (diff.error) {
    throw diff.error;
}

if (diff.status !== 0) {
    console.error("");
    console.error("Vendored assets are out of sync.");
    console.error("Run 'npm install' or 'npm run vendor:sync' and commit the updated files.");
    process.exit(diff.status ?? 1);
}

console.log("Vendored assets are in sync.");
