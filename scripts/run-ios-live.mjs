import { spawn, spawnSync } from "node:child_process";
import http from "node:http";

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";

const port = Number(process.env.IOS_DEV_PORT ?? 3000);
const host = process.env.IOS_DEV_HOST ?? "127.0.0.1";

let devProcess = null;
let shuttingDown = false;

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

function requestServer(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve(Boolean(res.statusCode && res.statusCode < 500));
    });

    req.on("error", () => resolve(false));
    req.setTimeout(1200, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForServer(url, timeoutMs = 90000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await requestServer(url)) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 600));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function terminateDev() {
  if (!devProcess || devProcess.killed) {
    return;
  }

  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(devProcess.pid), "/f", "/t"], { stdio: "ignore" });
  } else {
    devProcess.kill("SIGTERM");
  }
}

function setupExitHandlers() {
  const onExit = () => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    terminateDev();
    setTimeout(() => process.exit(0), 50);
  };

  process.on("SIGINT", onExit);
  process.on("SIGTERM", onExit);
}

async function run() {
  const url = `http://${host}:${port}`;
  const hasRunningDevServer = await requestServer(url);

  if (!hasRunningDevServer) {
    console.log(`Starting Next dev server on ${url} ...`);
    devProcess = spawn(npmCmd, ["run", "dev", "--", "--webpack", "-p", String(port)], {
      stdio: "inherit",
      env: process.env
    });

    devProcess.on("exit", (code) => {
      if (!shuttingDown) {
        process.exit(code ?? 1);
      }
    });

    await waitForServer(url);
  } else {
    console.log(`Using existing dev server at ${url}.`);
  }

  console.log(`Launching iOS with live reload (${url}) ...`);

  const capArgs = ["cap", "run", "ios", "--live-reload", "--host", host, "--port", String(port)];
  const target = resolveIosTarget();
  if (target) {
    capArgs.push("--target", target);
  } else {
    console.warn("No booted iOS simulator found. Capacitor may prompt for a target.");
  }

  const capExitCode = await new Promise((resolve) => {
    const capProcess = spawn(npxCmd, capArgs, {
      stdio: "inherit",
      env: process.env
    });

    capProcess.on("exit", (code) => resolve(code ?? 1));
  });

  if (capExitCode !== 0) {
    throw new Error(`Capacitor iOS run failed with exit code ${capExitCode}`);
  }

  console.log("iOS launched with live reload. Keep this command running while testing.");

  if (devProcess) {
    await new Promise(() => {});
  }
}

setupExitHandlers();

run().catch((error) => {
  console.error(error.message);
  terminateDev();
  process.exit(1);
});
