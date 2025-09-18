// src/module/user/controllers/auth.controller.js (versión con JWT)
import { request, response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import AppDatasource from '../providers/datasource.provider.js';
import { User } from '../entities/user.entity.js';

const repo = AppDatasource.getRepository(User);

export const register = async (req = request, res = response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: 'usuario y contraseña son requeridos' });

    const exists = await repo.findOne({ where: { username } });
    if (exists) return res.status(409).json({ message: 'El usuario ya existe' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = repo.create({ username, password: passwordHash });
    await repo.save(user);

    const { password: _, ...safeUser } = user;
    return res.status(201).json({ message: 'Usuario creado', user: safeUser });
  } catch (err) {
    return res.status(500).json({ message: 'Error registrando usuario', error: String(err) });
  }
};

export const login = async (req = request, res = response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: 'usuario y contraseña son requeridos' });

    const user = await repo.findOne({ where: { username } });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ message: 'Contraseña incorrecta' });

    const { password: _, ...safeUser } = user;

    // Emitimos JWT
    const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
    const token = jwt.sign(
      { id: safeUser.id, username: safeUser.username, role: safeUser.role },
      secret,
      { expiresIn: '7d' }
    );

    return res.json({ message: 'Login ok', user: safeUser, token });
  } catch (err) {
    return res.status(500).json({ message: 'Error en login', error: String(err) });
  }
};
