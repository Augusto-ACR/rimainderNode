// ./src/module/user/entities/user.entity.js
import { EntitySchema } from 'typeorm';

export const User = new EntitySchema({
  name: 'User',
  tableName: 'users',
  columns: {
    id: { type: 'int', primary: true, generated: true },
    username: { type: String, length: 50, unique: true },
    // si tu columna real es password_hash, cambiá el nombre:
    password: { type: String, length: 255 },
    role: { type: String, length: 20, default: 'user' },
    created_at: { type: 'timestamp', createDate: true },
    chat_id: { type: 'bigint', nullable: true },
  },
  indices: [{ name: 'IDX_USERS_USERNAME', columns: ['username'], unique: true }],
});
