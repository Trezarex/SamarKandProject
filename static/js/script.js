// Navigation functionality
function showSection(sectionId) {
    // Hide all content sections here .. ..
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.classList.remove('active'));

    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));

    document.getElementById(sectionId).classList.add('active');

    event.target.classList.add('active');

    if (sectionId === 'dashboard') {
        setTimeout(() => {
            if (!currentDataset) {
                loadData('hospitals');
            }
        }, 100);
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        alert('Nice try Diddyy .. .');
        // window.location.href = '/login';
    }
}

// Dashboard functionality
let currentDataset = '';
let allData = [];
let chart;
let currentChartType = 'bar';

function loadData(type) {
    currentDataset = type;
    updateActiveTab();
    showNoDataMessage(false);

    // Get region/district options
    fetch(`/api/${type}/filters`)
        .then(res => res.json())
        .then(filters => {
            populateDropdown("regionFilter", filters.regions);
            populateDropdown("districtFilter", filters.districts);
        })
        .catch(error => {
            console.error('Error loading filters:', error);
            showNoDataMessage(true, 'Error loading filters');
        });

    // Fetch and render dataset
    fetchAndRender();
}

function updateActiveTab() {
    ['hospitals', 'preschools', 'students'].forEach(type => {
        const btn = document.getElementById(`btn-${type}`);
        if (btn) btn.classList.remove('active');
    });
    const activeBtn = document.getElementById(`btn-${currentDataset}`);
    if (activeBtn) activeBtn.classList.add('active');
}

function populateDropdown(selectId, values) {
    const dropdown = document.getElementById(selectId);
    if (dropdown) {
        dropdown.innerHTML = `<option value="">All</option>` +
            values.map(v => `<option value="${v}">${v}</option>`).join('');
    }
}

function applyFilters() {
    fetchAndRender();
}

