// Global variables for school data
let schoolData = [];
let schoolInfrastructureData = [];
let schoolPopulationData = [];
let schoolResourcesData = [];
let schoolDistrictChoices;
let schoolChoices;
let filteredSchoolData = [];

// DONUT CHARTS
let schoolInfraDonutChart = null;
let schoolPopulationDonutChart = null;
let schoolResourcesDonutChart = null;
let schoolInfraDonutObserver = null;
let schoolPopulationDonutObserver = null;
let schoolResourcesDonutObserver = null;

// BAR CHARTS
let schoolInfrastructureBarChart = null;
let schoolPopulationBarChart = null;
let schoolResourcesBarChart = null;


// MAP
let schoolMapInstance;
let schoolMapMarkers = [];

// Main function to load school data from backend
async function loadSchoolData() {
  try {
    const response = await fetch('/api/school-data');
    const data = await response.json();

    if (data.error) {
      console.error("❌ Error fetching school data:", data.error);
      return;
    }

    schoolData = data;
    schoolInfrastructureData = schoolData.map(h => ({
      school_name: h.school_name,
      district: h.district,
      wall_material: h.wall_material,
      wall_condition: h.wall_condition,
      roof_material: h.roof_material,
      roof_condition: h.roof_condition,
      windows_condition: h.windows_condition,
      floor_condition: h.floor_condition,
      door_condition: h.door_condition,
      library_condition: h.library_condition,
      gym_condition: h.gym_condition,
      stadium_condition: h.stadium_condition,
      hall_condition: h.hall_condition,
      kitchen_condition: h.kitchen_condition,
      boiler_condition: h.boiler_condition,
      heating_system_y: h.heating_system_y,
      sewage_connection: h.sewage_connection,
      dining_condition: h.dining_condition,
      boundary_wall: h.boundary_wall,
      repairs_done: h.repairs_done,
      earthquake_safety: h.earthquake_safety,
      distance_to_school: h.distance_to_school,
      outdoor_restroom_material: h.outdoor_restroom_material,
      outdoor_restroom_condition: h.outdoor_restroom_condition,
      indoor_restroom_condition: h.indoor_restroom_condition,
      infrastructure_score: h.infrastructure_score
    }));
    schoolPopulationData = schoolData.map(h => ({
      school_name: h.school_name,
      district: h.district,
      usage_percent: h["usage %"],
      population_score: h.population_score
    }));
    schoolResourcesData = schoolData.map(h => ({
      school_name: h.school_name,
      district: h.district,
      sports_equipment: h.sports_equipment,
      drinking_water: h.drinking_water,
      generator: h.generator,
      solar_panels: h.solar_panels,
      heating_system_x: h.heating_system_x,
      fuel_source: h.fuel_source,
      water: h.water,
      drinking_water_supply: h.drinking_water_supply,
      internet_connection: h.internet_connection,
      internet_usage: h.internet_usage,
      fire_safety: h.fire_safety,
      video_surveillance: h.video_surveillance,
      public_transport: h.public_transport,
      musculoskeletal_disorders_facilities: h.musculoskeletal_disorders_facilities,
      restroom_location: h.restroom_location,
      restroom_stalls: h.restroom_stalls,
      handwashing: h.handwashing,
      restroom_safe: h.restroom_safe,
      restroom_connection: h.restroom_connection,
      classrooms_warm: h.classrooms_warm,
      water_pipeline: h.water_pipeline,
      resources_score: h.resources_score,
      electrical_system: h.electrical_system,
      lighting_system: h.lighting_system,
      boiler_condition: h.boiler_condition,
      restroom_water: h.restroom_water,
      water_supply_issues: h.water_supply_issues,
      restroom_lighting: h.restroom_lighting,
      restroom_pathway: h.restroom_pathway,
      modern_standards: h.modern_standards,
      satisfaction: h.satisfaction
    }));
    populateSchoolFilters();
    updateSchoolSummaryCards(schoolData);
    applySchoolFilters();

    // Initialize charts after data is loaded
    updateSchoolInfraDonutChart(schoolInfrastructureData);
    updateSchoolPopulationDonutChart(schoolPopulationData);
    updateSchoolResourcesDonutChart(schoolResourcesData);

    initSchoolInfrastructureBarChart(schoolData);
    initSchoolPopulationBarChart(schoolData);
    initSchoolResourcesBarChart(schoolData);

    updateSchoolPopulationTable(schoolPopulationData);
    updateSchoolInfrastructureTable(schoolInfrastructureData);
    updateSchoolResourcesTable(schoolResourcesData);

  } catch (error) {
    console.error("❌ School data fetch failed:", error);
  }
}



