import { Request, Response, NextFunction } from "express";
import { runWithMDC, setMDC } from "../Utils/logger.util";
import { randomUUID } from "crypto";

export function mdcMiddleware(req: Request, res: Response, next: NextFunction) {
  const traceId = randomUUID();
  const spanId = randomUUID();

  runWithMDC(
    {
      traceId,
      spanId,
    },
    () => {

      /*
      Extract flagKey from URL
      */

      const flagKey = req.params.flagKey as string;

      if (flagKey) {
        setMDC({ flagKey });
      }

      /*
      Extract ruleId from params/query/body
      */

      const ruleId =
        req.params.ruleId ||
        req.query.ruleId ||
        req.body?.ruleId;

      if (ruleId) {
        setMDC({ ruleId: String(ruleId) });
      }

      next();
    }
  );
}