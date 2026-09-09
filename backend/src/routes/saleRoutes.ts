import { Router } from "express";
import { listSales, createSaleHandler, getSale, updateSaleNotes } from "../controllers/saleController";

const router = Router();

router.get("/", listSales);
router.post("/", createSaleHandler);
router.get("/:id", getSale);
router.put("/:id", updateSaleNotes);

export default router;
