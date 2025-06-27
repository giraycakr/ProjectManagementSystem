// Check if user is logged in and is a developer
document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user) {
        window.location.href = '/';
        return;
    }

    if (user.role !== 'developer') {
        window.location.href = '/';
        return;
    }

    // Set user name in header
    document.getElementById('user-name').textContent = `${user.username}`;

    // Initialize
    loadMyTasks(user.id);

    // Event listeners
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('status-filter').addEventListener('change', () => loadMyTasks(user.id));
    document.getElementById('update-task-form').addEventListener('submit', updateTaskStatus);
    document.getElementById('cancel-update-btn').addEventListener('click', hideUpdateTaskForm);
});

// Load tasks assigned to the logged-in developer
async function loadMyTasks(userId) {
    try {
        // Show loading state
        document.getElementById('my-tasks-list').innerHTML = '<div class="empty-state">Loading your tasks...</div>';

        const response = await fetch(`/api/tasks/developer/${userId}`);
        const tasks = await response.json();

        // Apply status filter if selected
        const statusFilter = document.getElementById('status-filter').value;
        let filteredTasks = tasks;

        if (statusFilter !== 'all') {
            filteredTasks = tasks.filter(task => task.status === statusFilter);
        }

        displayMyTasks(filteredTasks);

    } catch (error) {
        console.error('Error loading tasks:', error);
        document.getElementById('my-tasks-list').innerHTML = '<div class="empty-state">Error loading tasks. Please refresh the page.</div>';
    }
}

// Display tasks in the my tasks list
function displayMyTasks(tasks) {
    const tasksList = document.getElementById('my-tasks-list');
    tasksList.innerHTML = '';

    if (tasks.length === 0) {
        const statusFilter = document.getElementById('status-filter').value;
        const message = statusFilter === 'all'
            ? 'No tasks assigned to you yet. Check back later!'
            : `No ${statusFilter} tasks found. Try changing the filter.`;
        tasksList.innerHTML = `<div class="empty-state">${message}</div>`;
        return;
    }

    // Group tasks by status for better organization
    const tasksByStatus = {
        'to do': tasks.filter(task => task.status === 'to do'),
        'in progress': tasks.filter(task => task.status === 'in progress'),
        'completed': tasks.filter(task => task.status === 'completed')
    };

    // Display tasks grouped by status
    ['to do', 'in progress', 'completed'].forEach(status => {
        const statusTasks = tasksByStatus[status];
        if (statusTasks.length === 0) return;

        // Add status header
        const statusHeader = document.createElement('div');
        statusHeader.style.cssText = `
            margin: 20px 0 15px 0;
            padding: 10px 15px;
            background: rgba(255, 255, 255, 0.9);
            border-radius: 8px;
            font-weight: 600;
            color: #2c3e50;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-size: 14px;
        `;
        statusHeader.textContent = `${status} (${statusTasks.length})`;
        tasksList.appendChild(statusHeader);

        statusTasks.forEach(task => {
            const taskCard = document.createElement('div');
            taskCard.className = `task-card task-priority-${task.priority}`;

            // Calculate days until due date
            const daysUntilDue = task.due_date ? calculateDaysUntilDue(task.due_date) : null;
            const dueDateDisplay = getDueDateDisplay(daysUntilDue);

            taskCard.innerHTML = `
                <h3>
                    <span class="card-title">${task.title}</span>
                    <button class="update-status-btn" data-id="${task.id}">Update Status</button>
                </h3>
                <p><strong>Description:</strong> ${task.description || 'No description provided'}</p>
                <p><strong>Project:</strong> ${task.project_name || 'No project'}</p>
                <p><strong>Due Date:</strong> ${formatDate(task.due_date)} ${dueDateDisplay}</p>
                <p><strong>Priority:</strong> <span style="text-transform: capitalize; font-weight: 600; color: ${getPriorityColor(task.priority)}">${task.priority}</span></p>
                <p>
                    <strong>Status:</strong> 
                    <span class="task-status status-${task.status.replace(' ', '')}">
                        ${task.status}
                    </span>
                </p>
            `;
            tasksList.appendChild(taskCard);

            // Add event listener for update status button
            taskCard.querySelector('.update-status-btn').addEventListener('click', () => showUpdateTaskForm(task));
        });
    });
}

// Show update task form
function showUpdateTaskForm(task) {
    document.getElementById('update-task-id').value = task.id;
    document.getElementById('update-task-title').textContent = task.title;
    document.getElementById('update-task-project').textContent = `Project: ${task.project_name || 'No project'}`;
    document.getElementById('update-task-description').textContent = task.description || 'No description provided';
    document.getElementById('update-task-status').value = task.status;

    document.getElementById('update-task-section').classList.remove('hidden');

    // Scroll to form
    document.getElementById('update-task-section').scrollIntoView({ behavior: 'smooth' });
}

// Hide update task form
function hideUpdateTaskForm() {
    document.getElementById('update-task-section').classList.add('hidden');
}

// Update task status
async function updateTaskStatus(e) {
    e.preventDefault();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Updating...';
    submitBtn.disabled = true;

    const taskId = document.getElementById('update-task-id').value;
    const newStatus = document.getElementById('update-task-status').value;

    try {
        // First get the current task data
        const response = await fetch(`/api/tasks/${taskId}`);
        const task = await response.json();

        // Update only the status
        task.status = newStatus;

        // Save the updated task
        const updateResponse = await fetch(`/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(task)
        });

        if (updateResponse.ok) {
            submitBtn.textContent = 'Updated!';
            submitBtn.style.background = 'linear-gradient(45deg, #2ecc71, #27ae60)';

            setTimeout(() => {
                hideUpdateTaskForm();
                loadMyTasks(JSON.parse(localStorage.getItem('user')).id);

                // Reset button
                submitBtn.textContent = originalText;
                submitBtn.style.background = '';
                submitBtn.disabled = false;
            }, 1000);
        } else {
            const error = await updateResponse.json();
            alert(`Error: ${error.error || 'Unknown error'}`);

            // Reset button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }

    } catch (error) {
        console.error('Error updating task status:', error);
        alert('An error occurred. Please try again.');

        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
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

// Helper function to get priority color
function getPriorityColor(priority) {
    switch(priority) {
        case 'high': return '#e74c3c';
        case 'medium': return '#f39c12';
        case 'low': return '#2ecc71';
        default: return '#34495e';
    }
}

// Helper function to calculate days until due date
function calculateDaysUntilDue(dueDateString) {
    if (!dueDateString) return null;

    const today = new Date();
    const dueDate = new Date(dueDateString);
    const timeDiff = dueDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    return daysDiff;
}

// Helper function to get due date display
function getDueDateDisplay(daysUntilDue) {
    if (daysUntilDue === null) return '';

    if (daysUntilDue < 0) {
        return `<span style="color: #e74c3c; font-weight: 600;">(${Math.abs(daysUntilDue)} days overdue)</span>`;
    } else if (daysUntilDue === 0) {
        return '<span style="color: #f39c12; font-weight: 600;">(Due today!)</span>';
    } else if (daysUntilDue === 1) {
        return '<span style="color: #f39c12; font-weight: 600;">(Due tomorrow)</span>';
    } else if (daysUntilDue <= 3) {
        return `<span style="color: #f39c12; font-weight: 600;">(Due in ${daysUntilDue} days)</span>`;
    } else if (daysUntilDue <= 7) {
        return `<span style="color: #3498db; font-weight: 600;">(Due in ${daysUntilDue} days)</span>`;
    } else {
        return `<span style="color: #2ecc71;">(Due in ${daysUntilDue} days)</span>`;
    }
}