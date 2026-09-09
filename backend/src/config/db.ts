import mongoose from "mongoose";

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set in environment variables");
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(uri);

  console.log(`[db] MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);

  mongoose.connection.on("error", (err) => {
    console.error("[db] MongoDB connection error:", err);
  });
}
