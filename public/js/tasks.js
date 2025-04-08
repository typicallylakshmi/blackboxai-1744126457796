document.addEventListener('DOMContentLoaded', function() {
  // Initialize Task Chart
  const taskCtx = document.getElementById('taskChart').getContext('2d');
  const taskChart = new Chart(taskCtx, {
    type: 'bar',
    data: {
      labels: ['Pending', 'In Progress', 'Completed'],
      datasets: [{
        label: 'Tasks',
        data: [0, 0, 0],
        backgroundColor: [
          '#F59E0B',
          '#3B82F6',
          '#10B981'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });

  // Initialize Calendar
  const calendarEl = document.getElementById('taskCalendar');
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    events: [],
    eventClick: function(info) {
      alert('Task: ' + info.event.title);
    }
  });
  calendar.render();

  // Form Submission
  document.getElementById('taskForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const task = {
      title: formData.get('title'),
      description: formData.get('description'),
      assignee: formData.get('assignee'),
      deadline: formData.get('deadline'),
      status: 'pending'
    };

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(task)
      });
      
      if (response.ok) {
        loadTasks();
        e.target.reset();
      }
    } catch (error) {
      console.error('Error adding task:', error);
    }
  });

  // Load initial data
  loadUsers();
  loadTasks();
});

async function loadUsers() {
  try {
    const response = await fetch('/api/users');
    const users = await response.json();
    
    const assigneeSelects = document.querySelectorAll('select[name="assignee"], #assigneeFilter');
    assigneeSelects.forEach(select => {
      select.innerHTML = '<option value="all">All</option>' + 
        users.map(user => `<option value="${user.id}">${user.name}</option>`).join('');
    });
  } catch (error) {
    console.error('Error loading users:', error);
  }
}

async function loadTasks() {
  try {
    const statusFilter = document.getElementById('statusFilter').value;
    const assigneeFilter = document.getElementById('assigneeFilter').value;
    
    const response = await fetch(`/api/tasks?status=${statusFilter}&assignee=${assigneeFilter}`);
    const tasks = await response.json();
    
    // Update task table
    const tableBody = document.getElementById('taskTable');
    tableBody.innerHTML = tasks.map(task => `
      <tr>
        <td class="px-6 py-4 whitespace-nowrap">${task.title}</td>
        <td class="px-6 py-4 whitespace-nowrap">${task.assignee_name || 'Unassigned'}</td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
            ${task.status === 'completed' ? 'bg-green-100 text-green-800' : 
              task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}">
            ${task.status.replace('_', ' ')}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">${new Date(task.deadline).toLocaleString()}</td>
        <td class="px-6 py-4 whitespace-nowrap">
          <button class="text-blue-600 hover:text-blue-900" onclick="editTask(${task.id})">Edit</button>
          <button class="text-red-600 hover:text-red-900 ml-2" onclick="deleteTask(${task.id})">Delete</button>
        </td>
      </tr>
    `).join('');

    // Update chart data
    const statusCounts = {
      pending: tasks.filter(t => t.status === 'pending').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length
    };
    taskChart.data.datasets[0].data = [
      statusCounts.pending,
      statusCounts.in_progress,
      statusCounts.completed
    ];
    taskChart.update();

    // Update calendar events
    const calendar = document.getElementById('taskCalendar').__fullCalendar;
    calendar.removeAllEvents();
    calendar.addEventSource(tasks.map(task => ({
      title: task.title,
      start: task.deadline,
      color: task.status === 'completed' ? '#10B981' : 
             task.status === 'in_progress' ? '#3B82F6' : '#F59E0B'
    })));

  } catch (error) {
    console.error('Error loading tasks:', error);
  }
}

// Apply filters
document.getElementById('applyFilters').addEventListener('click', loadTasks);

// Task actions
async function editTask(taskId) {
  // Implementation for editing a task
  alert(`Edit task ${taskId}`);
}

async function deleteTask(taskId) {
  if (confirm('Are you sure you want to delete this task?')) {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        loadTasks();
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  }
}