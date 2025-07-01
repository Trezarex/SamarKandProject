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

function showSection(sectionId) {
  const sections = document.querySelectorAll('.content-section');
  sections.forEach(section => section.classList.remove('active'));

  const activeSection = document.getElementById(sectionId);
  if (activeSection) {
    activeSection.classList.add('active');

    if (sectionId === "hospital-dashboard") {
      // ⏳ Wait until section is visible, then init and resize map
      setTimeout(() => {
        if (!window.hospitalMapInstance) {
          initHospitalMap(); // Only initialize once
        } else {
          hospitalMapInstance.invalidateSize();
        }
      }, 300);
    }
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadHospitalData(); // 🟢 Wait for hospital data to load before drawing charts
  updateInfraDonutChart(hospitalData);
  updatePopulationDonutChart(hospitalData);
  updateResourcesDonutChart(hospitalData);

  loadPreschoolData();      // These can run independently
  loadSchoolData();
  initHospitalMap();        // Initialize map after data is ready
});


// Global variable to hold hospital data
let hospitalData = [];
let infrastructureData = [];
let populationData = [];
let resourcesData = [];
let districtChoices;
let hospitalChoices;
let infraDonutChart = null;
let populationDonutChart = null;
let resourcesDonutChart = null;



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
      infrastructure_score: h.infrastructure_score
    }));


    populationData = hospitalData.map(h => ({
      hospital_name: h.hospital_name,
      medical_staff: h.medical_staff,
      bed_capacity: h.bed_capacity,
      population_score: h.population_score,
      total_staff: h.total_staff
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
      resources_score: h.resources_score
    }));
    populateHospitalFilters();
    // summary cards for full dataset by default
    updateHospitalSummaryCards(hospitalData);
    applyHospitalFilters();

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

  // 🧠 Update hospitals dynamically when districts change
  document.querySelector("#hospitalDistrictFilter").addEventListener("change", () => {
    const selectedDistricts = districtChoices.getValue(true); // array of selected districts

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

function updateInfraDonutChart(data) {
  updateDonutChart(data, 'infraDonutChart', 'infrastructure_score');
}

function updatePopulationDonutChart(data) {
  updateDonutChart(data, 'populationDonutChart', 'population_score');
}

function updateResourcesDonutChart(data) {
  updateDonutChart(data, 'resourcesDonutChart', 'resources_score');
}

function updateDonutChart(data, canvasId, scoreKey) {
  const ctx = document.getElementById(canvasId)?.getContext('2d');
  if (!ctx) return;

  const categories = {
    'Excellent (0.8-1.0)': 0,
    'Good (0.6-0.79)': 0,
    'Average (0.4-0.59)': 0,
    'Poor (0.2-0.39)': 0,
    'Critical (0-0.19)': 0
  };

  data.forEach(hospital => {
    const score = parseFloat(hospital[scoreKey]) || 0;
    if (score >= 0.8) categories['Excellent (0.8-1.0)']++;
    else if (score >= 0.6) categories['Good (0.6-0.79)']++;
    else if (score >= 0.4) categories['Average (0.4-0.59)']++;
    else if (score >= 0.2) categories['Poor (0.2-0.39)']++;
    else categories['Critical (0-0.19)']++;
  });

  const labels = Object.keys(categories);
  const values = Object.values(categories);
  const total = values.reduce((a, b) => a + b, 0);

  const backgroundColors = [
    'rgba(40, 167, 69, 0.7)',
    'rgba(0, 123, 255, 0.7)',
    'rgba(255, 193, 7, 0.7)',
    'rgba(255, 152, 0, 0.7)',
    'rgba(220, 53, 69, 0.7)'
  ];

  const chartMap = {
    'infraDonutChart': infraDonutChart,
    'populationDonutChart': populationDonutChart,
    'resourcesDonutChart': resourcesDonutChart
  };

  // Destroy if exists
  if (chartMap[canvasId]) chartMap[canvasId].destroy();

  const chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: backgroundColors,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: { position: 'right' },
        tooltip: {
          callbacks: {
            label: context => {
              const label = context.label || '';
              const value = context.raw || 0;
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  });

  if (canvasId === 'infraDonutChart') infraDonutChart = chart;
  if (canvasId === 'populationDonutChart') populationDonutChart = chart;
  if (canvasId === 'resourcesDonutChart') resourcesDonutChart = chart;
}


let filteredHospitalData = [];

function applyHospitalFilters() {
  const selectedDistricts = districtChoices.getValue(true); // array of selected district values
  const selectedHospitals = hospitalChoices.getValue(true); // array of selected hospital names

  // Filter hospitalData based on both
  filteredHospitalData = hospitalData.filter(h => {
    const districtMatch = selectedDistricts.length === 0 || selectedDistricts.includes(h.district);
    const hospitalMatch = selectedHospitals.length === 0 || selectedHospitals.includes(h.hospital_name);
    return districtMatch && hospitalMatch;
  });
  updateHospitalSummaryCards(filteredHospitalData);
  updateHospitalMap(filteredHospitalData);
  updateInfraDonutChart(filteredHospitalData);
  updatePopulationDonutChart(filteredHospitalData);
  updateResourcesDonutChart(filteredHospitalData);
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


let hospitalMapInstance;

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

  // ✅ Force Leaflet to calculate layout after brief delay
  setTimeout(() => {
    hospitalMapInstance.invalidateSize();
  }, 200);
}

let mapMarkers = [];

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

    // 🔵 Transparent circle halo (outer layer)
    const halo = L.circle([hospital.latitude, hospital.longitude], {
      radius: 300, // in meters
      color: color,
      fillColor: color,
      fillOpacity: 0.1,
      stroke: false
    }).addTo(hospitalMapInstance);

    // 🔴 Main marker (inner dot)
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

    mapMarkers.push(marker);
    mapMarkers.push(halo);
  });

  // 🧭 Auto-fit the map view to visible markers after slight delay
  if (data.length > 0) {
    const latLngs = data
      .filter(h => h.latitude && h.longitude)
      .map(h => [h.latitude, h.longitude]);

    // ⏳ Delay ensures markers are fully added before fitting
    setTimeout(() => {
      hospitalMapInstance.fitBounds(latLngs, {
        padding: [50, 50],
        maxZoom: 10 // prevents zooming in too close
      });
      hospitalMapInstance.invalidateSize(); // ensure layout fix
    }, 200);
  } else {
    // fallback view
    hospitalMapInstance.setView([39.8, 66.9], 9);
  }
}


