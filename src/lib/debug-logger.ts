import fs from "fs";
import path from "path";

export function debugLog(message: string, error?: any) {
  const logDir = path.join(process.cwd(), "logs");
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }
  
  const logFile = path.join(logDir, "debug.log");
  const timestamp = new Date().toISOString();
  const errorMsg = error ? `\nError: ${error.stack || error}` : "";
  const logEntry = `[${timestamp}] ${message}${errorMsg}\n\n`;
  
  fs.appendFileSync(logFile, logEntry);
}
