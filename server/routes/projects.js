const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all projects
router.get('/', (req, res) => {
    db.all('SELECT * FROM projects', (err, projects) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(projects);
    });
});

// Get single project
router.get('/:id', (req, res) => {
    db.get('SELECT * FROM projects WHERE id = ?', [req.params.id], (err, project) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.json(project);
    });
});

// Create project
router.post('/', (req, res) => {
    const { name, description, start_date, deadline, status } = req.body;

    db.run(
        'INSERT INTO projects (name, description, start_date, deadline, status) VALUES (?, ?, ?, ?, ?)',
        [name, description, start_date, deadline, status || 'planned'],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            // SQLite provides lastID as this.lastID
            res.status(201).json({
                id: this.lastID,
                name,
                description,
                start_date,
                deadline,
                status: status || 'planned'
            });
        }
    );
});

// Update project
router.put('/:id', (req, res) => {
    const { name, description, start_date, deadline, status } = req.body;

    db.run(
        'UPDATE projects SET name = ?, description = ?, start_date = ?, deadline = ?, status = ? WHERE id = ?',
        [name, description, start_date, deadline, status, req.params.id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'Project not found' });
            }

            res.json({
                id: parseInt(req.params.id),
                name,
                description,
                start_date,
                deadline,
                status
            });
        }
    );
});

// Delete project
router.delete('/:id', (req, res) => {
    db.run('DELETE FROM projects WHERE id = ?', [req.params.id], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.json({ message: 'Project deleted' });
    });
});

module.exports = router;