import { Router } from "express";
import {
  dashboardReport,
  salesReport,
  paymentsReport,
  topFramesReport,
} from "../controllers/reportController";

const router = Router();

router.get("/dashboard", dashboardReport);
router.get("/sales", salesReport);
router.get("/payments", paymentsReport);
router.get("/top-frames", topFramesReport);

export default router;
