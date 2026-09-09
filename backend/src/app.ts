import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import mongoSanitize from "express-mongo-sanitize";
import routes from "./routes";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true,
    })
  );
  // Frame photos are stored as compressed base64 data URIs (resized client-side
  // before upload), so the JSON body limit needs headroom beyond plain form data.
  app.use(express.json({ limit: "8mb" }));
  app.use(mongoSanitize());

  if (process.env.NODE_ENV !== "test") {
    app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
  }

  app.get("/health", (req, res) => res.json({ success: true, message: "OK" }));

  app.use("/api", routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
