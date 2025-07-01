// Global variable to hold hospital data
let hospitalData = [];
let infrastructureData = [];
let populationData = [];
let resourcesData = [];
let districtChoices;
let hospitalChoices;
let filteredHospitalData = [];

// DONUT CHARTS
let infraDonutChart = null;
let populationDonutChart = null;
let resourcesDonutChart = null;
let infraDonutObserver = null;
let populationDonutObserver = null;
let resourcesDonutObserver = null;

// MAP
let hospitalMapInstance;
let mapMarkers = [];

// BAR CHART
let infraBarChart = null;
let populationBarChart = null;
let resourcesBarChart = null;

document.addEventListener("DOMContentLoaded", () => {
  loadHospitalData();
  initHospitalMap();
});

// Helper function to determine category based on score
function getCategoryForScore(score) {
  if (score >= 0.7) return 'GREEN';
  if (score >= 0.4) return 'YELLOW';
  return 'RED';
}

// Main function to load hospital data from backend
async function loadHospitalData() {
  try {
    const response = await fetch('/api/hospital-data');
    const data = await response.json();

    if (data.error) {
      console.error("❌ Error fetching hospital data:", data.error);
      return;
    }

    hospitalData = data;

    // Process data subsets
    infrastructureData = hospitalData.map(h => ({
      hospital_name: h.hospital_name,
      outside_branches: h.outside_branches,
      land_area_built: h.land_area_built,
      vacant_land_area: h.vacant_land_area,
      building_count: h.building_count,
      floors: h.floors,
      wall_material: h.wall_material,
      wall_condition: h.wall_condition,
      roof_material: h.roof_material,
      roof_condition: h.roof_condition,
      window_condition: h.window_condition,
      floor_condition: h.floor_condition,
      door_condition: h.door_condition,
      earthquake_safe: h.earthquake_safe,
      age_score: h.age_score,
      infrastructure_score: h.infrastructure_score,
      need_category: h.need_category
    }));

    populationData = hospitalData.map(h => ({
      hospital_name: h.hospital_name,
      medical_staff: h.medical_staff,
      bed_capacity: h.bed_capacity,
      population_score: h.population_score,
      total_staff: h.total_staff,
      need_category: h.need_category
    }));

    resourcesData = hospitalData.map(h => ({
      hospital_name: h.hospital_name,
      toilet_water_supply: h.toilet_water_supply,
      electricity_supply: h.electricity_supply,
      has_generator: h.has_generator,
      has_solar_panels: h.has_solar_panels,
      internal_electric_condition: h.internal_electric_condition,
      lighting_condition: h.lighting_condition,
      heating_source: h.heating_source,
      heating_condition: h.heating_condition,
      has_water: h.has_water,
      drinking_water_source: h.drinking_water_source,
      has_fence: h.has_fence,
      internet_type: h.internet_type,
      fire_safety: h.fire_safety,
      has_cctv: h.has_cctv,
      has_transport_nearby: h.has_transport_nearby,
      recent_repairs: h.recent_repairs,
      restroom_location: h.restroom_location,
      restroom_water_condition: h.restroom_water_condition,
      restroom_has_sewage: h.restroom_has_sewage,
      restroom_doors: h.restroom_doors,
      restroom_handwash_available: h.restroom_handwash_available,
      restroom_sewage_issues: h.restroom_sewage_issues,
      restroom_water_issues: h.restroom_water_issues,
      restroom_light_safe: h.restroom_light_safe,
      is_warm_in_winter: h.is_warm_in_winter,
      has_water_pipeline: h.has_water_pipeline,
      satisfaction: h.satisfaction,
      resources_score: h.resources_score,
      need_category: h.need_category
    }));

    populateHospitalFilters();
    updateHospitalSummaryCards(hospitalData);
    applyHospitalFilters();

    // Initialize charts after data is loaded
    updateInfraDonutChart(infrastructureData);
    updatePopulationDonutChart(populationData);
    updateResourcesDonutChart(resourcesData);

    initInfrastructureBarChart(infrastructureData);
    initPopulationBarChart(populationData);
    initResourcesBarChart(resourcesData);

    updatePopulationTable(hospitalData);
    updateInfrastructureTable(hospitalData);
    updateResourcesTable(hospitalData);


  } catch (error) {
    console.error("❌ Fetch failed:", error);
  }
}

