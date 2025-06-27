// Check if user is logged in and is a project manager
document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user) {
        window.location.href = '/';
        return;
    }

    if (user.role !== 'project_manager') {
        window.location.href = '/';
        return;
    }

    // Set user name in header
    document.getElementById('user-name').textContent = `${user.username}`;

    // Initialize
    loadProjects();
    loadDevelopers();

    // Event listeners
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('add-project-btn').addEventListener('click', showProjectForm);
    document.getElementById('cancel-project-btn').addEventListener('click', hideProjectForm);
    document.getElementById('project-form').addEventListener('submit', saveProject);

    document.getElementById('add-task-btn').addEventListener('click', showTaskForm);
    document.getElementById('cancel-task-btn').addEventListener('click', hideTaskForm);
    document.getElementById('task-form').addEventListener('submit', saveTask);
});

// Load all projects
async function loadProjects() {
    try {
        const response = await fetch('/api/projects');
        const projects = await response.json();

        const projectsList = document.getElementById('projects-list');
        projectsList.innerHTML = '';

        const taskProjectSelect = document.getElementById('task-project');
        taskProjectSelect.innerHTML = '<option value="">Select a project</option>';

        if (projects.length === 0) {
            projectsList.innerHTML = '<div class="empty-state">No projects yet. Create your first project!</div>';
            return;
        }

        projects.forEach(project => {
            // Add to projects list
            const projectCard = document.createElement('div');
            projectCard.className = 'project-card';
            projectCard.innerHTML = `
                <h3>
                    <span class="card-title">${project.name}</span>
                    <div class="card-actions">
                        <button class="edit-btn" data-id="${project.id}">Edit</button>
                        <button class="delete-btn" data-id="${project.id}">Delete</button>
                    </div>
                </h3>
                <p><strong>Description:</strong> ${project.description || 'No description provided'}</p>
                <p><strong>Start Date:</strong> ${formatDate(project.start_date)}</p>
                <p><strong>Deadline:</strong> ${formatDate(project.deadline)}</p>
                <p><strong>Status:</strong> <span class="task-status status-${project.status.replace(' ', '')}">${project.status}</span></p>
                <button class="view-tasks-btn" data-id="${project.id}">View Tasks</button>
            `;
            projectsList.appendChild(projectCard);

            // Add event listeners
            projectCard.querySelector('.edit-btn').addEventListener('click', () => editProject(project));
            projectCard.querySelector('.delete-btn').addEventListener('click', () => deleteProject(project.id));
            projectCard.querySelector('.view-tasks-btn').addEventListener('click', () => loadTasksByProject(project.id));

            // Add to task project select
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            taskProjectSelect.appendChild(option);
        });

    } catch (error) {
        console.error('Error loading projects:', error);
        document.getElementById('projects-list').innerHTML = '<div class="empty-state">Error loading projects. Please refresh the page.</div>';
    }
}

// Load all tasks
async function loadTasks() {
    try {
        const response = await fetch('/api/tasks');
        const tasks = await response.json();

        displayTasks(tasks);

    } catch (error) {
        console.error('Error loading tasks:', error);
        document.getElementById('tasks-list').innerHTML = '<div class="empty-state">Error loading tasks. Please refresh the page.</div>';
    }
}

// Load tasks by project
async function loadTasksByProject(projectId) {
    try {
        const response = await fetch(`/api/tasks/project/${projectId}`);
        const tasks = await response.json();

        displayTasks(tasks, `Tasks for this project`);

    } catch (error) {
        console.error('Error loading tasks by project:', error);
        document.getElementById('tasks-list').innerHTML = '<div class="empty-state">Error loading tasks. Please refresh the page.</div>';
    }
}

