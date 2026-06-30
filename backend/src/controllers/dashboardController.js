import {
  getDashboardGraficos,
  getDashboardResumo,
} from "../services/dashboardService.js";

export const obterDashboard = async (_request, response) => {
  try {
    const resumo = await getDashboardResumo();
    response.json(resumo);
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

export const obterGraficosDashboard = async (_request, response) => {
  try {
    const graficos = await getDashboardGraficos();
    response.json(graficos);
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};