function populateHospitalFilters() {
  const rawDistricts = [...new Set(hospitalData.map(h => h.district))].sort();
  const rawHospitals = [...new Set(hospitalData.map(h => h.hospital_name))].sort();

  // Initialize Choices
  if (!districtChoices) {
    districtChoices = new Choices("#hospitalDistrictFilter", {
      removeItemButton: true,
      placeholderValue: "Select District(s)",
      searchPlaceholderValue: "Search district",
    });
  }

  if (!hospitalChoices) {
    hospitalChoices = new Choices("#hospitalEntityFilter", {
      removeItemButton: true,
      placeholderValue: "Select Hospital(s)",
      searchPlaceholderValue: "Search hospital",
    });
  }

  // Set initial choices
  districtChoices.setChoices(
    rawDistricts.map(d => ({ value: d, label: d })),
    'value', 'label', true
  );

  hospitalChoices.setChoices(
    rawHospitals.map(h => ({ value: h, label: h })),
    'value', 'label', true
  );

  // Update hospitals dynamically when districts change
  document.querySelector("#hospitalDistrictFilter").addEventListener("change", () => {
    const selectedDistricts = districtChoices.getValue(true);
    const filteredHospitals = hospitalData
      .filter(h => selectedDistricts.length === 0 || selectedDistricts.includes(h.district))
      .map(h => h.hospital_name);

    const uniqueFilteredHospitals = [...new Set(filteredHospitals)].sort();

    hospitalChoices.clearChoices();
    hospitalChoices.setChoices(
      uniqueFilteredHospitals.map(h => ({ value: h, label: h })),
      'value', 'label', true
    );
  });
}

function applyHospitalFilters() {
  const selectedDistricts = districtChoices.getValue(true);
  const selectedHospitals = hospitalChoices.getValue(true);

  filteredHospitalData = hospitalData.filter(h => {
    const districtMatch = selectedDistricts.length === 0 || selectedDistricts.includes(h.district);
    const hospitalMatch = selectedHospitals.length === 0 || selectedHospitals.includes(h.hospital_name);
    return districtMatch && hospitalMatch;
  });

  const filteredInfra = infrastructureData.filter(item =>
    filteredHospitalData.some(h => h.hospital_name === item.hospital_name));
  const filteredPopulation = populationData.filter(item =>
    filteredHospitalData.some(h => h.hospital_name === item.hospital_name));
  const filteredResources = resourcesData.filter(item =>
    filteredHospitalData.some(h => h.hospital_name === item.hospital_name));

  // Update all components
  updateHospitalSummaryCards(filteredHospitalData);
  updateHospitalMap(filteredHospitalData);

  updateInfraDonutChart(filteredInfra);
  updatePopulationDonutChart(filteredPopulation);
  updateResourcesDonutChart(filteredResources);

  initInfrastructureBarChart(filteredInfra);
  initPopulationBarChart(filteredPopulation);
  initResourcesBarChart(filteredResources);

  updatePopulationTable(filteredPopulation);
  updateInfrastructureTable(filteredInfra);
  updateResourcesTable(filteredResources);
}

