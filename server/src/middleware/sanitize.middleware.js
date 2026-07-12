import { sanitizeBody } from "../utils/security.js";

export const sanitize = (req, res, next) => {
  req.body = sanitizeBody(req.body);
  next();
};
