import { AsyncLocalStorage } from "async_hooks";
import fs from "fs";
import path from "path";
import pino from "pino";

type MDC = {
  flagId?: string;
  ruleId?: string;
  flagKey?: string;
  traceId?: string;
  spanId?: string;
};

const asyncLocalStorage = new AsyncLocalStorage<MDC>();

/*
---------------------------------------
Log directory
---------------------------------------
*/

const logDir = path.join(process.cwd(), "logs");

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const readableStream = fs.createWriteStream(
  path.join(logDir, "app.log"),
  { flags: "a" }
);

/*
---------------------------------------
JSON Logger (for machines)
---------------------------------------
*/

const jsonLogger = pino(
  {
    level: process.env.LOG_LEVEL || "info",
  },
  pino.destination({
    dest: path.join(logDir, "app.json.log"),
    sync: false
  })
);

/*
---------------------------------------
MDC
---------------------------------------
*/

export function runWithMDC(context: MDC, fn: () => void) {
  asyncLocalStorage.run(context, fn);
}

export function setMDC(values: Partial<MDC>) {
  const store = asyncLocalStorage.getStore();
  if (!store) return;
  Object.assign(store, values);
}

function getMDC(): MDC {
  return asyncLocalStorage.getStore() || {};
}

/*
---------------------------------------
Caller detection
---------------------------------------
*/

function getCaller(): string {
  const stack = new Error().stack?.split("\n") || [];

  for (const line of stack) {
    if (
      line.includes(".ts") &&
      !line.includes("logger.util") &&
      !line.includes("node_modules")
    ) {
      const match = line.match(/\((.*):(\d+):(\d+)\)/);

      if (!match) continue;

      const file = match[1].split("/").pop();
      const lineNo = match[2];

      return `${file}:${lineNo}`;
    }
  }

  return "unknown";
}

/*
---------------------------------------
Formatting
---------------------------------------
*/

function formatLog(level: string, message: string, data?: any) {
  const time = new Date().toISOString();
  const caller = getCaller();
  const mdc = getMDC();

  const mdcStr = `[flagId=${mdc.flagId ?? ""} ruleId=${mdc.ruleId ?? ""} flagKey=${mdc.flagKey ?? ""}]`;
  const traceStr = `[${mdc.traceId ?? ""} ${mdc.spanId ?? ""}]`;

  const dataStr = data ? JSON.stringify(data) : "";

  return `[${time}] [${level.toUpperCase()}] [${caller}] ${mdcStr} ${message} ${dataStr} ${traceStr}`;
}

/*
---------------------------------------
Writer
---------------------------------------
*/

function write(level: "info" | "debug" | "warn" | "error", message: string, data?: any) {
  const formatted = formatLog(level, message, data);

  /*
  console readable
  */

  console.log(formatted);

  /*
  readable log file
  */

  readableStream.write(formatted + "\n");

  /*
  structured json log
  */

  jsonLogger[level]({
    message,
    data,
    mdc: getMDC(),
    caller: getCaller(),
    timestamp: new Date().toISOString()
  });
}

/*
---------------------------------------
Logger API
---------------------------------------
*/

export default {

  info(message: string, data?: any) {
    write("info", message, data);
  },

  debug(message: string, data?: any) {
    write("debug", message, data);
  },

  warn(message: string, data?: any) {
    write("warn", message, data);
  },

  error(message: string, data?: any) {
    write("error", message, data);
  }

};