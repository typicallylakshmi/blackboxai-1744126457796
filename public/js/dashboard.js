class Dashboard {
  constructor() {
    this.initCharts();
    this.loadTasks();
    this.setupEventListeners();
    this.checkAuth();
  }

  checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login.html';
    }
  }

  initCharts() {
    // Budget Chart
    this.budgetChart = new Chart(
      document.getElementById('budgetChart'),
      {
        type: 'doughnut',
        data: {
          labels: ['Venue', 'Catering', 'Entertainment', 'Marketing'],
          datasets: [{
            data: [35, 25, 20, 20],
            backgroundColor: [
              '#3B82F6',
              '#10B981',
              '#F59E0B',
              '#EF4444'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      }
    );

    // Task Chart
    this.taskChart = new Chart(
      document.getElementById('taskChart'),
      {
        type: 'bar',
        data: {
          labels: ['Pending', 'In Progress', 'Completed'],
          datasets: [{
            label: 'Tasks',
            data: [12, 8, 15],
            backgroundColor: [
              '#F59E0B',
              '#3B82F6',
              '#10B981'
            ]
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
      }
    );
  }

  async loadTasks() {
    try {
      const response = await fetch('/api/tasks', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to load tasks');
      
      const tasks = await response.json();
      this.updateTaskStats(tasks);
    } catch (err) {
      console.error('Error loading tasks:', err);
    }
  }

  updateTaskStats(tasks) {
    const stats = {
      pending: 0,
      in_progress: 0,
      completed: 0
    };

    tasks.forEach(task => {
      stats[task.status] = (stats[task.status] || 0) + 1;
    });

    // Update chart data
    this.taskChart.data.datasets[0].data = [
      stats.pending,
      stats.in_progress,
      stats.completed
    ];
    this.taskChart.update();

    // Update stats card
    document.querySelectorAll('.stats-card')[1].querySelector('p').textContent = 
      stats.pending + stats.in_progress;
  }

  setupEventListeners() {
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', () => {
      localStorage.removeItem('token');
      window.location.href = '/login.html';
    });

    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', () => {
      this.loadTasks();
    });
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new Dashboard();
});