import { spawnSync } from "node:child_process";

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";

function resolveIosTarget() {
  if (process.env.IOS_TARGET) {
    return process.env.IOS_TARGET;
  }

  const result = spawnSync("xcrun", ["simctl", "list", "devices"], {
    encoding: "utf8"
  });

  if (result.status !== 0 || !result.stdout) {
    return null;
  }

  for (const line of result.stdout.split("\n")) {
    if (!line.includes("(Booted)")) {
      continue;
    }

    const match = line.match(/\(([0-9A-F-]{36})\)/i);
    if (match) {
      return match[1];
    }
  }

  return null;
}

function runCommand(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

runCommand(npmCmd, ["run", "cap:sync:release"]);

const capArgs = ["cap", "run", "ios", "--no-sync"];
const target = resolveIosTarget();

if (target) {
  capArgs.push("--target", target);
} else {
  console.warn("No booted iOS simulator found. Capacitor may prompt for a target.");
}

runCommand(npxCmd, capArgs);
