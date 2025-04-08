class AttendeeManager {
  constructor() {
    this.attendeeList = document.getElementById('attendeeList');
    this.attendeeForm = document.getElementById('attendeeForm');
    this.attendeeModal = document.getElementById('attendeeModal');
    this.addAttendeeBtn = document.getElementById('addAttendeeBtn');
    this.cancelAttendeeBtn = document.getElementById('cancelAttendeeBtn');
    
    this.setupEventListeners();
    this.loadAttendees();
    this.checkAuth();
  }

  checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login.html';
    }
  }

  setupEventListeners() {
    this.addAttendeeBtn.addEventListener('click', () => {
      this.attendeeModal.classList.remove('hidden');
    });

    this.cancelAttendeeBtn.addEventListener('click', () => {
      this.attendeeModal.classList.add('hidden');
    });

    this.attendeeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.addAttendee();
    });
  }

  async loadAttendees() {
    try {
      const response = await fetch('/api/attendees', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to load attendees');
      
      const attendees = await response.json();
      this.renderAttendees(attendees);
    } catch (err) {
      console.error('Error loading attendees:', err);
      this.showError('Failed to load attendees');
    }
  }

  renderAttendees(attendees) {
    this.attendeeList.innerHTML = attendees.map(attendee => `
      <tr>
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="font-medium text-gray-900">${attendee.first_name} ${attendee.last_name}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          ${attendee.email}
        </td>
        <td class="px-6 py-4">
          <div class="text-sm text-gray-900 max-w-xs truncate">
            ${this.formatPreferences(attendee.preferences)}
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <button class="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
          <button class="text-red-600 hover:text-red-900">Delete</button>
        </td>
      </tr>
    `).join('');
  }

  formatPreferences(preferences) {
    if (!preferences) return 'None';
    try {
      const prefObj = typeof preferences === 'string' ? JSON.parse(preferences) : preferences;
      return Object.entries(prefObj).map(([key, value]) => 
        `${key}: ${value}`
      ).join(', ');
    } catch {
      return 'Invalid preferences format';
    }
  }

  async addAttendee() {
    let preferences;
    try {
      preferences = JSON.parse(this.attendeeForm.preferences.value);
    } catch (err) {
      this.showError('Preferences must be valid JSON');
      return;
    }

    const formData = {
      first_name: this.attendeeForm.first_name.value,
      last_name: this.attendeeForm.last_name.value,
      preferences: preferences
    };

    try {
      const response = await fetch('/api/attendees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to add attendee');

      const newAttendee = await response.json();
      this.attendeeModal.classList.add('hidden');
      this.attendeeForm.reset();
      this.loadAttendees();
    } catch (err) {
      console.error('Error adding attendee:', err);
      this.showError('Failed to add attendee');
    }
  }

  showError(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'fixed top-4 right-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded';
    errorElement.textContent = message;
    document.body.appendChild(errorElement);
    setTimeout(() => errorElement.remove(), 5000);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new AttendeeManager();
});