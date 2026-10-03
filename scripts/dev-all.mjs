#!/usr/bin/env node

/**
 * SK Baghel Tour & Travels — Localhost Monorepo Runner
 * Starts Backend (port 4000), React Customer (port 5173), and Admin Desk (port 5174).
 * Handles clean shutdown across all children on SIGINT/SIGTERM.
 */

import { spawn } from "node:child_process";

const services = [
  { name: "BACKEND ", cmd: "npm", args: ["--prefix", "backend", "run", "dev"], color: "\x1b[34m" },
  { name: "CUSTOMER", cmd: "npm", args: ["--prefix", "react", "run", "dev"], color: "\x1b[32m" },
  { name: "ADMIN   ", cmd: "npm", args: ["--prefix", "admin", "run", "dev"], color: "\x1b[35m" },
];

const processes = [];

console.log("\x1b[1m\x1b[33m%s\x1b[0m", "Starting SK Baghel Localhost Monorepo Environment...");
console.log("  • Backend API:        http://localhost:4000");
console.log("  • Customer Site:      http://localhost:5173");
console.log("  • Operations Desk:    http://localhost:5174");
console.log("-------------------------------------------------------------\n");

const isWindows = process.platform === "win32";
const npmCmd = isWindows ? "npm.cmd" : "npm";

for (const svc of services) {
  const child = spawn(isWindows ? npmCmd : svc.cmd, svc.args, {
    stdio: ["inherit", "pipe", "pipe"],
    shell: isWindows,
    env: { ...process.env, FORCE_COLOR: "1" },
  });

  child.stdout?.on("data", (data) => {
    process.stdout.write(`${svc.color}[${svc.name}]\x1b[0m ${data}`);
  });

  child.stderr?.on("data", (data) => {
    process.stderr.write(`${svc.color}[${svc.name}]\x1b[0m \x1b[31m${data}\x1b[0m`);
  });

  child.on("exit", (code) => {
    console.log(`${svc.color}[${svc.name}]\x1b[0m exited with code ${code}`);
  });

  processes.push(child);
}

function shutdown() {
  console.log("\nShutting down all services...");
  for (const p of processes) {
    p.kill("SIGTERM");
  }
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
