import { Router } from "express";
import {
  exportCustomersCSV,
  exportSalesCSV,
  exportPaymentsCSV,
} from "../controllers/exportController";

const router = Router();

router.get("/customers.csv", exportCustomersCSV);
router.get("/sales.csv", exportSalesCSV);
router.get("/payments.csv", exportPaymentsCSV);

export default router;
