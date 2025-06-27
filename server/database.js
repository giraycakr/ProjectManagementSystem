const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create a new database file in the project root
const dbPath = path.resolve(__dirname, '../project_management.db');
const db = new sqlite3.Database(dbPath);

// Initialize the database
db.serialize(() => {
    // Create Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT,
        email TEXT
    )`);

    // Create Projects table
    db.run(`CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        description TEXT,
        start_date TEXT,
        deadline TEXT,
        status TEXT DEFAULT 'planned'
    )`);

    // Create Tasks table
    db.run(`CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER,
        title TEXT,
        description TEXT,
        assigned_to INTEGER,
        status TEXT DEFAULT 'to do',
        due_date TEXT,
        priority TEXT DEFAULT 'medium',
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_to) REFERENCES users(id)
    )`);

    // Create Comments table
    db.run(`CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER,
        user_id INTEGER,
        content TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Check if users table is empty and insert sample users if it is
    db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
        if (err || row.count === 0) {
            db.run("INSERT INTO users (username, password, role, email) VALUES ('manager', 'manager123', 'project_manager', 'manager@example.com')");
            db.run("INSERT INTO users (username, password, role, email) VALUES ('dev1', 'dev123', 'developer', 'dev1@example.com')");
            db.run("INSERT INTO users (username, password, role, email) VALUES ('dev2', 'dev123', 'developer', 'dev2@example.com')");
            console.log("Sample users added to database");
        }
    });
});

console.log("SQLite database setup complete");

module.exports = db;