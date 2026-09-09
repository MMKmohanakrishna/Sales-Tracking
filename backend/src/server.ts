import dotenv from "dotenv";
dotenv.config();

import { createApp } from "./app";
import { connectDB } from "./config/db";

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB();
    const app = createApp();
    app.listen(PORT, () => {
      console.log(`[server] Divine Frames API running on port ${PORT}`);
    });
  } catch (err) {
    console.error("[server] Failed to start:", err);
    process.exit(1);
  }
}

start();
