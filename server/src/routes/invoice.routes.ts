import { Router } from "express";
import { generateInvoice } from "../controller/invoice.controller.js";
import { getHealthCheck } from "../controller/health.controller.js";
import { getKnowledgeController } from "../controller/knowledge.controller.js";
const router = Router();

router.post("/generate", generateInvoice)
.get("/health",getHealthCheck)
.get("/knowledge",getKnowledgeController)

export default router;

