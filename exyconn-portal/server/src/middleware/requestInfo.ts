import type { NextFunction, Request, Response } from 'express';
import { runWithRequestInfo } from '../lib/requestInfo';

/** Opens the request-info store (lib/requestInfo) around the whole request. */
export function requestInfo() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const origin = typeof req.headers.origin === 'string' ? req.headers.origin.slice(0, 200) : '';
    runWithRequestInfo({ actorId: '', actorEmail: '', origin, path: req.path.slice(0, 200) }, next);
  };
}
