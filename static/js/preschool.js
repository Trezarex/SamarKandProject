// Global variables for preschool data
let preSchoolData = [];
let preSchoolInfrastructureData = [];
let preSchoolPopulationData = [];
let preSchoolResourcesData = [];
let preSchoolDistrictChoices;
let preSchoolChoices;
let filteredPreSchoolData = [];

// DONUT CHARTS
let preSchoolInfraDonutChart = null;
let preSchoolPopulationDonutChart = null;
let preSchoolResourcesDonutChart = null;
let preSchoolInfraDonutObserver = null;
let preSchoolPopulationDonutObserver = null;
let preSchoolResourcesDonutObserver = null;

// BAR CHARTS
let preSchoolInfrastructureBarChart = null;
let preSchoolPopulationBarChart = null;
let preSchoolResourcesBarChart = null;

// MAP
let preSchoolMapInstance;
let preSchoolMapMarkers = [];

// Main function to load preschool data
async function loadPreschoolData() {
  try {
    const response = await fetch('/api/preschool-data');
    const data = await response.json();

    if (data.error) {
      console.error("❌ Error fetching preschool data:", data.error);
      return;
    }

    preSchoolData = data;

    // Process data subsets
    preSchoolInfrastructureData = preSchoolData.map(p => ({
      kindergarten_name: p.kindergarten_name,
      district: p.district,
      outside_branches: p.outside_branches,
      group_count: p.group_count,
      land_area_built: p.land_area_built,
      external_sweeping_area: p.external_sweeping_area,
      internal_cleaning_area: p.internal_cleaning_area,
      garden_area: p.garden_area,
      leased_garden_area: p.leased_garden_area,
      vacant_land_area: p.vacant_land_area,
      educational_building_count: p.educational_building_count,
      floor_count: p.floor_count,
      wall_material: p.wall_material,
      wall_condition: p.wall_condition,
      roof_material: p.roof_material,
      roof_condition: p.roof_condition,
      window_condition: p.window_condition,
      floor_condition: p.floor_condition,
      door_condition: p.door_condition,
      assembly_hall_condition: p.assembly_hall_condition,
      repaired_or_reconstructed: p.repaired_or_reconstructed,
      earthquake_safety: p.earthquake_safety,
      meets_modern_infrastructure: p.meets_modern_infrastructure,
      satisfied_with_condition: p.satisfied_with_condition,
      age_score: p.age_score,
      infrastructure_score: p.infrastructure_score
    }));

    preSchoolPopulationData = preSchoolData.map(p => ({
      kindergarten_name: p.kindergarten_name,
      district: p.district,
      design_capacity: p.design_capacity,
      total_students: p.total_students,
      boys: p.boys,
      girls: p.girls,
      staff_total: p.staff_total,
      staff_men: p.staff_men,
      staff_women: p.staff_women,
      population_score: p.population_score
    }));

    preSchoolResourcesData = preSchoolData.map(p => ({
      kindergarten_name: p.kindergarten_name,
      district: p.district,
      sports_equipment_available: p.sports_equipment_available,
      kitchen_condition: p.kitchen_condition,
      kitchen_water_supply: p.kitchen_water_supply,
      electricity_condition: p.electricity_condition,
      has_generator: p.has_generator,
      has_solar_panels: p.has_solar_panels,
      internal_electrical_condition: p.internal_electrical_condition,
      lighting_condition: p.lighting_condition,
      heating_source: p.heating_source,
      heating_fuel_source: p.heating_fuel_source,
      boiler_room_condition: p.boiler_room_condition,
      internal_heating_condition: p.internal_heating_condition,
      water_availability: p.water_availability,
      drinking_water_source: p.drinking_water_source,
      has_fence: p.has_fence,
      internet_type: p.internet_type,
      internet_usage: p.internet_usage,
      fire_safety_available: p.fire_safety_available,
      has_cctv: p.has_cctv,
      has_public_transport_nearby: p.has_public_transport_nearby,
      accessible_for_disabled: p.accessible_for_disabled,
      restroom_location: p.restroom_location,
      restroom_water_condition: p.restroom_water_condition,
      restroom_connected_to_sewage: p.restroom_connected_to_sewage,
      restroom_doors_partitions: p.restroom_doors_partitions,
      restroom_handwash_water_soap: p.restroom_handwash_water_soap,
      restroom_sewage_issues: p.restroom_sewage_issues,
      restroom_water_issues: p.restroom_water_issues,
      restroom_lighting_safe: p.restroom_lighting_safe,
      classrooms_warm_in_winter: p.classrooms_warm_in_winter,
      indoor_pipeline_installed: p.indoor_pipeline_installed,
      children_walk_more_than_3km: p.children_walk_more_than_3km,
      satisfied_with_condition: p.satisfied_with_condition,
      resources_score: p.resources_score
    }));

    populatePreSchoolFilters();
    updatePreSchoolSummaryCards(preSchoolData);
    applyPreSchoolFilters();

    // Initialize charts after data is loaded
    updatePreSchoolInfraDonutChart(preSchoolInfrastructureData);
    updatePreSchoolPopulationDonutChart(preSchoolPopulationData);
    updatePreSchoolResourcesDonutChart(preSchoolResourcesData);

    initPreSchoolInfrastructureBarChart(preSchoolInfrastructureData);
    initPreSchoolPopulationBarChart(preSchoolPopulationData);
    initPreSchoolResourcesBarChart(preSchoolResourcesData);

    updatePreSchoolPopulationTable(preSchoolPopulationData);
    updatePreSchoolInfrastructureTable(preSchoolInfrastructureData);
    updatePreSchoolResourcesTable(preSchoolResourcesData);

  } catch (error) {
    console.error("❌ Preschool data fetch failed:", error);
  }
}

