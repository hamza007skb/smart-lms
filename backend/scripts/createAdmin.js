require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
(async () => {
  const {
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
    ADMIN_NAME = 'Administrator'
  } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12) throw Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters)');
  await mongoose.connect(process.env.MONGO_URI);
  if (await User.exists({
    email: ADMIN_EMAIL.toLowerCase()
  })) throw Error('Email already exists; no account was changed');
  await User.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    password: await bcrypt.hash(ADMIN_PASSWORD, 12),
    role: 'admin'
  });
  console.log('Administrator created');
})().catch(e => {
  console.error(e.message);
  process.exitCode = 1;
}).finally(() => mongoose.disconnect());
