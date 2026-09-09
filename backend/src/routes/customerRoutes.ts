import { Router } from "express";
import {
  listCustomers,
  createCustomer,
  getCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerLedger,
  getCustomerSales,
  getCustomerPayments,
} from "../controllers/customerController";

const router = Router();

router.get("/", listCustomers);
router.post("/", createCustomer);
router.get("/:id", getCustomer);
router.put("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);
router.get("/:id/ledger", getCustomerLedger);
router.get("/:id/sales", getCustomerSales);
router.get("/:id/payments", getCustomerPayments);

export default router;
