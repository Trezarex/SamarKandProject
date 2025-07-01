// Function to auto-hide/show sidebar based on mouse position
let sidebarVisible = true;
const sidebar = document.querySelector('.nav-sidebar');

document.addEventListener('mousemove', (e) => {
  const x = e.clientX;

  // Show sidebar if mouse is near the left edge
  if (x < 30 && !sidebarVisible) {
    sidebar.classList.remove('hidden');
    sidebarVisible = true;
  }

  // Hide sidebar if mouse moves far right
  if (x > 300 && sidebarVisible) {
    sidebar.classList.add('hidden');
    sidebarVisible = false;
  }
});

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

function showSection(sectionId) {
  const sections = document.querySelectorAll('.content-section');
  sections.forEach(section => section.classList.remove('active'));

  const activeSection = document.getElementById(sectionId);
  if (activeSection) {
    activeSection.classList.add('active');

    if (sectionId === "hospital-dashboard") {
      setTimeout(() => {
        // Handle map
        if (!window.hospitalMapInstance) {
          initHospitalMap();
        } else {
          hospitalMapInstance.invalidateSize();
        }

        // Handle charts
        if (infraDonutChart) infraDonutChart.update();
        if (populationDonutChart) populationDonutChart.update();
        if (resourcesDonutChart) resourcesDonutChart.update();
      }, 300);
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadHospitalData();
  // These would be defined in other files
  // loadPreschoolData();
  // loadSchoolData();
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