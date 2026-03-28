import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const mappings = [
    {
        type: "file",
        from: "node_modules/bootstrap/dist/css/bootstrap.min.css",
        to: "assets/vendor/bootstrap/css/bootstrap.min.css"
    },
    {
        type: "file",
        from: "node_modules/bootstrap/dist/js/bootstrap.bundle.min.js",
        to: "assets/vendor/bootstrap/js/bootstrap.bundle.min.js"
    },
    {
        type: "file",
        from: "node_modules/bootstrap-icons/font/bootstrap-icons.css",
        to: "assets/vendor/bootstrap-icons/bootstrap-icons.css"
    },
    {
        type: "dir",
        from: "node_modules/bootstrap-icons/font/fonts",
        to: "assets/vendor/bootstrap-icons/fonts"
    },
    {
        type: "file",
        from: "node_modules/aos/dist/aos.css",
        to: "assets/vendor/aos/aos.css"
    },
    {
        type: "file",
        from: "node_modules/aos/dist/aos.js",
        to: "assets/vendor/aos/aos.js"
    },
    {
        type: "file",
        from: "node_modules/waypoints/lib/noframework.waypoints.js",
        to: "assets/vendor/waypoints/noframework.waypoints.js"
    },
    {
        type: "file",
        from: "node_modules/imagesloaded/imagesloaded.pkgd.min.js",
        to: "assets/vendor/imagesloaded/imagesloaded.pkgd.min.js"
    },
    {
        type: "file",
        from: "node_modules/isotope-layout/dist/isotope.pkgd.min.js",
        to: "assets/vendor/isotope-layout/isotope.pkgd.min.js"
    },
    {
        type: "file",
        from: "node_modules/htmx.org/dist/htmx.min.js",
        to: "assets/vendor/htmx/htmx.min.js"
    },
    {
        type: "file",
        from: "node_modules/htmx.org/dist/ext/json-enc.js",
        to: "assets/vendor/htmx/ext/json-enc.js"
    },
    {
        type: "file",
        from: "node_modules/alpinejs/dist/cdn.min.js",
        to: "assets/vendor/alpinejs/cdn.min.js"
    }
];

function ensureDir(dirPath) {
    fs.mkdirSync(dirPath, { recursive: true });
}

function copyFile(relativeFrom, relativeTo) {
    const from = path.join(root, relativeFrom);
    const to = path.join(root, relativeTo);

    if (!fs.existsSync(from)) {
        throw new Error(`Source file does not exist: ${relativeFrom}`);
    }

    ensureDir(path.dirname(to));
    fs.copyFileSync(from, to);
    console.log(`Copied file: ${relativeFrom} -> ${relativeTo}`);
}

function copyDir(relativeFrom, relativeTo) {
    const from = path.join(root, relativeFrom);
    const to = path.join(root, relativeTo);

    if (!fs.existsSync(from)) {
        throw new Error(`Source directory does not exist: ${relativeFrom}`);
    }

    ensureDir(to);

    for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
        const sourceEntry = path.join(relativeFrom, entry.name);
        const targetEntry = path.join(relativeTo, entry.name);

        if (entry.isDirectory()) {
            copyDir(sourceEntry, targetEntry);
        } else {
            copyFile(sourceEntry, targetEntry);
        }
    }
}

for (const mapping of mappings) {
    if (mapping.type === "file") {
        copyFile(mapping.from, mapping.to);
    } else if (mapping.type === "dir") {
        copyDir(mapping.from, mapping.to);
    } else {
        throw new Error(`Unsupported mapping type: ${mapping.type}`);
    }
}
