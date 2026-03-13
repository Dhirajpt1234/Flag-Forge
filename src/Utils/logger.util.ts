import fs from "fs";
import path from "path";
import pino from "pino";

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
JSON Logger (for machines)
---------------------------------------
*/

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

  const dataStr = data ? JSON.stringify(data) : "";

  return `[${time}] [${level.toUpperCase()}] [${caller}] ${message} ${dataStr}`;
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