function populateSchoolFilters() {
  const rawDistricts = [...new Set(schoolData.map(s => s.district))].sort();
  const rawSchools = [...new Set(schoolData.map(s => s.school_name))].sort();

  // Initialize Choices
  if (!schoolDistrictChoices) {
    schoolDistrictChoices = new Choices("#schoolDistrictFilter", {
      removeItemButton: true,
      placeholderValue: "Select District(s)",
      searchPlaceholderValue: "Search district",
    });
  }

  if (!schoolChoices) {
    schoolChoices = new Choices("#schoolEntityFilter", {
      removeItemButton: true,
      placeholderValue: "Select School(s)",
      searchPlaceholderValue: "Search school",
    });
  }

  // Set initial choices
  schoolDistrictChoices.setChoices(
    rawDistricts.map(d => ({ value: d, label: d })),
    'value', 'label', true
  );

  schoolChoices.setChoices(
    rawSchools.map(s => ({ value: s, label: s })),
    'value', 'label', true
  );

  // Update schools dynamically when districts change
  document.querySelector("#schoolDistrictFilter").addEventListener("change", () => {
    const selectedDistricts = schoolDistrictChoices.getValue(true);
    const filteredSchools = schoolData
      .filter(s => selectedDistricts.length === 0 || selectedDistricts.includes(s.district))
      .map(s => s.school_name);

    const uniqueFilteredSchools = [...new Set(filteredSchools)].sort();

    schoolChoices.clearChoices();
    schoolChoices.setChoices(
      uniqueFilteredSchools.map(s => ({ value: s, label: s })),
      'value', 'label', true
    );
  });
}

function applySchoolFilters() {
  const selectedDistricts = schoolDistrictChoices.getValue(true);
  const selectedSchools = schoolChoices.getValue(true);

  filteredSchoolData = schoolData.filter(s => {
    const districtMatch = selectedDistricts.length === 0 || selectedDistricts.includes(s.district);
    const schoolMatch = selectedSchools.length === 0 || selectedSchools.includes(s.school_name);
    return districtMatch && schoolMatch;
  });

  const filteredInfra = schoolInfrastructureData.filter(item =>
    filteredSchoolData.some(s => s.school_name === item.school_name));
  const filteredPopulation = schoolPopulationData.filter(item =>
    filteredSchoolData.some(s => s.school_name === item.school_name));
  const filteredResources = schoolResourcesData.filter(item =>
    filteredSchoolData.some(s => s.school_name === item.school_name));

  // Update all components
  updateSchoolSummaryCards(filteredSchoolData);
  updateSchoolMap(filteredSchoolData);

  updateSchoolInfraDonutChart(filteredInfra);
  updateSchoolPopulationDonutChart(filteredPopulation);
  updateSchoolResourcesDonutChart(filteredResources);

  initSchoolInfrastructureBarChart(filteredSchoolData);
  initSchoolPopulationBarChart(filteredSchoolData);
  initSchoolResourcesBarChart(filteredSchoolData);

  updateSchoolPopulationTable(filteredPopulation);
  updateSchoolInfrastructureTable(filteredInfra);
  updateSchoolResourcesTable(filteredResources);
}

function updateSchoolSummaryCards(data) {
  // Handle no data case
  if (!data || data.length === 0) {
    document.getElementById("schoolTotalCount").textContent = "0";
    document.getElementById("schoolAvgSatisfaction").textContent = "-";
    document.getElementById("schoolInfraScore").textContent = "-";
    document.getElementById("schoolResourcesScore").textContent = "-";
    return;
  }

  const total = data.length;
  const avgPopulationScore = average(data.map(d => d.population_score));
  const avgInfra = average(data.map(d => d.infrastructure_score));
  const avgResources = average(data.map(d => d.resources_score));

  document.getElementById("schoolTotalCount").textContent = total;
  document.getElementById("schoolAvgSatisfaction").textContent = Math.round(avgPopulationScore * 100) + "%";
  document.getElementById("schoolInfraScore").textContent = Math.round(avgInfra * 100) + "%";
  document.getElementById("schoolResourcesScore").textContent = Math.round(avgResources * 100) + "%";
}

