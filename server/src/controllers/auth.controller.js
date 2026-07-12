import * as authService from "../services/auth.service.js";

export const signup = async (req, res) => {
  const result = await authService.signup(req.validated.body);
  res.status(201).json(result);
};

export const login = async (req, res) => {
  const result = await authService.login(req.validated.body);
  res.json(result);
};

export const refresh = async (req, res) => {
  const result = await authService.refresh(req.validated.body);
  res.json(result);
};

export const me = async (req, res) => {
  res.json({ user: req.user });
};

export const updateProfile = async (req, res) => {
  const result = await authService.updateProfile(req.user.id, req.validated.body);
  res.json(result);
};

export const forgotPassword = async (req, res) => {
  const result = await authService.forgotPassword(req.validated.body);
  res.json(result);
};

export const logout = async (req, res) => {
  res.status(204).send();
};
