import { Router } from "express";
import {
  obterDashboard,
  obterGraficosDashboard,
} from "../controllers/dashboardController.js";

const router = Router();

router.get("/", obterDashboard);
router.get("/graficos", obterGraficosDashboard);

export default router;