// Display tasks in the tasks list
function displayTasks(tasks, title = 'All Tasks') {
    const tasksList = document.getElementById('tasks-list');
    tasksList.innerHTML = '';

    if (tasks.length === 0) {
        tasksList.innerHTML = '<div class="empty-state">No tasks found. Create your first task!</div>';
        return;
    }

    tasks.forEach(task => {
        const taskCard = document.createElement('div');
        taskCard.className = `task-card task-priority-${task.priority}`;
        taskCard.innerHTML = `
            <h3>
                <span class="card-title">${task.title}</span>
                <div class="card-actions">
                    <button class="edit-btn" data-id="${task.id}">Edit</button>
                    <button class="delete-btn" data-id="${task.id}">Delete</button>
                </div>
            </h3>
            <p><strong>Description:</strong> ${task.description || 'No description provided'}</p>
            <p><strong>Project:</strong> ${task.project_name || 'No project'}</p>
            <p><strong>Assigned To:</strong> ${task.assigned_to_name || 'Unassigned'}</p>
            <p><strong>Due Date:</strong> ${formatDate(task.due_date)}</p>
            <p><strong>Priority:</strong> <span style="text-transform: capitalize; font-weight: 600; color: ${getPriorityColor(task.priority)}">${task.priority}</span></p>
            <p>
                <strong>Status:</strong> 
                <span class="task-status status-${task.status.replace(' ', '')}">
                    ${task.status}
                </span>
            </p>
        `;
        tasksList.appendChild(taskCard);

        // Add event listeners
        taskCard.querySelector('.edit-btn').addEventListener('click', () => editTask(task));
        taskCard.querySelector('.delete-btn').addEventListener('click', () => deleteTask(task.id));
    });
}

// Load all developers for task assignment
async function loadDevelopers() {
    try {
        const response = await fetch('/api/auth/developers');
        const developers = await response.json();

        const developerSelect = document.getElementById('task-developer');
        developerSelect.innerHTML = '<option value="">Select a developer</option>';

        developers.forEach(developer => {
            const option = document.createElement('option');
            option.value = developer.id;
            option.textContent = developer.username;
            developerSelect.appendChild(option);
        });

    } catch (error) {
        console.error('Error loading developers:', error);
        // Fallback: Add the developers we know exist
        const developerSelect = document.getElementById('task-developer');
        developerSelect.innerHTML = '<option value="">Select a developer</option>';

        [
            { id: 2, username: 'dev1' },
            { id: 3, username: 'dev2' }
        ].forEach(developer => {
            const option = document.createElement('option');
            option.value = developer.id;
            option.textContent = developer.username;
            developerSelect.appendChild(option);
        });
    }
}

// Show project form for adding
function showProjectForm() {
    document.getElementById('project-form-container').classList.remove('hidden');
    document.getElementById('project-form').reset();
    document.getElementById('project-id').value = '';
    document.querySelector('#project-form-container h3').textContent = 'Add New Project';

    // Scroll to form
    document.getElementById('project-form-container').scrollIntoView({ behavior: 'smooth' });
}

// Hide project form
function hideProjectForm() {
    document.getElementById('project-form-container').classList.add('hidden');
}

// Edit project
function editProject(project) {
    document.getElementById('project-id').value = project.id;
    document.getElementById('project-name').value = project.name;
    document.getElementById('project-description').value = project.description || '';
    document.getElementById('project-start-date').value = formatDateForInput(project.start_date);
    document.getElementById('project-deadline').value = formatDateForInput(project.deadline);
    document.getElementById('project-status').value = project.status;

    document.getElementById('project-form-container').classList.remove('hidden');
    document.querySelector('#project-form-container h3').textContent = 'Edit Project';

    // Scroll to form
    document.getElementById('project-form-container').scrollIntoView({ behavior: 'smooth' });
}

