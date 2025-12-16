const express = require("express")
const router = express.Router()
const db = require("../db")

router.get('/', async (req, res) => {
  const search = req.query.search || '';

  let query = `
    SELECT workouts.*, users.username
    FROM workouts
    JOIN users ON workouts.user_id = users.id
  `;
  const params = [];

  if (search) {
    query +=
      ' WHERE workouts.title LIKE ? OR workouts.description LIKE ? OR users.username LIKE ?';
    const like = `%${search}%`;
    params.push(like, like, like);
  }
  query += ' ORDER BY workouts.created_at DESC';

  const [workouts] = await db.query(query, params);
  res.render('index', { workouts, search });
});

router.get('/about',function(req, res, next){
    res.render('about.ejs')
});

// Export the router object so index.js can access it
module.exports = router