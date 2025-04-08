class VendorManager {
  constructor() {
    this.vendorList = document.getElementById('vendorList');
    this.vendorForm = document.getElementById('vendorForm');
    this.vendorModal = document.getElementById('vendorModal');
    this.addVendorBtn = document.getElementById('addVendorBtn');
    this.cancelVendorBtn = document.getElementById('cancelVendorBtn');
    
    this.setupEventListeners();
    this.loadVendors();
    this.checkAuth();
  }

  checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login.html';
    }
  }

  setupEventListeners() {
    this.addVendorBtn.addEventListener('click', () => {
      this.vendorModal.classList.remove('hidden');
    });

    this.cancelVendorBtn.addEventListener('click', () => {
      this.vendorModal.classList.add('hidden');
    });

    this.vendorForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.addVendor();
    });
  }

  async loadVendors() {
    try {
      const response = await fetch('/api/vendors', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to load vendors');
      
      const vendors = await response.json();
      this.renderVendors(vendors);
    } catch (err) {
      console.error('Error loading vendors:', err);
      this.showError('Failed to load vendors');
    }
  }

  renderVendors(vendors) {
    this.vendorList.innerHTML = vendors.map(vendor => `
      <tr>
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="font-medium text-gray-900">${vendor.company_name}</div>
          <div class="text-sm text-gray-500">${vendor.email}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          ${vendor.contact_person || 'N/A'}
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex flex-wrap gap-1">
            ${vendor.services.map(service => `
              <span class="px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-800">
                ${service}
              </span>
            `).join('')}
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex items-center">
            ${this.renderRatingStars(vendor.rating)}
            <span class="ml-1 text-sm text-gray-500">(${vendor.rating.toFixed(1)})</span>
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <button class="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
          <button class="text-red-600 hover:text-red-900">Delete</button>
        </td>
      </tr>
    `).join('');
  }

  renderRatingStars(rating) {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push('<i class="fas fa-star text-yellow-400"></i>');
      } else if (i === fullStars && hasHalfStar) {
        stars.push('<i class="fas fa-star-half-alt text-yellow-400"></i>');
      } else {
        stars.push('<i class="far fa-star text-yellow-400"></i>');
      }
    }
    
    return stars.join('');
  }

  async addVendor() {
    const formData = {
      company_name: this.vendorForm.company_name.value,
      contact_person: this.vendorForm.contact_person.value,
      services: this.vendorForm.services.value.split(',').map(s => s.trim())
    };

    try {
      const response = await fetch('/api/vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to add vendor');

      const newVendor = await response.json();
      this.vendorModal.classList.add('hidden');
      this.vendorForm.reset();
      this.loadVendors();
    } catch (err) {
      console.error('Error adding vendor:', err);
      this.showError('Failed to add vendor');
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
  new VendorManager();
});