function populatePreSchoolFilters() {
  const rawDistricts = [...new Set(preSchoolData.map(p => p.district))].sort();
  const rawPreschools = [...new Set(preSchoolData.map(p => p.kindergarten_name))].sort();

  // Initialize Choices
  if (!preSchoolDistrictChoices) {
    preSchoolDistrictChoices = new Choices("#preschoolDistrictFilter", {
      removeItemButton: true,
      placeholderValue: "Select District(s)",
      searchPlaceholderValue: "Search district",
    });
  }

  if (!preSchoolChoices) {
    preSchoolChoices = new Choices("#preschoolEntityFilter", {
      removeItemButton: true,
      placeholderValue: "Select Preschool(s)",
      searchPlaceholderValue: "Search preschool",
    });
  }

  // Set initial choices
  preSchoolDistrictChoices.setChoices(
    rawDistricts.map(d => ({ value: d, label: d })),
    'value', 'label', true
  );

  preSchoolChoices.setChoices(
    rawPreschools.map(p => ({ value: p, label: p })),
    'value', 'label', true
  );

  // Update preschools dynamically when districts change
  document.querySelector("#preschoolDistrictFilter").addEventListener("change", () => {
    const selectedDistricts = preSchoolDistrictChoices.getValue(true);
    const filteredPreschools = preSchoolData
      .filter(p => selectedDistricts.length === 0 || selectedDistricts.includes(p.district))
      .map(p => p.kindergarten_name);

    const uniqueFilteredPreschools = [...new Set(filteredPreschools)].sort();

    preSchoolChoices.clearChoices();
    preSchoolChoices.setChoices(
      uniqueFilteredPreschools.map(p => ({ value: p, label: p })),
      'value', 'label', true
    );
  });
}