function updateHospitalSummaryCards(data) {
  // Handle no data case
  if (!data || data.length === 0) {
    document.getElementById("hospitalTotalCount").textContent = "0";
    document.getElementById("hospitalAvgSatisfaction").textContent = "-";
    document.getElementById("hospitalInfraScore").textContent = "-";
    document.getElementById("hospitalResourcesScore").textContent = "-";
    return;
  }

  const total = data.length;
  const avgPopulationScore = average(data.map(d => d.population_score));
  const avgInfra = average(data.map(d => d.infrastructure_score));
  const avgResources = average(data.map(d => d.resources_score));

  document.getElementById("hospitalTotalCount").textContent = total;
  document.getElementById("hospitalAvgSatisfaction").textContent = Math.round(avgPopulationScore * 100) + "%";
  document.getElementById("hospitalInfraScore").textContent = Math.round(avgInfra * 100) + "%";
  document.getElementById("hospitalResourcesScore").textContent = Math.round(avgResources * 100) + "%";
}

// Utility function
function average(arr) {
  const valid = arr.filter(v => typeof v === 'number' && !isNaN(v));
  if (valid.length === 0) return 0;
  return valid.reduce((sum, val) => sum + val, 0) / valid.length;
}

// DONUT CHART FUNCTIONS
function updateInfraDonutChart(infraData) {
  const ctx = document.getElementById('infraDonutChart')?.getContext('2d');
  if (!ctx) return;

  // Clean up previous observer
  if (infraDonutObserver) {
    infraDonutObserver.disconnect();
    infraDonutObserver = null;
  }

  // Count hospitals by infrastructure score category
  const categories = {
    'RED': 0,
    'YELLOW': 0,
    'GREEN': 0
  };

  infraData.forEach(hospital => {
    const category = getCategoryForScore(hospital.infrastructure_score);
    categories[category]++;
  });

  const labels = Object.keys(categories);
  const data = Object.values(categories);
  const total = data.reduce((a, b) => a + b, 0);

  if (infraDonutChart) infraDonutChart.destroy();

  infraDonutChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: [
          'rgba(220, 53, 69, 0.7)',  // RED
          'rgba(255, 193, 7, 0.7)',   // YELLOW
          'rgba(40, 167, 69, 0.7)'    // GREEN
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: {
              size: 11
            },
            boxWidth: 12,
            padding: 12
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.raw || 0;
              const percentage = Math.round((value / total) * 100);
              return `${context.label}: ${value} (${percentage}%)`;
            }
          }
        },
        title: {
          display: true,
          text: 'Infrastructure Need Distribution',
          font: {
            size: 14
          }
        }
      },
      cutout: '65%',
      devicePixelRatio: window.devicePixelRatio || 1
    }
  });

  const container = ctx.canvas.parentElement;
  if (container) {
    infraDonutObserver = new ResizeObserver(() => {
      infraDonutChart.resize();
    });
    infraDonutObserver.observe(container);
  }
}

function updatePopulationDonutChart(populationData) {
  const ctx = document.getElementById('populationDonutChart')?.getContext('2d');
  if (!ctx) return;

  // Clean up previous observer
  if (populationDonutObserver) {
    populationDonutObserver.disconnect();
    populationDonutObserver = null;
  }

  // Count hospitals by population score category
  const categories = {
    'RED': 0,
    'YELLOW': 0,
    'GREEN': 0
  };

  populationData.forEach(hospital => {
    const category = getCategoryForScore(hospital.population_score);
    categories[category]++;
  });

  const labels = Object.keys(categories);
  const data = Object.values(categories);
  const total = data.reduce((a, b) => a + b, 0);

  if (populationDonutChart) populationDonutChart.destroy();

  populationDonutChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: [
          'rgba(220, 53, 69, 0.7)',  // RED
          'rgba(255, 193, 7, 0.7)',   // YELLOW
          'rgba(40, 167, 69, 0.7)'    // GREEN
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: {
              size: 11
            },
            boxWidth: 12,
            padding: 12
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.raw || 0;
              const percentage = Math.round((value / total) * 100);
              return `${context.label}: ${value} (${percentage}%)`;
            }
          }
        },
        title: {
          display: true,
          text: 'Population Need Distribution',
          font: {
            size: 14
          }
        }
      },
      cutout: '65%',
      devicePixelRatio: window.devicePixelRatio || 1
    }
  });

  const container = ctx.canvas.parentElement;
  if (container) {
    populationDonutObserver = new ResizeObserver(() => {
      populationDonutChart.resize();
    });
    populationDonutObserver.observe(container);
  }
}

