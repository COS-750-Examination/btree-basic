/** Error with an HTTP status; thrown from routes and turned into JSON by the error middleware. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

export const notFound = (what = 'Not found') => new HttpError(404, what);

/** Route parameter as a string (Express 5 types widen params once middleware is chained). */
export const param = (
  req: { params: Record<string, string | string[] | undefined> },
  name: string,
): string => String(req.params[name] ?? '');
