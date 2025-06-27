const express = require('express');
const router = express.Router();
const db = require('../database');

// Login route
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        res.json({
            id: user.id,
            username: user.username,
            role: user.role,
            email: user.email
        });
    });
});

// Get all developers
router.get('/developers', (req, res) => {
    db.all('SELECT id, username FROM users WHERE role = "developer"', (err, developers) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(developers);
    });
});

module.exports = router;