function fetchAndRender() {
    const regionFilter = document.getElementById('regionFilter');
    const districtFilter = document.getElementById('districtFilter');

    if (!regionFilter || !districtFilter) return;

    const region = regionFilter.value;
    const district = districtFilter.value;

    const params = new URLSearchParams();
    if (region) params.append('region', region);
    if (district) params.append('district', district);

    fetch(`/api/${currentDataset}?${params}`)
        .then(res => res.json())
        .then(data => {
            allData = data;
            populateMetricSelector(data);
            if (data.length > 0) {
                renderChart(currentChartType);
                showNoDataMessage(false);
            } else {
                showNoDataMessage(true, 'No data available for selected filters');
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            showNoDataMessage(true, 'Error loading data');
        });
}

function populateMetricSelector(data) {
    const metricSelector = document.getElementById("metricSelector");
    if (!metricSelector || !data.length) {
        if (metricSelector) metricSelector.innerHTML = '<option value="">No metrics available</option>';
        return;
    }

    const sample = data[0];
    const numericCols = Object.keys(sample).filter(key => {
        const value = sample[key];
        return typeof value === 'number' || (!isNaN(parseFloat(value)) && value !== "");
    });

    metricSelector.innerHTML = '<option value="">Select Metric</option>' +
        numericCols.map(k => `<option value="${k}">${k}</option>`).join('');
}

function renderChart(type) {
    currentChartType = type;
    if (!allData.length) {
        showNoDataMessage(true);
        return;
    }

    const metricSelector = document.getElementById('metricSelector');
    if (!metricSelector) return;

    const metric = metricSelector.value;
    if (!metric) {
        showNoDataMessage(true, 'Please select a metric');
        return;
    }

    const keys = Object.keys(allData[0]);
    const labelKey = keys[1]; // fallback to 2nd column as label

    const labels = allData.map(row => row[labelKey]);
    const values = allData.map(row => parseFloat(row[metric]) || 0);

    const canvas = document.getElementById('myChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (chart) chart.destroy();

    // Colors for different chart types
    const colors = [
        '#4285f4', '#34a853', '#fbbc04', '#ea4335', '#9c27b0',
        '#ff9800', '#795548', '#607d8b', '#e91e63', '#00bcd4'
    ];

    let chartConfig = {
        type: type,
        data: {
            labels,
            datasets: [{
                label: metric,
                data: values,
                backgroundColor: type === 'pie' ? colors.slice(0, values.length) :
                    type === 'line' ? 'rgba(66, 133, 244, 0.2)' : '#4285f4',
                borderColor: type === 'pie' ? colors.slice(0, values.length) : '#4285f4',
                borderWidth: type === 'line' ? 3 : 1,
                fill: type === 'line' ? false : true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: type === 'pie' ? 'right' : 'top'
                },
                title: {
                    display: true,
                    text: `${currentDataset.charAt(0).toUpperCase() + currentDataset.slice(1)} - ${metric}`,
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                }
            },
            scales: type === 'pie' ? {} : {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                }
            }
        }
    };

    chart = new Chart(ctx, chartConfig);
    showNoDataMessage(false);
}

function showNoDataMessage(show, message = '📊 Select a dataset and metric to view the chart') {
    const noDataDiv = document.getElementById('noDataMessage');
    const canvas = document.getElementById('myChart');

    if (show) {
        noDataDiv.style.display = 'flex';
        noDataDiv.textContent = message;
        canvas.style.display = 'none';
    } else {
        noDataDiv.style.display = 'none';
        canvas.style.display = 'block';
    }
}

function downloadChart() {
    if (!chart) {
        alert('No chart available to download');
        return;
    }

    const canvas = document.getElementById('myChart');
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `${currentDataset}_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

function downloadCSV() {
    if (!allData.length) {
        alert('No data available to download');
        return;
    }

    const keys = Object.keys(allData[0]);
    const csvContent = [
        keys.join(','),
        ...allData.map(row => keys.map(k => JSON.stringify(row[k] || "")).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentDataset}_${Date.now()}.csv`;
    link.click();

    URL.revokeObjectURL(url);
}

// === Chat Bot Logic ===
function appendMessage(sender, text, isLoading = false) {
  const chatMessages = document.getElementById('chat-messages');
  if (!chatMessages) return;
  const msgDiv = document.createElement('div');
  msgDiv.className = sender === 'user' ? 'user-message' : 'bot-message';
  if (isLoading) {
    msgDiv.innerHTML = '<span class="loading-dots"><span>.</span><span>.</span><span>.</span></span>';
    msgDiv.classList.add('bot-loading');
  } else {
    msgDiv.textContent = text;
  }
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return msgDiv;
}

function sendMessage(event) {
  event.preventDefault();
  const input = document.getElementById('chat-input');
  if (!input) return false;
  const message = input.value.trim();
  if (!message) return false;
  appendMessage('user', message);
  input.value = '';
  // Show loading message and keep reference
  const loadingDiv = appendMessage('bot', '', true);
  fetch('/deepseek_chat_bot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  })
    .then(res => res.json())
    .then(data => {
      if (loadingDiv) {
        loadingDiv.classList.remove('bot-loading');
        loadingDiv.innerHTML = '';
        loadingDiv.textContent = data.response;
      } else {
        appendMessage('bot', data.response);
      }
    })
    .catch(() => {
      if (loadingDiv) {
        loadingDiv.classList.remove('bot-loading');
        loadingDiv.innerHTML = '';
        loadingDiv.textContent = 'Sorry, there was an error connecting to the AI.';
      } else {
        appendMessage('bot', 'Sorry, there was an error connecting to the AI.');
      }
    });
  return false;
}

window.addEventListener('DOMContentLoaded', function() {
  const chatForm = document.getElementById('chat-form');
  if (chatForm) {
    chatForm.onsubmit = sendMessage;
  }
});

// Initialize the application
window.onload = () => {
    // Start with homepage active
    showSection('homepage');
};