function applyPreSchoolFilters() {
  const selectedDistricts = preSchoolDistrictChoices.getValue(true);
  const selectedPreschools = preSchoolChoices.getValue(true);

  filteredPreSchoolData = preSchoolData.filter(p => {
    const districtMatch = selectedDistricts.length === 0 || selectedDistricts.includes(p.district);
    const preschoolMatch = selectedPreschools.length === 0 || selectedPreschools.includes(p.kindergarten_name);
    return districtMatch && preschoolMatch;
  });

  const filteredInfra = preSchoolInfrastructureData.filter(item =>
    filteredPreSchoolData.some(p => p.kindergarten_name === item.kindergarten_name));
  const filteredPopulation = preSchoolPopulationData.filter(item =>
    filteredPreSchoolData.some(p => p.kindergarten_name === item.kindergarten_name));
  const filteredResources = preSchoolResourcesData.filter(item =>
    filteredPreSchoolData.some(p => p.kindergarten_name === item.kindergarten_name));

  // Update all components
  updatePreSchoolSummaryCards(filteredPreSchoolData);
  updatePreSchoolMap(filteredPreSchoolData);

  updatePreSchoolInfraDonutChart(filteredInfra);
  updatePreSchoolPopulationDonutChart(filteredPopulation);
  updatePreSchoolResourcesDonutChart(filteredResources);

  initPreSchoolInfrastructureBarChart(filteredInfra);
  initPreSchoolPopulationBarChart(filteredPopulation);
  initPreSchoolResourcesBarChart(filteredResources);

  updatePreSchoolPopulationTable(filteredPopulation);
  updatePreSchoolInfrastructureTable(filteredInfra);
  updatePreSchoolResourcesTable(filteredResources);
}

function updatePreSchoolSummaryCards(data) {
  // Handle no data case
  if (!data || data.length === 0) {
    document.getElementById("preschoolTotalCount").textContent = "0";
    document.getElementById("preschoolAvgSatisfaction").textContent = "-";
    document.getElementById("preschoolInfraScore").textContent = "-";
    document.getElementById("preschoolResourcesScore").textContent = "-";
    return;
  }

  const total = data.length;
  
  // Calculate averages
  const avgPopulationScore = average(data.map(d => d.population_score));
  const avgInfra = average(data.map(d => d.infrastructure_score));
  const avgResources = average(data.map(d => d.resources_score));

  document.getElementById("preschoolTotalCount").textContent = total;
  document.getElementById("preschoolAvgSatisfaction").textContent = Math.round(avgPopulationScore * 100) + "%";
  document.getElementById("preschoolInfraScore").textContent = Math.round(avgInfra * 100) + "%";
  document.getElementById("preschoolResourcesScore").textContent = Math.round(avgResources * 100) + "%";
}

