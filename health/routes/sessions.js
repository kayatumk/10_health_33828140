const express = require("express")
const router = express.Router()
const db = require("../db")

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

router.get('/sessions', requireLogin, async (req, res) => {
  const userId = req.session.user.id;

  const [rows] = await db.query(
    `SELECT
        s.id AS session_id,
        s.session_date,
        s.duration_minutes,
        s.notes,
        w.title AS workout_title,
        se.sets_done,
        se.reps_done,
        e.name AS exercise_name
     FROM sessions s
     JOIN workouts w ON s.workout_id = w.id
     LEFT JOIN session_exercises se ON se.session_id = s.id
     LEFT JOIN exercises e ON se.exercise_id = e.id
     WHERE s.user_id = ?
     ORDER BY s.session_date DESC, s.id DESC, se.id ASC`,
    [userId]
  );

  // group by session_id for easier rendering
  const sessionsMap = new Map();
  for (const row of rows) {
    if (!sessionsMap.has(row.session_id)) {
      sessionsMap.set(row.session_id, {
        id: row.session_id,
        session_date: row.session_date,
        duration_minutes: row.duration_minutes,
        notes: row.notes,
        workout_title: row.workout_title,
        exercises: []
      });
    }
    if (row.exercise_name) {
      sessionsMap.get(row.session_id).exercises.push({
        name: row.exercise_name,
        sets_done: row.sets_done,
        reps_done: row.reps_done
      });
    }
  }

  const sessions = Array.from(sessionsMap.values());
  res.render('sessions', { sessions });
});

router.get('/sessions/new', requireLogin, async (req, res) => {
  const [workouts] = await db.query(
    'SELECT id, title FROM workouts ORDER BY created_at DESC'
  );
  res.render('sessions_form', { workouts });
});

router.post('/sessions', requireLogin, async (req, res) => {
  const userId = req.session.user.id;
  const { workout_id, session_date, duration_minutes, notes } = req.body;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO sessions (user_id, workout_id, session_date, duration_minutes, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        workout_id,
        session_date,
        duration_minutes || null,
        notes || null
      ]
    );

    const sessionId = result.insertId;

    // fetch exercises for that workout and mirror them into session_exercises
    const [exercises] = await conn.query(
      'SELECT id, sets, reps FROM exercises WHERE workout_id = ?',
      [workout_id]
    );

    for (const ex of exercises) {
      await conn.query(
        `INSERT INTO session_exercises (session_id, exercise_id, sets_done, reps_done)
         VALUES (?, ?, ?, ?)`,
        [sessionId, ex.id, ex.sets, ex.reps]
      );
    }

    await conn.commit();
    res.redirect('/sessions');
  } catch (err) {
    console.error(err);
    await conn.rollback();
    res.status(500).send('Error saving session');
  } finally {
    conn.release();
  }
});

// Export the router object so index.js can access it
module.exports = router;