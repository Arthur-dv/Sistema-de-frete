import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import { initDatabase, queryOne, runSql } from './database';

async function seed() {
  await initDatabase();

  const adminEmail = 'admin@sistema.com';
  const adminPassword = 'admin123';

  const existing = queryOne('SELECT id FROM users WHERE email = ?', [adminEmail]);
  if (!existing) {
    const hash = bcrypt.hashSync(adminPassword, 12);
    runSql(
      'INSERT INTO users (name, email, password_hash, role, placa) VALUES (?, ?, ?, ?, ?)',
      ['Administrador', adminEmail, hash, 'admin', '']
    );
    console.log('Admin criado com sucesso!');
    console.log(`Email: ${adminEmail}`);
    console.log(`Senha: ${adminPassword}`);
  } else {
    console.log('Admin já existe.');
  }
}

seed().catch(console.error);
