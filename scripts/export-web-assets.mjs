import { existsSync, mkdirSync, renameSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const projectRoot = process.cwd();
const apiDir = join(projectRoot, "app", "api");
const backupRoot = join(projectRoot, ".export-backup");
const backupDir = join(backupRoot, "api");

if (existsSync(backupDir)) {
  throw new Error(`Backup directory already exists: ${backupDir}`);
}

const hadApiRoutes = existsSync(apiDir);

try {
  if (hadApiRoutes) {
    mkdirSync(backupRoot, { recursive: true });
    renameSync(apiDir, backupDir);
  }

  const build = spawnSync("npx", ["next", "build"], {
    cwd: projectRoot,
    env: {
      ...process.env,
      NEXT_STATIC_EXPORT: "1"
    },
    stdio: "inherit"
  });

  if (build.status !== 0) {
    throw new Error(`Static export build failed with exit code ${build.status ?? "unknown"}`);
  }

  const outIndex = join(projectRoot, "out", "index.html");
  if (!existsSync(outIndex)) {
    throw new Error("Expected out/index.html after export build, but it was not found.");
  }

  const html = readFileSync(outIndex, "utf8");
  if (html.includes("Latent web assets placeholder")) {
    throw new Error("Export produced placeholder assets. Aborting.");
  }

  console.log("Web assets exported successfully to out/.");
} finally {
  if (hadApiRoutes && existsSync(backupDir)) {
    renameSync(backupDir, apiDir);
  }
}
