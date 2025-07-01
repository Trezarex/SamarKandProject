
// Unified navigation function for showing/hiding sections and dashboards
function showSection(sectionId) {
  // Hide all content sections
  const sections = document.querySelectorAll('.content-section');
  sections.forEach(section => {
    section.classList.remove('active');
  });
  // Show the selected section
  const activeSection = document.getElementById(sectionId);
  if (activeSection) {
    activeSection.classList.add('active');

    // ✅ Fix Leaflet map not rendering immediately
    if (sectionId === "hospital-dashboard" && window.hospitalMapInstance) {
      setTimeout(() => {
        window.hospitalMapInstance.invalidateSize();
      }, 300);
    }
  }
}
document.addEventListener("DOMContentLoaded", () => {
  loadHospitalData();
  loadPreschoolData();
  loadSchoolData();
});

// Global variable to hold hospital data
let hospitalData = [];
let infrastructureData = [];
let populationData = [];
let resourcesData = [];
let districtChoices;
let hospitalChoices;




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

  console.log("🔍 Filtered hospital data:", filteredHospitalData);

  // TODO: Use `filteredHospitalData` to update:
  // updateHospitalSummaryCards(filteredHospitalData);
  // updateHospitalCharts(filteredHospitalData);
  // updateHospitalMap(filteredHospitalData);
  // updateHospitalTables(filteredHospitalData);
}


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

  const avgSatisfaction = average(data.map(d => d.population_score));
  const avgInfra = average(data.map(d => d.infrastructure_score));
  const avgResources = average(data.map(d => d.resources_score));

  document.getElementById("hospitalTotalCount").textContent = total;
  document.getElementById("hospitalAvgSatisfaction").textContent = avgSatisfaction.toFixed(2);
  document.getElementById("hospitalInfraScore").textContent = avgInfra.toFixed(2);
  document.getElementById("hospitalResourcesScore").textContent = avgResources.toFixed(2);
}

// Utility function
function average(arr) {
  const valid = arr.filter(v => typeof v === 'number' && !isNaN(v));
  if (valid.length === 0) return 0;
  return valid.reduce((sum, val) => sum + val, 0) / valid.length;
}
