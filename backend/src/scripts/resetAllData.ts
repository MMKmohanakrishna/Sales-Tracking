/**
 * FULL DATA RESET
 * ----------------
 * Deletes EVERY customer, frame, sale, and payment.
 * Also resets the sale/payment number counters back to 0, so the next sale
 * you record starts again at DF-000001.
 *
 * Does NOT touch: your owner login (User) or Settings (business name, phone,
 * address, payment methods) — those are left exactly as they are.
 *
 * This is irreversible. Requires typing CONFIRM to proceed.
 *
 * Usage: npm run reset:data
 */
import dotenv from "dotenv";
dotenv.config();

import readline from "readline";
import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { Customer } from "../models/Customer";
import { Product } from "../models/Product";
import { Sale } from "../models/Sale";
import { Payment } from "../models/Payment";
import { Counter } from "../models/Counter";

function ask(question: string): Promise<string> {
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

  const [customerCount, productCount, saleCount, paymentCount] = await Promise.all([
    Customer.countDocuments(),
    Product.countDocuments(),
    Sale.countDocuments(),
    Payment.countDocuments(),
  ]);

  console.log("\nThis will PERMANENTLY delete:");
  console.log(`  ${customerCount} customers`);
  console.log(`  ${productCount} photo frames`);
  console.log(`  ${saleCount} sales`);
  console.log(`  ${paymentCount} payments`);
  console.log("\nYour login and business settings will NOT be touched.");
  console.log("This cannot be undone.\n");

  const answer = await ask('Type "CONFIRM" (all caps) to proceed, or anything else to cancel: ');

  if (answer !== "CONFIRM") {
    console.log("\nCancelled. Nothing was deleted.");
    await mongoose.disconnect();
    return;
  }

  await Promise.all([
    Customer.deleteMany({}),
    Product.deleteMany({}),
    Sale.deleteMany({}),
    Payment.deleteMany({}),
    Counter.deleteMany({}), // resets DF-000001 / PAY-000001 numbering
  ]);

  console.log("\n✓ All customers, frames, sales, and payments have been deleted.");
  console.log("  Your login and business settings are untouched.");
  console.log("  Next sale will be numbered DF-000001 again.\n");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
