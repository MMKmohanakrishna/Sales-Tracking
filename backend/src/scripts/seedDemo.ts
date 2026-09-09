/**
 * DEVELOPMENT/DEMO DATA SEEDER
 * ----------------------------
 * Populates the database with clearly-fake sample customers, frames, sales
 * and payments so the dashboard and reports can be exercised immediately.
 * Never run this against a production database.
 *
 * Usage: npm run seed:demo
 */
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { Customer } from "../models/Customer";
import { Product } from "../models/Product";
import { BusinessSettings } from "../models/BusinessSettings";
import { createSale } from "../services/saleService";
import { recordPayment } from "../services/paymentService";

async function main() {
  if (process.env.NODE_ENV === "production") {
    console.error("Refusing to seed demo data in production.");
    process.exit(1);
  }

  await connectDB();

  const existingSettings = await BusinessSettings.findOne();
  if (!existingSettings) {
    await BusinessSettings.create({ businessName: "Divine Frames" });
  }

  console.log("Seeding demo customers...");
  const customerNames = [
    { name: "Ramesh Kumar", phone: "9876543210", address: "Jayanagar, Bengaluru" },
    { name: "Suresh", phone: "9876500001", address: "Malleshwaram, Bengaluru" },
    { name: "Lakshmi", phone: "9876500002", address: "Basavanagudi, Bengaluru" },
    { name: "Krishna", phone: "9876500003", address: "Indiranagar, Bengaluru" },
    { name: "Anitha", phone: "9876500004", address: "Whitefield, Bengaluru" },
  ];
  const customers: InstanceType<typeof Customer>[] = [];
  for (const c of customerNames) {
    let customer = await Customer.findOne({ phone: c.phone });
    if (!customer) customer = await Customer.create({ ...c, notes: "[DEMO DATA]" });
    customers.push(customer);
  }

  console.log("Seeding demo frames...");
  const frameDefs = [
    { godName: "Lord Venkateswara", frameName: "Venkateswara Golden Frame", size: "12x18 inch", sellingPrice: 1200, costPrice: 700 },
    { godName: "Lord Shiva", frameName: "Shiva Classic Frame", size: "12x18 inch", sellingPrice: 1000, costPrice: 600 },
    { godName: "Lord Ganesha", frameName: "Ganesha Blessing Frame", size: "10x14 inch", sellingPrice: 800, costPrice: 450 },
    { godName: "Goddess Lakshmi", frameName: "Lakshmi Prosperity Frame", size: "12x18 inch", sellingPrice: 950, costPrice: 550 },
    { godName: "Lord Hanuman", frameName: "Hanuman Strength Frame", size: "10x14 inch", sellingPrice: 750, costPrice: 400 },
    { godName: "Sai Baba", frameName: "Sai Baba Serenity Frame", size: "12x16 inch", sellingPrice: 900, costPrice: 500 },
    { godName: "Lord Krishna", frameName: "Krishna Flute Frame", size: "12x18 inch", sellingPrice: 1100, costPrice: 650 },
    { godName: "Lord Rama", frameName: "Rama Darbar Frame", size: "14x20 inch", sellingPrice: 1500, costPrice: 900 },
    { godName: "Durga Devi", frameName: "Durga Shakti Frame", size: "12x18 inch", sellingPrice: 1050, costPrice: 600 },
  ];
  const products: InstanceType<typeof Product>[] = [];
  for (const f of frameDefs) {
    let product = await Product.findOne({ frameName: f.frameName });
    if (!product) product = await Product.create({ ...f, description: "[DEMO DATA]" });
    products.push(product);
  }

  console.log("Seeding demo sales & payments...");
  // Sale 1: fully paid
  const sale1 = await createSale({
    customerId: customers[0]._id.toString(),
    items: [{ productId: products[0]._id.toString(), quantity: 2 }],
    paidAmount: products[0].sellingPrice * 2,
    paymentMethod: "CASH",
    notes: "[DEMO DATA] Fully paid sale",
  });

  // Sale 2: partially paid
  await createSale({
    customerId: customers[1]._id.toString(),
    items: [{ productId: products[1]._id.toString(), quantity: 1 }],
    paidAmount: 500,
    paymentMethod: "UPI",
    notes: "[DEMO DATA] Partially paid sale",
  });

  // Sale 3: pending (no payment)
  await createSale({
    customerId: customers[2]._id.toString(),
    items: [{ productId: products[2]._id.toString(), quantity: 1 }],
    paidAmount: 0,
    paymentMethod: "CASH",
    notes: "[DEMO DATA] Pending sale",
  });

  // Sale 4: multi-item, partially paid, then a later payment recorded
  const sale4 = await createSale({
    customerId: customers[3]._id.toString(),
    items: [
      { productId: products[3]._id.toString(), quantity: 1 },
      { productId: products[4]._id.toString(), quantity: 2 },
    ],
    paidAmount: 1000,
    paymentMethod: "BANK_TRANSFER",
    notes: "[DEMO DATA] Multi-item sale",
  });
  if (sale4) {
    await recordPayment({
      customerId: customers[3]._id.toString(),
      saleId: sale4._id.toString(),
      amount: 500,
      paymentMethod: "CASH",
      notes: "[DEMO DATA] Follow-up payment",
    });
  }

  // Sale 5: fully paid
  await createSale({
    customerId: customers[4]._id.toString(),
    items: [{ productId: products[5]._id.toString(), quantity: 1 }],
    paidAmount: products[5].sellingPrice,
    paymentMethod: "UPI",
    notes: "[DEMO DATA] Fully paid",
  });

  console.log("\n✓ Demo data seeded successfully.");
  console.log("  5 customers, 9 frames, 5 sales (paid / partial / pending mix).");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