function updateResourcesDonutChart(resourcesData) {
  const ctx = document.getElementById('resourcesDonutChart')?.getContext('2d');
  if (!ctx) return;

  // Clean up previous observer
  if (resourcesDonutObserver) {
    resourcesDonutObserver.disconnect();
    resourcesDonutObserver = null;
  }

  // Count hospitals by resources score category
  const categories = {
    'RED': 0,
    'YELLOW': 0,
    'GREEN': 0
  };

  resourcesData.forEach(hospital => {
    const category = getCategoryForScore(hospital.resources_score);
    categories[category]++;
  });

  const labels = Object.keys(categories);
  const data = Object.values(categories);
  const total = data.reduce((a, b) => a + b, 0);

  if (resourcesDonutChart) resourcesDonutChart.destroy();

  resourcesDonutChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: [
          'rgba(220, 53, 69, 0.7)',  // RED
          'rgba(255, 193, 7, 0.7)',   // YELLOW
          'rgba(40, 167, 69, 0.7)'    // GREEN
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: {
              size: 11
            },
            boxWidth: 12,
            padding: 12
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.raw || 0;
              const percentage = Math.round((value / total) * 100);
              return `${context.label}: ${value} (${percentage}%)`;
            }
          }
        },
        title: {
          display: true,
          text: 'Resources Need Distribution',
          font: {
            size: 14
          }
        }
      },
      cutout: '65%',
      devicePixelRatio: window.devicePixelRatio || 1
    }
  });

  const container = ctx.canvas.parentElement;
  if (container) {
    resourcesDonutObserver = new ResizeObserver(() => {
      resourcesDonutChart.resize();
    });
    resourcesDonutObserver.observe(container);
  }
}

function initHospitalMap() {
  const mapDiv = document.getElementById('hospitalMap');
  if (!mapDiv) {
    console.warn("🚫 #hospitalMap not found in DOM.");
    return;
  }

  if (!hospitalMapInstance) {
    hospitalMapInstance = L.map('hospitalMap').setView([39.8, 66.9], 9);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(hospitalMapInstance);
  }

  setTimeout(() => {
    hospitalMapInstance.invalidateSize();
  }, 200);
}

function updateHospitalMap(data) {
  if (!hospitalMapInstance) return;

  // Remove previous markers
  mapMarkers.forEach(marker => marker.remove());
  mapMarkers = [];

  data.forEach(hospital => {
    if (!hospital.latitude || !hospital.longitude) return;

    const color = hospital.need_category === "RED"
      ? "red"
      : hospital.need_category === "YELLOW"
        ? "orange"
        : "green";

    // Halo effect
    const halo = L.circle([hospital.latitude, hospital.longitude], {
      radius: 300,
      color: color,
      fillColor: color,
      fillOpacity: 0.1,
      stroke: false
    }).addTo(hospitalMapInstance);

    // Main marker
    const marker = L.circleMarker([hospital.latitude, hospital.longitude], {
      radius: 8,
      color,
      fillColor: color,
      fillOpacity: 0.8
    }).addTo(hospitalMapInstance);

    marker.bindPopup(`
      <strong>${hospital.hospital_name}</strong><br>
      ${hospital.district}<br>
      Need: ${hospital.need_category}<br>
      Population Score: ${Math.round(hospital.population_score * 100)}%<br>
      Infrastructure Score: ${Math.round(hospital.infrastructure_score * 100)}%<br>
      Resources Score: ${Math.round(hospital.resources_score * 100)}%
    `);

    mapMarkers.push(marker, halo);
  });

  if (data.length > 0) {
    const latLngs = data
      .filter(h => h.latitude && h.longitude)
      .map(h => [h.latitude, h.longitude]);

    setTimeout(() => {
      hospitalMapInstance.fitBounds(latLngs, {
        padding: [50, 50],
        maxZoom: 10
      });
      hospitalMapInstance.invalidateSize();
    }, 200);
  } else {
    hospitalMapInstance.setView([39.8, 66.9], 9);
  }
}

