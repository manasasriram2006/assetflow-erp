import * as reportService from "../services/report.service.js";

export const dashboard = async (req, res) => {
  res.json(await reportService.dashboard());
};

export const csv = async (req, res) => {
  res.header("Content-Type", "text/csv");
  res.attachment("assetflow-assets.csv");
  res.send(await reportService.csv());
};
