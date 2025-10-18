// src/module/user/controllers/auth.controller.js (versión con JWT)
import { request, response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import AppDatasource from '../providers/datasource.provider.js';
import { User } from '../entities/user.entity.js';

const repo = AppDatasource.getRepository(User);

export const register = async (req = request, res = response) => {
  try {
    const { username, password, chatId } = req.body; 
    if (!username || !password)
      return res.status(400).json({ message: 'usuario y contraseña son requeridos' });

    const exists = await repo.findOne({ where: { username } });
    if (exists) return res.status(409).json({ message: 'El usuario ya existe' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = repo.create({
      username,
      password: passwordHash,
      chat_id: chatId ? Number(chatId) : null
    });
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

export const registerFromTelegram = async (req = request, res = response) => {
  try {
    const { telegram_id, username } = req.body;
    if (!telegram_id || typeof telegram_id !== 'number') {
      return res.status(400).json({ message: 'telegram_id inválido' });
    }

    // Buscar usuario por chat_id
    let user = await repo.findOne({ where: { chat_id: telegram_id } });

    if (user) {
      // Usuario ya existe, devolvemos siempre password para el bot
      return res.status(200).json({
        message: 'Ya existe el usuario',
        id: user.id,
        username: user.username,
        password: 'Ya creada',
      });
    }

    // Generar username si no existe
    let generatedUsername = username || `tg_${telegram_id}`;

    // Evitar conflicto con username existente
    const existsUsername = await repo.findOne({ where: { username: generatedUsername } });
    if (existsUsername) {
      generatedUsername = `${generatedUsername}_${Math.floor(Math.random() * 1000)}`;
    }

    // Generar contraseña aleatoria
    const generatePassword = (length = 10) => {
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let password = '';
      for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };
    const generatedPassword = generatePassword();

    const passwordHash = await bcrypt.hash(generatedPassword, 12);

    // Crear usuario en DB
    user = repo.create({
      username: generatedUsername,
      password: passwordHash,
      chat_id: telegram_id,
    });
    await repo.save(user);

    return res.status(201).json({
      message: 'Usuario creado desde Telegram',
      id: user.id,
      username: generatedUsername,
      password: generatedPassword,
    });
  } catch (err) {
    console.error('Error registerFromTelegram:', err);
    return res.status(500).json({
      message: 'Error creando usuario desde Telegram',
      error: String(err),
    });
  }
};