function formatScore(score) {
  return Math.round(score * 100) + '%';
}

// Helper to get score class for styling
function getScoreClass(score) {
  if (score >= 0.7) return 'score-high';
  if (score >= 0.4) return 'score-medium';
  return 'score-low';
}

function updatePopulationTable(filteredData) {
  const table = document.querySelector('#populationTable tbody');
  table.innerHTML = '';

  filteredData.forEach(hospital => {
    const row = document.createElement('tr');

    // Format numbers to 2 decimal places if they are floats
    const formatNum = v => (typeof v === 'number' ? v.toFixed(2) : v);

    row.innerHTML = `
      <td>${hospital.hospital_name}</td>
      <td>${formatNum(hospital.medical_staff)}</td>
      <td>${formatNum(hospital.bed_capacity)}</td>
      <td>${formatNum(hospital.total_staff)}</td>
      <td class="score-cell ${getScoreClass(hospital.population_score)}">
        ${formatScore(hospital.population_score)}
      </td>
    `;

    table.appendChild(row);
  });
}

function updateInfrastructureTable(filteredData) {
  const table = document.querySelector('#infrastructureTable tbody');
  table.innerHTML = '';

  filteredData.forEach(hospital => {
    const row = document.createElement('tr');

    row.innerHTML = `
      <td>${hospital.hospital_name}</td>
      <td>${hospital.building_count}</td>
      <td>${hospital.earthquake_safe ? 'Yes' : 'No'}</td>
      <td>${hospital.wall_condition}</td>
      <td class="score-cell ${getScoreClass(hospital.infrastructure_score)}">
        ${formatScore(hospital.infrastructure_score)}
      </td>
    `;

    table.appendChild(row);
  });
}

function updateResourcesTable(filteredData) {
  const table = document.querySelector('#resourcesTable tbody');
  table.innerHTML = '';

  filteredData.forEach(hospital => {
    const row = document.createElement('tr');

    row.innerHTML = `
      <td>${hospital.hospital_name}</td>
      <td>${hospital.electricity_supply}</td>
      <td>${hospital.has_water ? 'Available' : 'Unavailable'}</td>
      <td>${hospital.heating_condition}</td>
      <td>${hospital.internet_type}</td>
      <td>${hospital.restroom_water_condition}</td>
      <td>${hospital.has_cctv ? 'CCTV' : 'No CCTV'}</td>
      <td class="score-cell ${getScoreClass(hospital.resources_score)}">
        ${formatScore(hospital.resources_score)}
      </td>
    `;

    table.appendChild(row);
  });
}

// ----------------------  Bar Charts ---------------------------

