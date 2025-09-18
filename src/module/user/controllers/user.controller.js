// src/module/user/controllers/users.controller.js
import { request, response } from 'express';
import bcrypt from 'bcrypt';
import AppDatasource from '../providers/datasource.provider.js';
import { User } from '../entities/user.entity.js';

const repo = AppDatasource.getRepository(User);

export const listUsers = async (_req = request, res = response) => {
  try {
    const users = await repo.find();
    const safe = users.map(({ password, ...u }) => u);
    return res.json(safe);
  } catch (err) {
    return res.status(500).json({ message: 'Error listando usuarios', error: String(err) });
  }
};

export const getUserById = async (req = request, res = response) => {
  try {
    const { id } = req.params;
    const user = await repo.findOne({ where: { id: Number(id) } });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    const { password, ...safeUser } = user;
    return res.json(safeUser);
  } catch (err) {
    return res.status(500).json({ message: 'Error obteniendo usuario', error: String(err) });
  }
};

export const createUser = async (req = request, res = response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: 'username y password son requeridos' });

    const exists = await repo.findOne({ where: { username } });
    if (exists) return res.status(409).json({ message: 'El usuario ya existe' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = repo.create({ username, password: passwordHash });
    await repo.save(user);
    const { password: _, ...safeUser } = user;
    return res.status(201).json(safeUser);
  } catch (err) {
    return res.status(500).json({ message: 'Error creando usuario', error: String(err) });
  }
};

export const updateUser = async (req = request, res = response) => {
  try {
    const { id } = req.params;
    const { username, password } = req.body;

    const user = await repo.findOne({ where: { id: Number(id) } });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    if (username) user.username = username;
    if (password) user.password = await bcrypt.hash(password, 12);

    await repo.save(user);
    const { password: _, ...safeUser } = user;
    return res.json(safeUser);
  } catch (err) {
    return res.status(500).json({ message: 'Error actualizando usuario', error: String(err) });
  }
};

export const resetPassword = async (req = request, res = response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ message: 'Se requiere newPassword' });
    }

    const user = await repo.findOne({ where: { id: Number(id) } });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Hashear y guardar la nueva contraseña
    user.password = await bcrypt.hash(newPassword, 12);
    await repo.save(user);

    return res.json({ message: 'Contraseña restablecida correctamente' });
  } catch (err) {
    return res.status(500).json({ message: 'Error restableciendo contraseña', error: String(err) });
  }
};

export const deleteUser = async (req = request, res = response) => {
  try {
    const { id } = req.params;
    const user = await repo.findOne({ where: { id: Number(id) } });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    await repo.remove(user);
    return res.json({ message: 'Usuario eliminado' });
  } catch (err) {
    return res.status(500).json({ message: 'Error eliminando usuario', error: String(err) });
  }
  
};
