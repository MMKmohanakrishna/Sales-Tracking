import { Response } from "express";
import { Customer } from "../models/Customer";
import { Sale } from "../models/Sale";
import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/apiResponse";
import { AuthedRequest } from "../middleware/auth";

export const getOutstanding = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const search = String(req.query.search || "").trim();
  const sort = String(req.query.sort || "highest"); // highest | lowest | oldest | newest | name

  const query: any = { totalPending: { $gt: 0 }, isActive: true };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  const customers = await Customer.find(query);

  // Determine oldest pending sale date per customer for "oldest/newest" sorting.
  const customerIds = customers.map((c) => c._id);
  const oldestSaleDates = await Sale.aggregate([
    { $match: { customerId: { $in: customerIds }, pendingAmount: { $gt: 0 }, isVoided: { $ne: true } } },
    { $group: { _id: "$customerId", oldestPendingDate: { $min: "$saleDate" } } },
  ]);
  const dateMap = new Map(oldestSaleDates.map((d) => [d._id.toString(), d.oldestPendingDate]));

  let result = customers.map((c) => ({
    _id: c._id,
    name: c.name,
    phone: c.phone,
    totalPending: c.totalPending,
    oldestPendingDate: dateMap.get(c._id.toString()) || c.createdAt,
  }));

  switch (sort) {
    case "lowest":
      result.sort((a, b) => a.totalPending - b.totalPending);
      break;
    case "oldest":
      result.sort((a, b) => new Date(a.oldestPendingDate).getTime() - new Date(b.oldestPendingDate).getTime());
      break;
    case "newest":
      result.sort((a, b) => new Date(b.oldestPendingDate).getTime() - new Date(a.oldestPendingDate).getTime());
      break;
    case "name":
      result.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "highest":
    default:
      result.sort((a, b) => b.totalPending - a.totalPending);
  }

  const totalOutstanding = result.reduce((sum, c) => sum + c.totalPending, 0);

  ok(res, { customers: result, totalOutstanding: Math.round(totalOutstanding * 100) / 100 });
});
