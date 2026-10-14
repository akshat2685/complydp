/**
 * Structured JSON logger (Pino). Import from server contexts only.
 *
 * - Level from LOG_LEVEL (default "info").
 * - Pretty-prints only in development (requires the pino-pretty devDependency);
 *   production always emits single-line JSON for log aggregation.
 * - NEVER log secrets: no cookie values, no header values, no admin keys.
 *   The request-log wrapper (withApiLog) logs method/path/status/ms only.
 */
import pino from "pino";

const level = process.env.LOG_LEVEL ?? "info";
const isDev = process.env.NODE_ENV === "development";

function makeLogger() {
  if (isDev) {
    try {
      // Lazy: pino-pretty is a devDependency and may be absent in prod installs.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pretty = require("pino-pretty");
      return pino({ level }, pretty({ colorize: true, singleLine: true }));
    } catch {
      // fall through to plain JSON
    }
  }
  return pino({ level });
}

export const log = makeLogger();