// Function to initialize and update the infrastructure bar chart
function initInfrastructureBarChart(data) {
  if (!data || data.length === 0) {
    console.error('No data provided for infrastructure bar chart');
    return;
  }

  const ctx = document.getElementById('infrastructureBarChart');
  if (!ctx) {
    console.error('Infrastructure bar chart canvas not found');
    return;
  }

  // Define the metrics we want to include in the chart
  const metrics = [
    'building_count',
    'floors',
    'land_area_built',
    'vacant_land_area',
    'wall_condition',
    'roof_condition',
    'window_condition',
    'floor_condition',
    'door_condition',
    'earthquake_safe',
    'age_score'
  ];

  // Calculate average values for each metric
  const metricAverages = metrics.map(metric => {
    const values = data.map(item => {
      // Convert to number and handle non-numeric values
      const value = parseFloat(item[metric]);
      return isNaN(value) ? 0 : value;
    });
    
    // Calculate average, but skip if all values are 0
    const sum = values.reduce((a, b) => a + b, 0);
    return sum > 0 ? sum / values.length : 0;
  });

  // Filter out metrics with no data
  const validMetrics = [];
  const validAverages = [];
  
  metrics.forEach((metric, index) => {
    if (metricAverages[index] > 0) {
      // Format the metric name for display
      const displayName = metric
        .replace(/_/g, ' ') // Replace underscores with spaces
        .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letter of each word
      
      validMetrics.push(displayName);
      validAverages.push(metricAverages[index]);
    }
  });

  // If no valid data, show a message
  if (validMetrics.length === 0) {
    ctx.parentElement.innerHTML = '<p>No infrastructure data available for the selected filters.</p>';
    return;
  }

  // Destroy existing chart if it exists
  if (infraBarChart) {
    infraBarChart.destroy();
  }

  // Create new chart
  infraBarChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: validMetrics,
      datasets: [{
        label: 'Average Value',
        data: validAverages,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y', // Horizontal bars
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Infrastructure Metrics Overview',
          font: {
            size: 16
          }
        },
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              // Format numbers to 2 decimal places
              if (context.raw !== null) {
                label += Number(context.raw).toFixed(2);
              }
              return label;
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Average Value',
            font: {
              weight: 'bold'
            }
          },
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        y: {
          grid: {
            display: false
          }
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutQuart'
      }
    }
  });
}

// Function to initialize and update the population bar chart
function initPopulationBarChart(data) {
  if (!data || data.length === 0) {
    console.error('No data provided for population bar chart');
    return;
  }

  const ctx = document.getElementById('populationBarChart');
  if (!ctx) {
    console.error('Population bar chart canvas not found');
    return;
  }

  // Define the metrics we want to include in the chart
  const metrics = [
    'medical_staff',
    'bed_capacity',
    'total_staff',
    
  ];

  // Calculate values for each metric
  const metricValues = metrics.map(metric => {
    const values = data.map(item => {
      // Convert to number and handle non-numeric values
      const value = parseFloat(item[metric]);
      return isNaN(value) ? 0 : value;
    });
    
    // Calculate sum for the metric
    return values.reduce((a, b) => a + b, 0);
  });

  // Format labels for display
  const displayLabels = [
    'Medical Staff',
    'Bed Capacity',
    'Total Staff',
    
  ];

  // Scale the population score for better visualization
  const populationScoreIndex = metrics.indexOf('population_score');
  if (populationScoreIndex !== -1) {
    const maxValue = Math.max(...metricValues.filter((_, i) => i !== populationScoreIndex));
    if (maxValue > 0) {
      const scaleFactor = maxValue * 1.5; // Scale to make it visible but not dominate
      metricValues[populationScoreIndex] = metricValues[populationScoreIndex] * scaleFactor;
    }
  }

  // Destroy existing chart if it exists
  if (populationBarChart) {
    populationBarChart.destroy();
  }

  // Create new chart
  populationBarChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: displayLabels,
      datasets: [{
        label: 'Total Value',
        data: metricValues,
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',  // Teal for medical staff
          'rgba(153, 102, 255, 0.6)', // Purple for bed capacity
          'rgba(255, 159, 64, 0.6)',  // Orange for total staff
          'rgba(255, 99, 132, 0.6)'   // Pink for population score
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(255, 99, 132, 1)'
        ],
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y', // Horizontal bars
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Population Metrics Overview',
          font: {
            size: 16
          }
        },
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              // Format numbers appropriately
              let value = context.raw;
              if (context.dataIndex === 3) { // Population score (scaled)
                const actualValue = value / (context.chart.scales.x.max / 1.5);
                label += actualValue.toFixed(2) + ' (scaled to fit)';
              } else {
                label += Math.round(value);
              }
              return label;
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Total Value',
            font: {
              weight: 'bold'
            }
          },
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            callback: function(value) {
              // Don't show the scaled values for population score
              return value % 1 === 0 ? value : '';
            }
          }
        },
        y: {
          grid: {
            display: false
          }
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutQuart'
      }
    }
  });
}

