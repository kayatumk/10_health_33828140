USE workout_app;

INSERT INTO users (username, password_hash) VALUES
('testuser1', '$2b$10$7QJH6G8jFz1Zp1Zp1Zp1uOa'),
('gold', '$2b$10$eKS7RJGO05Iw2TocvAjrvu9KCyE.Pt8OSazBf2fI8S8B4looVkxf.');

INSERT INTO workouts (user_id, title, description, difficulty) VALUES
(1, 'Full Body Workout', 'A comprehensive full body workout.', 'Medium'),
(1, 'Cardio Blast', 'High intensity cardio session.', 'Hard');

INSERT INTO exercises (workout_id, name, sets, reps) VALUES
(1, 'Push Ups', 3, 15),
(1, 'Squats', 3, 20),
(2, 'Jumping Jacks', 4, 30);

INSERT INTO sessions (user_id, workout_id, session_date, duration_minutes, notes) VALUES
(1, 1, '2024-01-15', 45, 'Felt great!'),
(1, 2, '2024-01-17', 30, 'Very intense session.');

INSERT INTO session_exercises (session_id, exercise_id, sets_done, reps_done) VALUES
(1, 1, 3, 15),
(1, 2, 3, 20),
(2, 3, 4, 30);