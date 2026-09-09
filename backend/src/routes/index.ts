import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import authRoutes from "./authRoutes";
import customerRoutes from "./customerRoutes";
import productRoutes from "./productRoutes";
import saleRoutes from "./saleRoutes";
import paymentRoutes from "./paymentRoutes";
import outstandingRoutes from "./outstandingRoutes";
import reportRoutes from "./reportRoutes";
import settingsRoutes from "./settingsRoutes";
import exportRoutes from "./exportRoutes";

const router = Router();

router.use("/auth", authRoutes);

// Everything below requires a valid owner session.
router.use("/customers", requireAuth, customerRoutes);
router.use("/frames", requireAuth, productRoutes);
router.use("/sales", requireAuth, saleRoutes);
router.use("/payments", requireAuth, paymentRoutes);
router.use("/outstanding", requireAuth, outstandingRoutes);
router.use("/reports", requireAuth, reportRoutes);
router.use("/settings", requireAuth, settingsRoutes);
router.use("/export", requireAuth, exportRoutes);

export default router;
