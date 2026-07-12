import * as organizationService from "../services/organization.service.js";

export const departments = {
  list: async (req, res) => res.json(await organizationService.listDepartments(req.validated?.query || req.query)),
  get: async (req, res) => res.json(await organizationService.getDepartment(req.params.id)),
  create: async (req, res) => res.status(201).json(await organizationService.createDepartment(req.validated.body)),
  update: async (req, res) => res.json(await organizationService.updateDepartment(req.params.id, req.validated.body)),
  activate: async (req, res) => res.json(await organizationService.setDepartmentStatus(req.params.id, "ACTIVE")),
  deactivate: async (req, res) => res.json(await organizationService.setDepartmentStatus(req.params.id, "INACTIVE")),
  assignHead: async (req, res) =>
    res.json(await organizationService.assignDepartmentHead(req.params.id, req.validated.body.userId))
};

export const categories = {
  list: async (req, res) => res.json(await organizationService.listCategories(req.validated?.query || req.query)),
  get: async (req, res) => res.json(await organizationService.getCategory(req.params.id)),
  create: async (req, res) => res.status(201).json(await organizationService.createCategory(req.validated.body)),
  update: async (req, res) => res.json(await organizationService.updateCategory(req.params.id, req.validated.body)),
  activate: async (req, res) => res.json(await organizationService.setCategoryStatus(req.params.id, "ACTIVE")),
  deactivate: async (req, res) => res.json(await organizationService.setCategoryStatus(req.params.id, "INACTIVE"))
};

export const employees = {
  list: async (req, res) => res.json(await organizationService.listEmployees(req.validated?.query || req.query)),
  get: async (req, res) => res.json(await organizationService.getEmployee(req.params.id)),
  create: async (req, res) => res.status(201).json(await organizationService.createEmployee(req.validated.body)),
  update: async (req, res) => res.json(await organizationService.updateEmployee(req.params.id, req.validated.body)),
  activate: async (req, res) => res.json(await organizationService.setEmployeeStatus(req.params.id, "ACTIVE")),
  deactivate: async (req, res) => res.json(await organizationService.setEmployeeStatus(req.params.id, "INACTIVE"))
};
