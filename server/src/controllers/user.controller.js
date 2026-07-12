import * as organizationService from "../services/organization.service.js";

export const listUsers = async (req, res) => {
  res.json(await organizationService.listEmployees(req.validated?.query || req.query));
};

export const promoteUser = async (req, res) => {
  res.json(await organizationService.updateEmployee(req.params.id, { role: req.validated.body.role }));
};

export const getUser = async (req, res) => res.json(await organizationService.getEmployee(req.params.id));

export const createUser = async (req, res) =>
  res.status(201).json(await organizationService.createEmployee(req.validated.body));

export const updateUser = async (req, res) =>
  res.json(await organizationService.updateEmployee(req.params.id, req.validated.body));

export const activateUser = async (req, res) =>
  res.json(await organizationService.setEmployeeStatus(req.params.id, "ACTIVE"));

export const deactivateUser = async (req, res) =>
  res.json(await organizationService.setEmployeeStatus(req.params.id, "INACTIVE"));
