const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all tasks
router.get('/', (req, res) => {
    const query = `
        SELECT t.*, p.name as project_name, u.username as assigned_to_name
        FROM tasks t
                 LEFT JOIN projects p ON t.project_id = p.id
                 LEFT JOIN users u ON t.assigned_to = u.id
    `;

    db.all(query, (err, tasks) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(tasks);
    });
});

// Get tasks by developer
router.get('/developer/:id', (req, res) => {
    const query = `
        SELECT t.*, p.name as project_name
        FROM tasks t
                 LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.assigned_to = ?
    `;

    db.all(query, [req.params.id], (err, tasks) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(tasks);
    });
});

// Get tasks by project
router.get('/project/:id', (req, res) => {
    const query = `
        SELECT t.*, u.username as assigned_to_name
        FROM tasks t
                 LEFT JOIN users u ON t.assigned_to = u.id
        WHERE t.project_id = ?
    `;

    db.all(query, [req.params.id], (err, tasks) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(tasks);
    });
});

// Get single task
router.get('/:id', (req, res) => {
    db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id], (err, task) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json(task);
    });
});

// Create task
router.post('/', (req, res) => {
    const { project_id, title, description, assigned_to, due_date, priority, status } = req.body;

    db.run(
        'INSERT INTO tasks (project_id, title, description, assigned_to, due_date, priority, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [project_id, title, description, assigned_to, due_date, priority || 'medium', status || 'to do'],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            res.status(201).json({
                id: this.lastID,
                project_id,
                title,
                description,
                assigned_to,
                due_date,
                priority: priority || 'medium',
                status: status || 'to do'
            });
        }
    );
});

// Update task
router.put('/:id', (req, res) => {
    const { project_id, title, description, assigned_to, status, due_date, priority } = req.body;

    db.run(
        'UPDATE tasks SET project_id = ?, title = ?, description = ?, assigned_to = ?, status = ?, due_date = ?, priority = ? WHERE id = ?',
        [project_id, title, description, assigned_to, status, due_date, priority, req.params.id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'Task not found' });
            }

            res.json({
                id: parseInt(req.params.id),
                project_id,
                title,
                description,
                assigned_to,
                status,
                due_date,
                priority
            });
        }
    );
});

// Delete task
router.delete('/:id', (req, res) => {
    db.run('DELETE FROM tasks WHERE id = ?', [req.params.id], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json({ message: 'Task deleted' });
    });
});

module.exports = router;