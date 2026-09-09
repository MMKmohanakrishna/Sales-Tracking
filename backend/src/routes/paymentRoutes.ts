import { Router } from "express";
import { listPayments, createPayment, getPayment } from "../controllers/paymentController";

const router = Router();

router.get("/", listPayments);
router.post("/", createPayment);
router.get("/:id", getPayment);

export default router;