// SCHOOL DONUT CHARTS
function updateSchoolInfraDonutChart(infraData) {
  const ctx = document.getElementById('schoolInfraDonutChart')?.getContext('2d');
  if (!ctx) return;

  // Clean up previous observer
  if (schoolInfraDonutObserver) {
    schoolInfraDonutObserver.disconnect();
    schoolInfraDonutObserver = null;
  }

  // Count schools by infrastructure score category
  const categories = {
    'RED': 0,
    'YELLOW': 0,
    'GREEN': 0
  };

  infraData.forEach(school => {
    const category = getCategoryForScore(school.infrastructure_score);
    categories[category]++;
  });

  const labels = Object.keys(categories);
  const data = Object.values(categories);
  const total = data.reduce((a, b) => a + b, 0);

  if (schoolInfraDonutChart) schoolInfraDonutChart.destroy();

  schoolInfraDonutChart = new Chart(ctx, {
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
    schoolInfraDonutObserver = new ResizeObserver(() => {
      schoolInfraDonutChart.resize();
    });
    schoolInfraDonutObserver.observe(container);
  }
}

function updateSchoolPopulationDonutChart(populationData) {
  const ctx = document.getElementById('schoolPopulationDonutChart')?.getContext('2d');
  if (!ctx) return;

  // Clean up previous observer
  if (schoolPopulationDonutObserver) {
    schoolPopulationDonutObserver.disconnect();
    schoolPopulationDonutObserver = null;
  }

  // Count schools by population score category
  const categories = {
    'RED': 0,
    'YELLOW': 0,
    'GREEN': 0
  };

  populationData.forEach(school => {
    const category = getCategoryForScore(school.population_score);
    categories[category]++;
  });

  const labels = Object.keys(categories);
  const data = Object.values(categories);
  const total = data.reduce((a, b) => a + b, 0);

  if (schoolPopulationDonutChart) schoolPopulationDonutChart.destroy();

  schoolPopulationDonutChart = new Chart(ctx, {
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
    schoolPopulationDonutObserver = new ResizeObserver(() => {
      schoolPopulationDonutChart.resize();
    });
    schoolPopulationDonutObserver.observe(container);
  }
}

function updateSchoolResourcesDonutChart(resourcesData) {
  const ctx = document.getElementById('schoolResourcesDonutChart')?.getContext('2d');
  if (!ctx) return;

  // Clean up previous observer
  if (schoolResourcesDonutObserver) {
    schoolResourcesDonutObserver.disconnect();
    schoolResourcesDonutObserver = null;
  }

  // Count schools by resources score category
  const categories = {
    'RED': 0,
    'YELLOW': 0,
    'GREEN': 0
  };

  resourcesData.forEach(school => {
    const category = getCategoryForScore(school.resources_score);
    categories[category]++;
  });

  const labels = Object.keys(categories);
  const data = Object.values(categories);
  const total = data.reduce((a, b) => a + b, 0);

  if (schoolResourcesDonutChart) schoolResourcesDonutChart.destroy();

  schoolResourcesDonutChart = new Chart(ctx, {
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
    schoolResourcesDonutObserver = new ResizeObserver(() => {
      schoolResourcesDonutChart.resize();
    });
    schoolResourcesDonutObserver.observe(container);
  }
}

function initSchoolMap() {
  const mapDiv = document.getElementById('schoolMap');
  if (!mapDiv) {
    console.warn("🚫 #schoolMap not found in DOM.");
    return;
  }

  if (!schoolMapInstance) {
    schoolMapInstance = L.map('schoolMap').setView([39.8, 66.9], 9);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(schoolMapInstance);
  }

  setTimeout(() => {
    schoolMapInstance.invalidateSize();
  }, 200);
}

function updateSchoolMap(data) {
  if (!schoolMapInstance) return;

  // Remove previous markers
  schoolMapMarkers.forEach(marker => marker.remove());
  schoolMapMarkers = [];

  data.forEach(school => {
    if (!school.latitude || !school.longitude) return;

    const color = school.need_category === "RED"
      ? "red"
      : school.need_category === "YELLOW"
        ? "orange"
        : "green";

    // Halo effect
    const halo = L.circle([school.latitude, school.longitude], {
      radius: 300,
      color: color,
      fillColor: color,
      fillOpacity: 0.1,
      stroke: false
    }).addTo(schoolMapInstance);

    // Main marker
    const marker = L.circleMarker([school.latitude, school.longitude], {
      radius: 8,
      color,
      fillColor: color,
      fillOpacity: 0.8
    }).addTo(schoolMapInstance);

    marker.bindPopup(`
      <strong>${school.school_name}</strong><br>
      ${school.district}<br>
      Need: ${school.need_category}<br>
      Population Score: ${Math.round(school.population_score * 100)}%<br>
      Infrastructure Score: ${Math.round(school.infrastructure_score * 100)}%<br>
      Resources Score: ${Math.round(school.resources_score * 100)}%
    `);

    schoolMapMarkers.push(marker, halo);
  });

  if (data.length > 0) {
    const latLngs = data
      .filter(s => s.latitude && s.longitude)
      .map(s => [s.latitude, s.longitude]);

    setTimeout(() => {
      schoolMapInstance.fitBounds(latLngs, {
        padding: [50, 50],
        maxZoom: 10
      });
      schoolMapInstance.invalidateSize();
    }, 200);
  } else {
    schoolMapInstance.setView([39.8, 66.9], 9);
  }
}

// SCHOOL TABLE UPDATES
function updateSchoolPopulationTable(filteredData) {
  const table = document.querySelector('#schoolPopulationTable tbody');
  table.innerHTML = '';

  filteredData.forEach(school => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${school.school_name}</td>
      <td>${school.usage_percent}%</td>
      <td class="score-cell ${getScoreClass(school.population_score)}">
        ${formatScore(school.population_score)}
      </td>
    `;
    table.appendChild(row);
  });
}

function updateSchoolInfrastructureTable(filteredData) {
  const table = document.querySelector('#schoolInfrastructureTable tbody');
  table.innerHTML = '';

  filteredData.forEach(school => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${school.school_name}</td>
      <td>${school.wall_material}</td>
      <td>${school.wall_condition}</td>
      <td>${school.roof_material}</td>
      <td>${school.roof_condition}</td>
      <td>${school.windows_condition}</td>
      <td class="score-cell ${getScoreClass(school.infrastructure_score)}">
        ${formatScore(school.infrastructure_score)}
      </td>
    `;
    table.appendChild(row);
  });
}

function updateSchoolResourcesTable(filteredData) {
  const table = document.querySelector('#schoolResourcesTable tbody');
  table.innerHTML = '';

  filteredData.forEach(school => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${school.school_name}</td>
      <td>${school.drinking_water}</td>
      <td>${school.generator ? 'Yes' : 'No'}</td>
      <td>${school.solar_panels ? 'Yes' : 'No'}</td>
      <td>${school.internet_connection}</td>
      <td>${school.fire_safety}</td>
      <td>${school.restroom_location}</td>
      <td class="score-cell ${getScoreClass(school.resources_score)}">
        ${formatScore(school.resources_score)}
      </td>
    `;
    table.appendChild(row);
  });
}

// Update DOMContentLoaded to initialize both dashboards
document.addEventListener("DOMContentLoaded", () => {
  // Initialize school dashboard
  loadSchoolData();
  initSchoolMap();
});
// ....................................school bar charts................................

// Function to initialize and update the infrastructure bar chart
function initSchoolInfrastructureBarChart(data) {
  if (!data || data.length === 0) {
    console.error('No data provided for infrastructure bar chart');
    return;
  }

  const ctx = document.getElementById('schoolInfrastructureBarChart');
  if (!ctx) {
    console.error('Infrastructure bar chart canvas not found');
    return;
  }

  // Define the metrics we want to include in the chart
  const metrics = [
   
      'school_name',
      'district',
      'wall_material',
      'wall_condition',
      'roof_material',
      'roof_condition',
      'windows_condition',
      'floor_condition',
      'door_condition',
      'library_condition',
      'gym_condition',
      'stadium_condition',
      'hall_condition',
      'kitchen_condition',
      'boiler_condition',
      'heating_system_y',
      'sewage_connection',
      'dining_condition',
      'boundary_wall',
      'repairs_done',
      'earthquake_safety',
      'distance_to_school',
      'outdoor_restroom_material',
      'outdoor_restroom_condition',
      'indoor_restroom_condition'
    
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
  const validSchoolMetrics = [];
  const validSchoolAverages = [];
  
  metrics.forEach((metric, index) => {
    if (metricAverages[index] > 0) {
      // Format the metric name for display
      const displaySchoolName = metric
        .replace(/_/g, ' ') // Replace underscores with spaces
        .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letter of each word
      
      validSchoolMetrics.push(displaySchoolName);
      validSchoolAverages.push(metricAverages[index]);
    }
  });

  // If no valid data, show a message
  if (validSchoolMetrics.length === 0) {
    ctx.parentElement.innerHTML = '<p>No infrastructure data available for the selected filters.</p>';
    return;
  }

  // Destroy existing chart if it exists
  if (schoolInfrastructureBarChart) {
    schoolInfrastructureBarChart.destroy();
  }

  // Create new chart
  schoolInfrastructureBarChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: validSchoolMetrics,
      datasets: [{
        label: 'Average Value',
        data: validSchoolAverages,
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
function initSchoolPopulationBarChart(data) {
  if (!data || data.length === 0) {
    console.error('No data provided for population bar chart');
    return;
  }

  const ctx = document.getElementById('schoolPopulationBarChart');
  if (!ctx) {
    console.error('Population bar chart canvas not found');
    return;
  }

  // Define the metrics we want to include in the chart
  const schoolMetrics = [
    'school_name',
    'district',
    'usage_percent',
    
  ];

  // Calculate values for each metric
  const schoolMetricValues = schoolMetrics.map(metric => {
    const values = data.map(item => {
      // Convert to number and handle non-numeric values
      const value = parseFloat(item[metric]);
      return isNaN(value) ? 0 : value;
    });
    
    // Calculate sum for the metric
    return values.reduce((a, b) => a + b, 0);
  });

  // Format labels for display
  const schoolDisplayLabels = [
    'School Name',
    'District',
    'Usage Percent',
    
  ];

  // Scale the population score for better visualization
  const populationScoreIndex = schoolMetrics.indexOf('population_score');
  if (populationScoreIndex !== -1) {
    const maxValue = Math.max(...schoolMetricValues.filter((_, i) => i !== populationScoreIndex));
    if (maxValue > 0) {
      const scaleFactor = maxValue * 1.5; // Scale to make it visible but not dominate
      schoolMetricValues[populationScoreIndex] = schoolMetricValues[populationScoreIndex] * scaleFactor;
    }
  }

  // Destroy existing chart if it exists
  if (schoolPopulationBarChart) {
    schoolPopulationBarChart.destroy();
  }

  // Create new chart
  schoolPopulationBarChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: schoolDisplayLabels,
      datasets: [{
        label: 'Total Value',
        data: schoolMetricValues,
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',  // Teal for school name
          'rgba(153, 102, 255, 0.6)', // Purple for district
          'rgba(255, 159, 64, 0.6)',  // Orange for usage percent
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
function initSchoolResourcesBarChart(data) {
  if (!data || data.length === 0) {
    console.error('No data provided for resources bar chart');
    return;
  }

  const ctx = document.getElementById('schoolResourcesBarChart');
  if (!ctx) {
    console.error('Resources bar chart canvas not found');
    return;
  }

  // Define the metrics we want to include in the chart
  const metrics = [
    'school_name',
    'district',
    'sports_equipment',
    'drinking_water',
    'generator',
    'solar_panels',
    'heating_system_x',
    'fuel_source',
    'water',
    'drinking_water_supply',
    'internet_connection',
    'internet_usage',
    'fire_safety',
    'video_surveillance',
    'public_transport',
    'musculoskeletal_disorders_facilities',
    'restroom_location',
    'restroom_stalls',
    'handwashing',
    'restroom_safe',
    'restroom_connection',
    'classrooms_warm',
    'water_pipeline',
    'resources_score',
    'electrical_system',
    'lighting_system',
    'boiler_condition',
    'restroom_water',
    'water_supply_issues',
    'restroom_lighting',
    'restroom_pathway',
    'modern_standards',
    'satisfaction'
      

  ];

  // Define friendly names for the metrics
  const metricLabels = [
    'School Name',
    'District',
    'Sports Equipment',
    'Drinking Water',
    'Generator',
    'Solar Panels',
    'Heating System',
    'Fuel Source',
    'Water',
    'Drinking Water Supply',
    'Internet Connection',
    'Internet Usage',
    'Fire Safety',
    'Video Surveillance',
    'Public Transport',
    'Musculoskeletal Disorders Facilities',
    'Restroom Location',
    'Restroom Stalls',
    'Handwashing',
    'Restroom Safe',
    'Restroom Connection',
    'Classrooms Warm',
    'Water Pipeline',
    'Resources Score',
    'Electrical System',
    'Lighting System',
    'Boiler Condition',
    'Restroom Water',
    'Water Supply Issues',
    'Restroom Lighting',
    'Restroom Pathway',
    'Modern Standards',
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
              return context.raw.toFixed(1) + '%';
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
              return context.raw.toFixed(1) + '%';
            }
          }
        }
      }
    }
  });
}