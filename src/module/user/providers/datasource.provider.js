// src/module/user/providers/datasource.provider.js
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { User } from '../entities/user.entity.js'; // <- OJO ruta
import { Event } from '../entities/event.entity.js';

dotenv.config();


const AppDatasource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DATABASE,
  synchronize: true,   // ⬅ en dev ok
  logging: false,
  entities: [User, Event],   // ⬅ registrar ambas entidades
});

export default AppDatasource;