// Function to initialize and update the resources bar chart
function initResourcesBarChart(data) {
  if (!data || data.length === 0) {
    console.error('No data provided for resources bar chart');
    return;
  }

  const ctx = document.getElementById('resourcesBarChart');
  if (!ctx) {
    console.error('Resources bar chart canvas not found');
    return;
  }

  // Define the metrics we want to include in the chart
  const metrics = [
    'has_water',
    'has_generator',
    'has_solar_panels',
    'has_fence',
    'has_water_pipeline',
    'restroom_handwash_available',
    'restroom_light_safe',
    'is_warm_in_winter',
    'toilet_water_supply',
    'electricity_supply',
    'internal_electric_condition',
    'lighting_condition',
    'heating_source',
    'heating_condition',
    'drinking_water_source',
    'internet_type',
    'fire_safety',
    'has_cctv',
    'has_transport_nearby',
    'recent_repairs',
    'restroom_location',
    'restroom_water_condition',
    'restroom_has_sewage',
    'restroom_doors',
    'restroom_sewage_issues',
    'restroom_water_issues',
    'restroom_light_safe',
    'satisfaction'
      

  ];

  // Define friendly names for the metrics
  const metricLabels = [
    'Has Water',
    'Has Generator',
    'Has Solar Panels',
    'Has Fence',
    'Has Water Pipeline',
    'Restroom Handwash Available',
    'Restroom Light Safe',
    'Is Warm in Winter',
    'Toilet Water Supply',
    'Electricity Supply',
    'Internal Electric Condition',
    'Lighting Condition',
    'Heating Source',
    'Heating Condition',
    'Drinking Water Source',
    'Internet Type',
    'Fire Safety',
    'Has CCTV',
    'Has Transport Nearby',
    'Recent Repairs',
    'Restroom Location',
    'Restroom Water Condition',
    'Restroom Has Sewage',
    'Restroom Doors',
    'Restroom Sewage Issues',
    'Restroom Water Issues',
    'Restroom Light Safe',
    'Satisfaction'
  ];

  // Calculate percentage of 'Yes' for each metric
  const metricData = metrics.map((metric, index) => {
    const total = data.length;
    if (total === 0) return 0;
    
    const yesCount = data.filter(item => {
      const value = item[metric];
      // Handle different possible 'yes' values
      return value === true || value === 'Yes' || value === 'yes' || value === 1 || value === '1';
    }).length;
    
    return (yesCount / total) * 100; // Convert to percentage
  });

  // Create gradient for bars
  const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 900);
  gradient.addColorStop(0, 'rgba(21, 3, 126, 0.9)');
  gradient.addColorStop(1, 'rgba(16, 0, 105, 0.2)');

  // Destroy existing chart if it exists
  if (resourcesBarChart) {
    resourcesBarChart.destroy();
  }

  // Create new chart
  resourcesBarChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: metricLabels,
      datasets: [{
        label: 'Percentage Available',
        data: metricData,
        backgroundColor: gradient,
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.8,
        categoryPercentage: 0.9
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: false
        },
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.raw.toFixed(1)}%`;
            }
          }
        }
      },
      scales: {
        y: {
          grid: {
            display: false
          },
          ticks: {
            autoSkip: false,
            font: {
              size: 11
            },
            padding: 5
          }
        },
        x: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: 'Percentage',
            font: {
              weight: 'bold'
            }
          },
          ticks: {
            callback: function(value) {
              return value + '%';
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutQuart'
      },
      layout: {
        padding: {
          left: 10,
          right: 10,
          top: 10,
          bottom: 10
        }
      },
      // Adjust height for horizontal bars
      maintainAspectRatio: false,
      aspectRatio: 1.5,
      // Add scrollbar plugin for horizontal scrolling if needed
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.raw.toFixed(1)}%`;
            }
          }
        }
      }
    }
  });
}
