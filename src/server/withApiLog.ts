/**
 * API request logging wrapper. Wrap every route handler:
 *
 *   export const GET = withApiLog(GET_impl);
 *
 * Logs one JSON line per API request: request id, method, path, status, ms.
 * Handler throws are logged with the request id (logger.error) and rethrown
 * so Next.js still renders its error boundary / 500. Never logs cookie or
 * header values.
 */
import { randomUUID } from "node:crypto";
import { log } from "./log";

type Handler = (req: Request, ctx?: any) => Promise<Response> | Response;

export function withApiLog<H extends Handler>(handler: H): H {
  const wrapped = async (req: Request, ctx?: any): Promise<Response> => {
    const rid = randomUUID().slice(0, 8);
    const start = Date.now();
    let path = "";
    try {
      path = new URL(req.url).pathname;
    } catch {
      path = "?";
    }
    try {
      const res = await handler(req, ctx);
      log.info(
        { rid, method: req.method, path, status: res.status, ms: Date.now() - start },
        "api request"
      );
      return res;
    } catch (e) {
      log.error(
        {
          rid,
          method: req.method,
          path,
          err: e instanceof Error ? { message: e.message, stack: e.stack } : String(e),
        },
        "api request failed"
      );
      throw e;
    }
  };
  return wrapped as unknown as H;
}
