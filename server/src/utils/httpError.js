export class HttpError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const notFound = (resource = "Resource") => new HttpError(404, `${resource} not found`);
