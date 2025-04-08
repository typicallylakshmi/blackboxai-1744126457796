class Dashboard {
  constructor() {
    this.charts = {};
    this.checkAuth();
    this.initCharts();
    this.setupEventListeners();
    this.loadTaskMetrics();
  }

  checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login.html';
    }
  }

  initCharts() {
    this.charts.taskChart = new Chart(
      document.getElementById('taskChart'),
      {
        type: 'doughnut',
        data: { labels: [], datasets: [] },
        options: {
          responsive: true,
          plugins: { legend: { position: 'bottom' } }
        }
      }
    );
  }

  async loadTaskMetrics() {
    try {
      const response = await fetch('/api/tasks/analytics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to load task metrics');
      
      const data = await response.json();
      this.updateTaskChart(data);
      this.updateTaskStats(data);
    } catch (err) {
      console.error('Error loading task metrics:', err);
    }
  }

  updateTaskChart(data) {
    this.charts.taskChart.data.labels = data.map(item => 
      item.status.replace('_', ' ').toUpperCase()
    );
    this.charts.taskChart.data.datasets = [{
      data: data.map(item => item.count),
      backgroundColor: ['#F59E0B', '#3B82F6', '#10B981'],
      borderWidth: 1
    }];
    this.charts.taskChart.update();
  }

  updateTaskStats(data) {
    const totalTasks = data.reduce((sum, item) => sum + item.count, 0);
    const completedTasks = data.find(item => item.status === 'completed')?.count || 0;
    
    document.getElementById('total-tasks').textContent = totalTasks;
    document.getElementById('completed-tasks').textContent = completedTasks;
    document.getElementById('task-progress').textContent = 
      `${Math.round((completedTasks / totalTasks) * 100)}%`;
  }

  setupEventListeners() {
    document.getElementById('logoutBtn').addEventListener('click', () => {
      localStorage.removeItem('token');
      window.location.href = '/login.html';
    });

    document.getElementById('refreshBtn').addEventListener('click', () => {
      this.loadTaskMetrics();
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new Dashboard();
});