document.addEventListener('DOMContentLoaded', function() {
  // Initialize Chart
  const ctx = document.getElementById('budgetChart').getContext('2d');
  const budgetChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Catering', 'Venue', 'Marketing', 'Other'],
      datasets: [{
        data: [3000, 5000, 2000, 1000],
        backgroundColor: [
          '#3B82F6',
          '#10B981',
          '#F59E0B',
          '#EF4444'
        ]
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
  });

  // Form Submission
  document.getElementById('expenseForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const expense = {
      category: formData.get('category'),
      amount: parseFloat(formData.get('amount')),
      date: new Date().toISOString()
    };

    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expense)
      });
      
      if (response.ok) {
        loadExpenses();
        checkBudgetAlerts();
        e.target.reset();
      }
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  });

  // Load initial data
  loadExpenses();
  checkBudgetAlerts();
});

async function loadExpenses() {
  try {
    const response = await fetch('/api/expenses');
    const expenses = await response.json();
    
    const tableBody = document.getElementById('expenseTable');
    tableBody.innerHTML = expenses.map(expense => `
      <tr>
        <td class="px-6 py-4 whitespace-nowrap">${new Date(expense.date).toLocaleDateString()}</td>
        <td class="px-6 py-4 whitespace-nowrap">${expense.category}</td>
        <td class="px-6 py-4 whitespace-nowrap">$${expense.amount.toFixed(2)}</td>
        <td class="px-6 py-4 whitespace-nowrap">
          <button class="text-blue-600 hover:text-blue-900">Edit</button>
          <button class="text-red-600 hover:text-red-900 ml-2">Delete</button>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error loading expenses:', error);
  }
}

function checkBudgetAlerts() {
  fetch('/api/budgets/alerts')
    .then(response => response.json())
    .then(alerts => {
      const alertsContainer = document.getElementById('alertsContainer');
      alertsContainer.innerHTML = alerts.map(alert => `
        <div class="p-4 rounded-md ${alert.severity === 'high' ? 'bg-red-50 border-l-4 border-red-400' : 'bg-yellow-50 border-l-4 border-yellow-400'}">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 ${alert.severity === 'high' ? 'text-red-400' : 'text-yellow-400'}" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm ${alert.severity === 'high' ? 'text-red-700' : 'text-yellow-700'}">
                ${alert.message}
              </p>
            </div>
          </div>
        </div>
      `).join('');
    });
}