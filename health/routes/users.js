const express = require("express")
const router = express.Router()
const bcrypt = require('bcryptjs');
const saltRounds = 10;
const { check, validationResult } = require('express-validator');
const db = require("../db")

router.get('/register', (req, res) => {
  res.render('register', { error: null });
});

router.post('/register', async (req, res) => {
  const { username, password, confirmPassword } = req.body;

  if (!username || !password || !confirmPassword) {
    return res.render('register', { error: 'All fields are required.' });
  }
  if (password !== confirmPassword) {
    return res.render('register', { error: 'Passwords do not match.' });
  }

  try {
    const [existing] = await db.query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    if (existing.length > 0) {
      return res.render('register', { error: 'Username already taken.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      [username, hash]
    );

    req.session.user = { id: result.insertId, username };
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.render('register', { error: 'Something went wrong.' });
  }
});

router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.render('login', { error: 'Please enter username and password.' });
  }

  try {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    if (rows.length === 0) {
      return res.render('login', { error: 'Invalid username or password.' });
    }
    const user = rows[0];

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.render('login', { error: 'Invalid username or password.' });
    }

    req.session.user = { id: user.id, username: user.username };
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.render('login', { error: 'Something went wrong.' });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;