// PRESCHOOL DONUT CHARTS
function updatePreSchoolInfraDonutChart(infraData) {
  const ctx = document.getElementById('preschoolInfraDonutChart')?.getContext('2d');
  if (!ctx) return;

  // Clean up previous observer
  if (preSchoolInfraDonutObserver) {
    preSchoolInfraDonutObserver.disconnect();
    preSchoolInfraDonutObserver = null;
  }

  // Count preschools by infrastructure score category
  const categories = {
    'RED': 0,
    'YELLOW': 0,
    'GREEN': 0
  };

  infraData.forEach(preschool => {
    const category = getCategoryForScore(preschool.infrastructure_score);
    categories[category]++;
  });

  const labels = Object.keys(categories);
  const data = Object.values(categories);
  const total = data.reduce((a, b) => a + b, 0);

  if (preSchoolInfraDonutChart) preSchoolInfraDonutChart.destroy();

  preSchoolInfraDonutChart = new Chart(ctx, {
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
    preSchoolInfraDonutObserver = new ResizeObserver(() => {
      preSchoolInfraDonutChart.resize();
    });
    preSchoolInfraDonutObserver.observe(container);
  }
}

function updatePreSchoolPopulationDonutChart(populationData) {
  const ctx = document.getElementById('preschoolPopulationDonutChart')?.getContext('2d');
  if (!ctx) return;

  // Clean up previous observer
  if (preSchoolPopulationDonutObserver) {
    preSchoolPopulationDonutObserver.disconnect();
    preSchoolPopulationDonutObserver = null;
  }

  // Count preschools by population score category
  const categories = {
    'RED': 0,
    'YELLOW': 0,
    'GREEN': 0
  };

  populationData.forEach(preschool => {
    const category = getCategoryForScore(preschool.population_score);
    categories[category]++;
  });

  const labels = Object.keys(categories);
  const data = Object.values(categories);
  const total = data.reduce((a, b) => a + b, 0);

  if (preSchoolPopulationDonutChart) preSchoolPopulationDonutChart.destroy();

  preSchoolPopulationDonutChart = new Chart(ctx, {
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
    preSchoolPopulationDonutObserver = new ResizeObserver(() => {
      preSchoolPopulationDonutChart.resize();
    });
    preSchoolPopulationDonutObserver.observe(container);
  }
}

function updatePreSchoolResourcesDonutChart(resourcesData) {
  const ctx = document.getElementById('preschoolResourcesDonutChart')?.getContext('2d');
  if (!ctx) return;

  // Clean up previous observer
  if (preSchoolResourcesDonutObserver) {
    preSchoolResourcesDonutObserver.disconnect();
    preSchoolResourcesDonutObserver = null;
  }

  // Count preschools by resources score category
  const categories = {
    'RED': 0,
    'YELLOW': 0,
    'GREEN': 0
  };

  resourcesData.forEach(preschool => {
    const category = getCategoryForScore(preschool.resources_score);
    categories[category]++;
  });

  const labels = Object.keys(categories);
  const data = Object.values(categories);
  const total = data.reduce((a, b) => a + b, 0);

  if (preSchoolResourcesDonutChart) preSchoolResourcesDonutChart.destroy();

  preSchoolResourcesDonutChart = new Chart(ctx, {
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
    preSchoolResourcesDonutObserver = new ResizeObserver(() => {
      preSchoolResourcesDonutChart.resize();
    });
    preSchoolResourcesDonutObserver.observe(container);
  }
}

function initPreSchoolMap() {
  const mapDiv = document.getElementById('preschoolMap');
  if (!mapDiv) {
    console.warn("🚫 #preschoolMap not found in DOM.");
    return;
  }

  if (!preSchoolMapInstance) {
    preSchoolMapInstance = L.map('preschoolMap').setView([39.8, 66.9], 9);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(preSchoolMapInstance);
  }

  setTimeout(() => {
    preSchoolMapInstance.invalidateSize();
  }, 200);
}

function updatePreSchoolMap(data) {
  if (!preSchoolMapInstance) return;

  // Remove previous markers
  preSchoolMapMarkers.forEach(marker => marker.remove());
  preSchoolMapMarkers = [];

  data.forEach(preschool => {
    if (!preschool.latitude || !preschool.longitude) return;

    const color = preschool.need_category === "RED"
      ? "red"
      : preschool.need_category === "YELLOW"
        ? "orange"
        : "green";

    // Halo effect
    const halo = L.circle([preschool.latitude, preschool.longitude], {
      radius: 300,
      color: color,
      fillColor: color,
      fillOpacity: 0.1,
      stroke: false
    }).addTo(preSchoolMapInstance);

    // Main marker
    const marker = L.circleMarker([preschool.latitude, preschool.longitude], {
      radius: 8,
      color,
      fillColor: color,
      fillOpacity: 0.8
    }).addTo(preSchoolMapInstance);

    marker.bindPopup(`
      <strong>${preschool.kindergarten_name}</strong><br>
      ${preschool.district}<br>
      Need: ${preschool.need_category}<br>
      Population Score: ${Math.round(preschool.population_score * 100)}%<br>
      Infrastructure Score: ${Math.round(preschool.infrastructure_score * 100)}%<br>
      Resources Score: ${Math.round(preschool.resources_score * 100)}%
    `);

    preSchoolMapMarkers.push(marker, halo);
  });

  if (data.length > 0) {
    const latLngs = data
      .filter(p => p.latitude && p.longitude)
      .map(p => [p.latitude, p.longitude]);

    setTimeout(() => {
      preSchoolMapInstance.fitBounds(latLngs, {
        padding: [50, 50],
        maxZoom: 10
      });
      preSchoolMapInstance.invalidateSize();
    }, 200);
  } else {
    preSchoolMapInstance.setView([39.8, 66.9], 9);
  }
}

// PRESCHOOL TABLE UPDATES
function updatePreSchoolPopulationTable(filteredData) {
  const table = document.querySelector('#preschoolPopulationTable tbody');
  table.innerHTML = '';

  filteredData.forEach(preschool => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${preschool.kindergarten_name}</td>
      <td>${preschool.design_capacity || '-'}</td>
      <td>${preschool.total_students || '-'}</td>
      <td>${preschool.staff_total || '-'}</td>
      <td class="score-cell ${getScoreClass(preschool.population_score)}">
        ${formatScore(preschool.population_score)}
      </td>
    `;
    table.appendChild(row);
  });
}

function updatePreSchoolInfrastructureTable(filteredData) {
  const table = document.querySelector('#preschoolInfrastructureTable tbody');
  table.innerHTML = '';

  filteredData.forEach(preschool => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${preschool.kindergarten_name}</td>
      <td>${preschool.outside_branches || '-'}</td>
      <td>${preschool.group_count || '-'}</td>
      <td>${preschool.land_area_built || '-'}</td>
      <td>${preschool.external_sweeping_area || '-'}</td>
      <td>${preschool.internal_cleaning_area || '-'}</td>
      <td>${preschool.garden_area || '-'}</td>
      <td>${preschool.leased_garden_area || '-'}</td>
      <td>${preschool.vacant_land_area || '-'}</td>
      <td>${preschool.educational_building_count || '-'}</td>
      <td>${preschool.floor_count || '-'}</td>
      <td>${preschool.wall_material || '-'}</td>
      <td>${preschool.wall_condition || '-'}</td>
      <td>${preschool.roof_material || '-'}</td>
      <td>${preschool.roof_condition || '-'}</td>
      <td>${preschool.window_condition || '-'}</td>
      <td>${preschool.floor_condition || '-'}</td>
      <td>${preschool.door_condition || '-'}</td>
      <td>${preschool.assembly_hall_condition || '-'}</td>
      <td>${preschool.repaired_or_reconstructed ? 'Yes' : 'No'}</td>
      <td>${preschool.earthquake_safety ? 'Yes' : 'No'}</td>
      <td>${preschool.meets_modern_infrastructure ? 'Yes' : 'No'}</td>
      <td>${preschool.satisfied_with_condition ? 'Yes' : 'No'}</td>
      <td>${preschool.age_score ? formatScore(preschool.age_score) : '-'}</td>
      <td class="score-cell ${getScoreClass(preschool.infrastructure_score)}">
        ${formatScore(preschool.infrastructure_score)}
      </td>
    `;
    table.appendChild(row);
  });
}

function updatePreSchoolResourcesTable(filteredData) {
  const table = document.querySelector('#preschoolResourcesTable tbody');
  table.innerHTML = '';

  filteredData.forEach(preschool => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${preschool.kindergarten_name}</td>
      <td>${preschool.sports_equipment_available || '-'}</td>
      <td>${preschool.kitchen_condition || '-'}</td>
      <td>${preschool.kitchen_water_supply || '-'}</td>
      <td>${preschool.electricity_condition || '-'}</td>
      <td>${preschool.has_generator ? 'Yes' : 'No'}</td>
      <td>${preschool.has_solar_panels ? 'Yes' : 'No'}</td>
      <td>${preschool.internal_electrical_condition || '-'}</td>
      <td>${preschool.lighting_condition || '-'}</td>
      <td>${preschool.heating_source || '-'}</td>
      <td>${preschool.heating_fuel_source || '-'}</td>
      <td>${preschool.boiler_room_condition || '-'}</td>
      <td>${preschool.internal_heating_condition || '-'}</td>
      <td>${preschool.water_availability || '-'}</td>
      <td>${preschool.drinking_water_source || '-'}</td>
      <td>${preschool.has_fence ? 'Yes' : 'No'}</td>
      <td>${preschool.internet_type || '-'}</td>
      <td>${preschool.internet_usage || '-'}</td>
      <td>${preschool.fire_safety_available ? 'Yes' : 'No'}</td>
      <td>${preschool.has_cctv ? 'Yes' : 'No'}</td>
      <td>${preschool.has_public_transport_nearby ? 'Yes' : 'No'}</td>
      <td>${preschool.accessible_for_disabled ? 'Yes' : 'No'}</td>
      <td>${preschool.restroom_location || '-'}</td>
      <td>${preschool.restroom_water_condition || '-'}</td>
      <td>${preschool.restroom_connected_to_sewage ? 'Yes' : 'No'}</td>
      <td>${preschool.restroom_doors_partitions || '-'}</td>
      <td>${preschool.restroom_handwash_water_soap ? 'Yes' : 'No'}</td>
      <td>${preschool.restroom_sewage_issues ? 'Yes' : 'No'}</td>
      <td>${preschool.restroom_water_issues ? 'Yes' : 'No'}</td>
      <td>${preschool.restroom_lighting_safe ? 'Yes' : 'No'}</td>
      <td>${preschool.classrooms_warm_in_winter ? 'Yes' : 'No'}</td>
      <td>${preschool.indoor_pipeline_installed ? 'Yes' : 'No'}</td>
      <td>${preschool.children_walk_more_than_3km ? 'Yes' : 'No'}</td>
      <td>${preschool.satisfied_with_condition ? 'Yes' : 'No'}</td>
      <td class="score-cell ${getScoreClass(preschool.resources_score)}">
        ${formatScore(preschool.resources_score)}
      </td>
    `;
    table.appendChild(row);
  });
}


// Update DOMContentLoaded to initialize all dashboards
document.addEventListener("DOMContentLoaded", () => {
  loadPreschoolData();
  initPreSchoolMap();
});

// Function to initialize and update the infrastructure bar chart
function initPreSchoolInfrastructureBarChart(data) {
  if (!data || data.length === 0) {
    console.error('No data provided for infrastructure bar chart');
    return;
  }

  const ctx = document.getElementById('preschoolInfrastructureBarChart');
  if (!ctx) {
    console.error('Infrastructure bar chart canvas not found');
    return;
  }

  // Define the metrics we want to include in the chart
  const metrics = [
    'kindergarten_name',
    'district',
    'outside_branches',
    'group_count',
    'land_area_built',
    'external_sweeping_area',
    'internal_cleaning_area',
    'garden_area',
    'leased_garden_area',
    'vacant_land_area',
    'educational_building_count',
    'floor_count',
    'wall_material',
    'wall_condition',
    'roof_material',
    'roof_condition',
    'window_condition',
    'floor_condition',
    'door_condition',
    'assembly_hall_condition',
    'repaired_or_reconstructed',
    'earthquake_safety',
    'meets_modern_infrastructure',
    'satisfied_with_condition',
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
  if (preSchoolInfrastructureBarChart) {
    preSchoolInfrastructureBarChart.destroy();
  }

  // Create new chart
  preSchoolInfrastructureBarChart = new Chart(ctx, {
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
              weight: 'bold',
              color: '#000000'
            }
          },
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            color: '#000000'
          }
        },
        y: {
          grid: {
            display: false
          },
          ticks: {
            color: '#000000'
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
function initPreSchoolPopulationBarChart(data) {
  if (!data || data.length === 0) {
    console.error('No data provided for population bar chart');
    return;
  }

  const ctx = document.getElementById('preschoolPopulationBarChart');
  if (!ctx) {
    console.error('Population bar chart canvas not found');
    return;
  }

  // Define the metrics we want to include in the chart
  const metrics = [
    
    'design_capacity',
    'total_students',
    'staff_total',
    
    
    
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
    
    'Design Capacity',
    'Total Students',
   
    'Staff Total',
    
    
    
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
  if (preSchoolPopulationBarChart) {
    preSchoolPopulationBarChart.destroy();
  }

  // Create new chart
  preSchoolPopulationBarChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: displayLabels,
      datasets: [{
        label: 'Total Value',
        data: metricValues,
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',  // Teal for kindergarten name
          'rgba(153, 102, 255, 0.6)', // Purple for district
          'rgba(255, 159, 64, 0.6)',  // Orange for design capacity
          'rgba(255, 99, 132, 0.6)'   // Pink for total students
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
            },
            color: '#000000'
          }
        },
        y: {
          grid: {
            display: false
          },
          ticks: {
            color: '#000000'
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
function initPreSchoolResourcesBarChart(data) {
  if (!data || data.length === 0) {
    console.error('No data provided for resources bar chart');
    return;
  }

  const ctx = document.getElementById('preschoolResourcesBarChart');
  if (!ctx) {
    console.error('Resources bar chart canvas not found');
    return;
  }

  // Define the metrics we want to include in the chart
  const metrics = [
    
    'sports_equipment_available',
    'kitchen_condition',
    'kitchen_water_supply',
    'electricity_condition',
    'has_generator',
    'has_solar_panels',
    'internal_electrical_condition',
    'lighting_condition',
    'heating_source',
    'heating_fuel_source',
    'boiler_room_condition',
    'internal_heating_condition',
    'water_availability',
    'drinking_water_source',
    'has_fence',
    'internet_type',
    'internet_usage',
    'fire_safety_available',
    'has_cctv',
    'has_public_transport_nearby',
    'accessible_for_disabled',
    'restroom_location',
    'restroom_water_condition',
    'restroom_connected_to_sewage',
    'restroom_doors_partitions',
    'restroom_handwash_water_soap',
    'restroom_sewage_issues',
    'restroom_water_issues',
    'restroom_lighting_safe',
    'classrooms_warm_in_winter',
    'indoor_pipeline_installed',
    'children_walk_more_than_3km',
    'satisfied_with_condition',
    
      

  ];

  // Define friendly names for the metrics
  const metricLabels = [
   
    'Sports Equipment Available',
    'Kitchen Condition',
    'Kitchen Water Supply',
    'Electricity Condition',
    'Has Generator',
    'Has Solar Panels',
    'Internal Electrical Condition',
    'Lighting Condition',
    'Heating Source',
    'Heating Fuel Source',
    'Boiler Room Condition',
    'Internal Heating Condition',
    'Water Availability',
    'Drinking Water Source',
    'Has Fence',
    'Internet Type',
    'Internet Usage',
    'Fire Safety Available',
    'Has CCTV',
    'Has Public Transport Nearby',
    'Accessible For Disabled',
    'Restroom Location',
    'Restroom Water Condition',
    'Restroom Connected To Sewage',
    'Restroom Doors Partitions',
    'Restroom Handwash Water Soap',
    'Restroom Sewage Issues',
    'Restroom Water Issues',
    'Restroom Lighting Safe',
    'Classrooms Warm In Winter',
    'Indoor Pipeline Installed',
    'Children Walk More Than 3km',
    'Satisfied With Condition',
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
  if (preSchoolResourcesBarChart) {
    preSchoolResourcesBarChart.destroy();
  }

  // Create new chart
  preSchoolResourcesBarChart = new Chart(ctx, {
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
            padding: 5,
            color: '#000000'
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
            },
            color: '#000000'
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