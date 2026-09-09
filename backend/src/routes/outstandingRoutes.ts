import { Router } from "express";
import { getOutstanding } from "../controllers/outstandingController";

const router = Router();

router.get("/", getOutstanding);

export default router;
