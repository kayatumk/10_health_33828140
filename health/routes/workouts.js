const express = require("express")
const router = express.Router()
const db = require("../db")

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

router.get('/workouts', requireLogin, async (req, res) => {
  const [workouts] = await db.query(
    `SELECT workouts.*, users.username
     FROM workouts JOIN users ON workouts.user_id = users.id
     ORDER BY workouts.created_at DESC`
  );
  res.render('workouts', { workouts });
});

router.get('/workouts/new', requireLogin, (req, res) => {
  res.render('workout_form');
});

router.post('/workouts', requireLogin, async (req, res) => {
  const { title, description, difficulty } = req.body;
  const userId = req.session.user.id;

  await db.query(
    'INSERT INTO workouts (user_id, title, description, difficulty) VALUES (?, ?, ?, ?)',
    [userId, title, description, difficulty || 'Medium']
  );
  res.redirect('/workouts');
});

router.get('/workouts/:id', requireLogin, async (req, res) => {
  const workoutId = req.params.id;

  const [[workoutRows], [exerciseRows]] = await Promise.all([
    db.query(
      `SELECT workouts.*, users.username
       FROM workouts JOIN users ON workouts.user_id = users.id
       WHERE workouts.id = ?`,
      [workoutId]
    ),
    db.query(
      `SELECT * FROM exercises
       WHERE workout_id = ?
       ORDER BY id ASC`,
      [workoutId]
    )
  ]);
  
  if (workoutRows.length === 0) {
    return res.status(404).send('Workout not found');
  }

  res.render('workout_detail', {
    workout: workoutRows[0],
    exercises: exerciseRows[0] ? exerciseRows : []
  });
});

router.get('/workouts/:id/exercises/new', requireLogin, async (req, res) => {
  const workoutId = req.params.id;
  const [rows] = await db.query('SELECT * FROM workouts WHERE id = ?', [
    workoutId
  ]);
  if (rows.length === 0) {
    return res.status(404).send('Workout not found');
  }
  res.render('exercise_form', { workout: rows[0], error: null });
});

router.post('/workouts/:id/exercises', requireLogin, async (req, res) => {
  const workoutId = req.params.id;
  const { name, sets, reps } = req.body;

  if (!name || !sets || !reps) {
    const [rows] = await db.query('SELECT * FROM workouts WHERE id = ?', [
      workoutId
    ]);
    return res.render('exercise_form', {
      workout: rows[0],
      error: 'All fields are required.'
    });
  }

  await db.query(
    'INSERT INTO exercises (workout_id, name, sets, reps) VALUES (?, ?, ?, ?)',
    [workoutId, name, parseInt(sets), parseInt(reps)]
  );

  res.redirect('/workouts/' + workoutId);
});

module.exports = router;