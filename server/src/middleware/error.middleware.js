import { Prisma } from "@prisma/client";

export const notFoundHandler = (req, res, _next) => {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` });
};

export const errorHandler = (err, req, res, _next) => {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    return res.status(409).json({ message: "Duplicate value violates a unique constraint", details: err.meta });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || "Internal server error",
    details: err.details,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack
  });
};
