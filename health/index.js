require('dotenv').config();

// Setup express and ejs
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const db = require('./db');

// Create the express application object
const app = express()
const port = process.env.PORT || 8000;

// Tell Express that we want to use EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));

app.use(
  session({
    secret: 'super-secret',
    resave: false,
    saveUninitialized: false
  })
);

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

// Load the route handlers
const mainRoutes = require("./routes/main");  
app.use('/', mainRoutes);

const userRoutes = require("./routes/users");  
app.use('/', userRoutes);

const workoutRoutes = require("./routes/workouts");  
app.use('/', workoutRoutes);

const sessionRoutes = require("./routes/sessions");  
app.use('/', sessionRoutes);

// Start the web app listening
app.listen(port, () => console.log(`Example app listening on port ${port}!`))
