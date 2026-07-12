import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import { env } from "./config/env.js";
import { sanitize } from "./middleware/sanitize.middleware.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import { authRoutes } from "./routes/auth.routes.js";
import { assetRoutes, categoryRoutes, departmentRoutes } from "./routes/resource.routes.js";
import {
  allocationRoutes,
  auditRoutes,
  bookingRoutes,
  maintenanceRoutes,
  transferRoutes
} from "./routes/workflow.routes.js";
import { userRoutes } from "./routes/user.routes.js";
import { reportRoutes } from "./routes/report.routes.js";
import { notificationRoutes } from "./routes/notification.routes.js";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));
app.use(express.json({ limit: "1mb" }));
app.use(sanitize);
app.use(morgan("dev"));

app.get("/health", (req, res) => res.json({ status: "ok", service: "assetflow-api" }));
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/departments", departmentRoutes);
app.use("/categories", categoryRoutes);
app.use("/assets", assetRoutes);
app.use("/allocations", allocationRoutes);
app.use("/transfers", transferRoutes);
app.use("/bookings", bookingRoutes);
app.use("/maintenance", maintenanceRoutes);
app.use("/audits", auditRoutes);
app.use("/reports", reportRoutes);
app.use("/notifications", notificationRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
