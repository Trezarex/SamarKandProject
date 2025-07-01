// ========================
// PRESCHOOL DASHBOARD CODE
// ========================

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