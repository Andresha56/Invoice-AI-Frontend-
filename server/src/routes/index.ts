import { Router } from "express";
import invoiceRoutes from "./invoice.routes.js";

const router = Router();

router.use("/invoice", invoiceRoutes);

export default router;