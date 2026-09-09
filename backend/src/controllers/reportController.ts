import { Response } from "express";
import { Sale } from "../models/Sale";
import { Payment } from "../models/Payment";
import { Customer } from "../models/Customer";
import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/apiResponse";
import { AuthedRequest } from "../middleware/auth";
import {
  startOfTodayIST,
  endOfTodayIST,
  startOfWeekIST,
  startOfMonthIST,
  daysAgoIST,
} from "../utils/dateRange";

async function sumSales(from?: Date, to?: Date) {
  const match: any = { isVoided: { $ne: true } };
  if (from || to) {
    match.saleDate = {};
    if (from) match.saleDate.$gte = from;
    if (to) match.saleDate.$lte = to;
  }
  const [agg] = await Sale.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
  ]);
  return { total: agg?.total || 0, count: agg?.count || 0 };
}

async function sumPayments(from?: Date, to?: Date) {
  const match: any = {};
  if (from || to) {
    match.paymentDate = {};
    if (from) match.paymentDate.$gte = from;
    if (to) match.paymentDate.$lte = to;
  }
  const [agg] = await Payment.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  return agg?.total || 0;
}

async function sumFramesSold(from?: Date, to?: Date) {
  const match: any = { isVoided: { $ne: true } };
  if (from || to) {
    match.saleDate = {};
    if (from) match.saleDate.$gte = from;
    if (to) match.saleDate.$lte = to;
  }
  const [agg] = await Sale.aggregate([
    { $match: match },
    { $unwind: "$items" },
    { $group: { _id: null, qty: { $sum: "$items.quantity" } } },
  ]);
  return agg?.qty || 0;
}

export const dashboardReport = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const todayStart = startOfTodayIST();
  const todayEnd = endOfTodayIST();
  const monthStart = startOfMonthIST();

  const [todaySales, todayCollected, monthFramesSold, totalOutstandingAgg, totalCustomers, recentSales, outstandingTop] =
    await Promise.all([
      sumSales(todayStart, todayEnd),
      sumPayments(todayStart, todayEnd),
      sumFramesSold(monthStart, undefined),
      Customer.aggregate([
        { $match: { totalPending: { $gt: 0 }, isActive: true } },
        { $group: { _id: null, total: { $sum: "$totalPending" } } },
      ]),
      Customer.countDocuments({ isActive: true }),
      Sale.find({ isVoided: { $ne: true } })
        .populate("customerId", "name")
        .sort({ saleDate: -1 })
        .limit(8),
      Customer.find({ totalPending: { $gt: 0 }, isActive: true })
        .sort({ totalPending: -1 })
        .limit(5),
    ]);

  ok(res, {
    todaySales: { amount: todaySales.total, count: todaySales.count },
    collectedToday: todayCollected,
    totalOutstanding: totalOutstandingAgg[0]?.total || 0,
    totalCustomers,
    framesSoldThisMonth: monthFramesSold,
    recentSales,
    topOutstanding: outstandingTop,
  });
});

export const salesReport = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const todayStart = startOfTodayIST();
  const todayEnd = endOfTodayIST();
  const weekStart = startOfWeekIST();
  const monthStart = startOfMonthIST();

  const [today, week, month, allTime] = await Promise.all([
    sumSales(todayStart, todayEnd),
    sumSales(weekStart, undefined),
    sumSales(monthStart, undefined),
    sumSales(undefined, undefined),
  ]);

  // Chart data
  const range = String(req.query.range || "7d"); // 7d | 30d | month
  let chartFrom: Date;
  if (range === "30d") chartFrom = daysAgoIST(29);
  else if (range === "month") chartFrom = startOfMonthIST();
  else chartFrom = daysAgoIST(6);

  const chartAgg = await Sale.aggregate([
    { $match: { isVoided: { $ne: true }, saleDate: { $gte: chartFrom } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$saleDate", timezone: "Asia/Kolkata" } },
        total: { $sum: "$totalAmount" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  ok(res, {
    today: today.total,
    thisWeek: week.total,
    thisMonth: month.total,
    allTime: allTime.total,
    chart: chartAgg.map((c) => ({ date: c._id, amount: c.total })),
  });
});

export const paymentsReport = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const todayStart = startOfTodayIST();
  const todayEnd = endOfTodayIST();
  const monthStart = startOfMonthIST();

  const [today, month] = await Promise.all([
    sumPayments(todayStart, todayEnd),
    sumPayments(monthStart, undefined),
  ]);

  ok(res, { collectedToday: today, collectedThisMonth: month });
});

export const topFramesReport = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const from = req.query.from ? new Date(String(req.query.from)) : undefined;
  const to = req.query.to ? new Date(String(req.query.to)) : undefined;

  const match: any = { isVoided: { $ne: true } };
  if (from || to) {
    match.saleDate = {};
    if (from) match.saleDate.$gte = from;
    if (to) match.saleDate.$lte = to;
  }

  const top = await Sale.aggregate([
    { $match: match },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.productId",
        godName: { $first: "$items.godName" },
        frameName: { $first: "$items.frameName" },
        quantitySold: { $sum: "$items.quantity" },
        revenue: { $sum: "$items.subtotal" },
      },
    },
    { $sort: { quantitySold: -1 } },
    { $limit: 10 },
  ]);

  ok(res, top);
});
