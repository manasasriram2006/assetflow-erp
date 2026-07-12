import * as reportService from "../services/report.service.js";

export const dashboard = async (req, res) => {
  res.json(await reportService.dashboard(req.user.id));
};

export const reports = async (req, res) => {
  res.json(await reportService.reports());
};

export const csv = async (req, res) => {
  res.header("Content-Type", "text/csv");
  res.attachment("assetflow-assets.csv");
  res.send(await reportService.csv());
};

export const reportsCsv = async (req, res) => {
  res.header("Content-Type", "text/csv");
  res.attachment("assetflow-reports.csv");
  res.send(await reportService.reportsCsv());
};
