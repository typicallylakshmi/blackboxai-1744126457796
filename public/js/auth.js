class Auth {
  constructor() {
    this.loginForm = document.getElementById('loginForm');
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLogin();
    });
  }

  async handleLogin() {
    const formData = {
      username: document.getElementById('username').value,
      password: document.getElementById('password').value,
      role: document.getElementById('role').value
    };

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        // Store token and redirect
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/dashboard.html';
      } else {
        this.showError(data.error || 'Login failed');
      }
    } catch (err) {
      this.showError('Network error. Please try again.');
      console.error('Login error:', err);
    }
  }

  showError(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded';
    errorElement.textContent = message;
    
    const existingError = this.loginForm.querySelector('.error-message');
    if (existingError) {
      existingError.replaceWith(errorElement);
    } else {
      this.loginForm.appendChild(errorElement);
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new Auth();
});