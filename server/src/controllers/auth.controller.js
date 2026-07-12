import * as authService from "../services/auth.service.js";

export const signup = async (req, res) => {
  const result = await authService.signup(req.validated.body);
  res.status(201).json(result);
};

export const login = async (req, res) => {
  const result = await authService.login(req.validated.body);
  res.json(result);
};

export const me = async (req, res) => {
  res.json({ user: req.user });
};

export const logout = async (req, res) => {
  res.status(204).send();
};
