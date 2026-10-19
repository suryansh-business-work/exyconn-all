import type { Request, Response } from "express";

/** A request carrying only a JSON body, which is all the controllers read. */
export function fakeRequest(body: unknown): Request {
  return { body } as Request;
}

/** Hands a stub with the response methods a test needs to a controller. */
export function asResponse<T extends object>(stub: T): Response & T {
  return stub as unknown as Response & T;
}