// Save project (create or update)
async function saveProject(e) {
    e.preventDefault();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Saving...';
    submitBtn.disabled = true;

    const projectId = document.getElementById('project-id').value;
    const isUpdate = projectId !== '';

    const projectData = {
        name: document.getElementById('project-name').value,
        description: document.getElementById('project-description').value,
        start_date: document.getElementById('project-start-date').value,
        deadline: document.getElementById('project-deadline').value,
        status: document.getElementById('project-status').value
    };

    try {
        const url = isUpdate ? `/api/projects/${projectId}` : '/api/projects';
        const method = isUpdate ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(projectData)
        });

        if (response.ok) {
            submitBtn.textContent = 'Saved!';
            submitBtn.style.background = 'linear-gradient(45deg, #2ecc71, #27ae60)';

            setTimeout(() => {
                hideProjectForm();
                loadProjects();

                // Reset button
                submitBtn.textContent = originalText;
                submitBtn.style.background = '';
                submitBtn.disabled = false;
            }, 1000);
        } else {
            const error = await response.json();
            alert(`Error: ${error.error || 'Unknown error'}`);

            // Reset button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }

    } catch (error) {
        console.error('Error saving project:', error);
        alert('An error occurred. Please try again.');

        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Delete project
async function deleteProject(projectId) {
    if (!confirm('Are you sure you want to delete this project? All associated tasks will also be deleted.')) {
        return;
    }

    try {
        const response = await fetch(`/api/projects/${projectId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadProjects();
            // Clear tasks list if it was showing tasks from this project
            document.getElementById('tasks-list').innerHTML = '<div class="empty-state">Click "View Tasks" on a project to see its tasks, or create a new task.</div>';
        } else {
            const error = await response.json();
            alert(`Error: ${error.error || 'Unknown error'}`);
        }

    } catch (error) {
        console.error('Error deleting project:', error);
        alert('An error occurred. Please try again.');
    }
}

// Show task form for adding
function showTaskForm() {
    document.getElementById('task-form-container').classList.remove('hidden');
    document.getElementById('task-form').reset();
    document.getElementById('task-id').value = '';
    document.querySelector('#task-form-container h3').textContent = 'Add New Task';

    // Scroll to form
    document.getElementById('task-form-container').scrollIntoView({ behavior: 'smooth' });
}

// Hide task form
function hideTaskForm() {
    document.getElementById('task-form-container').classList.add('hidden');
}

// Edit task
function editTask(task) {
    document.getElementById('task-id').value = task.id;
    document.getElementById('task-project').value = task.project_id;
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-description').value = task.description || '';
    document.getElementById('task-developer').value = task.assigned_to;
    document.getElementById('task-status').value = task.status;
    document.getElementById('task-due-date').value = formatDateForInput(task.due_date);
    document.getElementById('task-priority').value = task.priority;

    document.getElementById('task-form-container').classList.remove('hidden');
    document.querySelector('#task-form-container h3').textContent = 'Edit Task';

    // Scroll to form
    document.getElementById('task-form-container').scrollIntoView({ behavior: 'smooth' });
}

// Save task (create or update)
async function saveTask(e) {
    e.preventDefault();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Saving...';
    submitBtn.disabled = true;

    const taskId = document.getElementById('task-id').value;
    const isUpdate = taskId !== '';

    const taskData = {
        project_id: document.getElementById('task-project').value,
        title: document.getElementById('task-title').value,
        description: document.getElementById('task-description').value,
        assigned_to: document.getElementById('task-developer').value,
        status: document.getElementById('task-status').value,
        due_date: document.getElementById('task-due-date').value,
        priority: document.getElementById('task-priority').value
    };

    try {
        const url = isUpdate ? `/api/tasks/${taskId}` : '/api/tasks';
        const method = isUpdate ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(taskData)
        });

        if (response.ok) {
            submitBtn.textContent = 'Saved!';
            submitBtn.style.background = 'linear-gradient(45deg, #2ecc71, #27ae60)';

            setTimeout(() => {
                hideTaskForm();
                loadTasks();

                // Reset button
                submitBtn.textContent = originalText;
                submitBtn.style.background = '';
                submitBtn.disabled = false;
            }, 1000);
        } else {
            const error = await response.json();
            alert(`Error: ${error.error || 'Unknown error'}`);

            // Reset button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }

    } catch (error) {
        console.error('Error saving task:', error);
        alert('An error occurred. Please try again.');

        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Delete task
async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }

    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadTasks();
        } else {
            const error = await response.json();
            alert(`Error: ${error.error || 'Unknown error'}`);
        }

    } catch (error) {
        console.error('Error deleting task:', error);
        alert('An error occurred. Please try again.');
    }
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('user');
        window.location.href = '/';
    }
}

// Helper function to format date
function formatDate(dateString) {
    if (!dateString) return 'Not set';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Helper function to format date for input fields (YYYY-MM-DD)
function formatDateForInput(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
}

// Helper function to get priority color
function getPriorityColor(priority) {
    switch(priority) {
        case 'high': return '#e74c3c';
        case 'medium': return '#f39c12';
        case 'low': return '#2ecc71';
        default: return '#34495e';
    }
}