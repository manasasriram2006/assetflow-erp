import * as crud from "../services/crud.service.js";
import * as assetService from "../services/asset.service.js";

export const crudController = (model, searchFields = []) => ({
  list: async (req, res) => res.json(await crud.list(model, req.validated?.query || req.query, searchFields)),
  get: async (req, res) => res.json(await crud.get(model, req.params.id)),
  create: async (req, res) => res.status(201).json(await crud.create(model, req.validated.body)),
  update: async (req, res) => res.json(await crud.update(model, req.params.id, req.validated.body)),
  remove: async (req, res) => res.status(204).json(await crud.remove(model, req.params.id))
});

export const assets = {
  list: async (req, res) => res.json(await assetService.listAssets(req.validated?.query || req.query)),
  get: async (req, res) => res.json(await assetService.getAsset(req.params.id)),
  create: async (req, res) => res.status(201).json(await assetService.createAsset(req.validated.body)),
  update: async (req, res) => res.json(await assetService.updateAsset(req.params.id, req.validated.body)),
  remove: async (req, res) => res.status(204).json(await assetService.deleteAsset(req.params.id))
};
