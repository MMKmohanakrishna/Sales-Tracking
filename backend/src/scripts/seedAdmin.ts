import dotenv from "dotenv";
dotenv.config();

import readline from "readline";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { User } from "../models/User";
import { BusinessSettings } from "../models/BusinessSettings";

function ask(question: string, hidden = false): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  await connectDB();

  const existing = await User.findOne({ role: "OWNER" });
  if (existing) {
    console.log(`An owner account already exists (${existing.email}). Nothing to do.`);
    await mongoose.disconnect();
    return;
  }

  console.log("No owner account found. Let's create the first Divine Frames owner login.\n");

  const name = (await ask("Owner name [Business Owner]: ")) || "Business Owner";
  const email = (await ask("Login email [owner@divineframes.local]: ")) || "owner@divineframes.local";
  let password = await ask("Password (min 6 chars) [changeme123]: ");
  if (!password) password = "changeme123";
  if (password.length < 6) {
    console.error("Password must be at least 6 characters.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email: email.toLowerCase(), passwordHash, role: "OWNER" });

  const settingsExists = await BusinessSettings.findOne();
  if (!settingsExists) {
    await BusinessSettings.create({ businessName: "Divine Frames", ownerName: name });
  }

  console.log(`\n✓ Owner account created.`);
  console.log(`  Email: ${user.email}`);
  console.log(`  Password: ${password}`);
  console.log(`\nIMPORTANT: change this password after your first login (Settings → Account).`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
