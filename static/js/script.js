
// Unified navigation function for showing/hiding sections and dashboards
function showSection(sectionId) {
    // Hide all content sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    // Show the selected section
    const activeSection = document.getElementById(sectionId);
    if (activeSection) activeSection.classList.add('active');
}
document.addEventListener("DOMContentLoaded", () => {
  loadHospitalDashboardData();
  loadPreschoolDashboardData();
  loadSchoolDashboardData();
});

function loadHospitalDashboardData() {
  fetchAndRenderHospitalData();
  populateHospitalFilters();
}

// =======================
// Fetch + Render Main Function
// =======================
function fetchAndRenderHospitalData() {
  const region = document.getElementById("hospitalRegionFilter").value;
  const district = document.getElementById("hospitalDistrictFilter").value;
  const hospital = document.getElementById("hospitalEntityFilter").value;

  const url = new URL("/api/hospital-data", window.location.origin);
  if (region) url.searchParams.append("region", region);
  if (district) url.searchParams.append("district", district);
  if (hospital) url.searchParams.append("hospital_name", hospital);

  document.getElementById("hospitalDashboardOverlay").style.display = "block";

  fetch(url)
    .then(res => res.json())
    .then(data => {
      document.getElementById("hospitalDashboardOverlay").style.display = "none";
      if (data.summary) {
        updateHospitalSummaryCards(data.summary);
        renderHospitalCharts(data.charts);
      } else {
        alert("No data available for the selected filters.");
      }
    })
    .catch(err => {
      document.getElementById("hospitalDashboardOverlay").style.display = "none";
      alert("Failed to load data for the selected filters.");
      console.error("Error loading hospital dashboard:", err);
    });
}

// =======================
// Update Summary Cards
// =======================
function updateHospitalSummaryCards(summary) {
  document.getElementById("hospitalTotalCount").innerText = summary.total_count;
  document.getElementById("hospitalAvgSatisfaction").innerText = summary.avg_satisfaction;
  document.getElementById("hospitalInfraScore").innerText = summary.infrastructure_score;
  document.getElementById("hospitalResourcesScore").innerText = summary.resources_score;
}

// =======================
// Filter Logic
// =======================
function populateHospitalFilters() {
  fetch("/api/hospital-data")
    .then(res => res.json())
    .then(data => {
      if (!data) return;
      fetch("/api/hospital-data")
        .then(res => res.json())
        .then(data => {
          const regionSet = new Set();
          const districtSet = new Set();
          const hospitalSet = new Set();

          data.charts.infra_vs_resources.forEach(item => {
            hospitalSet.add(item.hospital_name);
          });
          data.charts.regional_comparison.forEach(item => {
            regionSet.add(item.region);
          });

          // Since district info isn't in regional_comparison, fallback
          data.charts.infra_vs_resources.forEach(item => {
            if (item.district) districtSet.add(item.district);
          });

          setSelectOptions("hospitalRegionFilter", regionSet);
          setSelectOptions("hospitalDistrictFilter", districtSet);
          setSelectOptions("hospitalEntityFilter", hospitalSet);
        });
    });
}

function setSelectOptions(elementId, valuesSet) {
  const select = document.getElementById(elementId);
  select.innerHTML = `<option value="">All</option>`;
  Array.from(valuesSet)
    .sort()
    .forEach(val => {
      const option = document.createElement("option");
      option.value = val;
      option.textContent = val;
      select.appendChild(option);
    });
}

// =======================
// Chart Rendering
// =======================

let hospitalInfraChart, hospitalSatisfactionChart, hospitalRegionalChart, hospitalPerformanceChart;

function renderHospitalCharts(data) {
  renderInfraVsResources(data.infra_vs_resources);
  renderSatisfactionDistribution(data.satisfaction_distribution);
  renderRegionalComparison(data.regional_comparison);
  renderPerformanceMetrics(data.performance_metrics);
}

function renderInfraVsResources(rows) {
  const labels = rows.map(d => d.hospital_name);
  const infra = rows.map(d => d.infrastructure_score);
  const resources = rows.map(d => d.resources_score);

  if (hospitalInfraChart) hospitalInfraChart.destroy();
  hospitalInfraChart = new Chart(document.getElementById("hospitalInfraChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Infrastructure", data: infra },
        { label: "Resources", data: resources }
      ]
    }
  });
}

function renderSatisfactionDistribution(values) {
  if (hospitalSatisfactionChart) hospitalSatisfactionChart.destroy();
  hospitalSatisfactionChart = new Chart(document.getElementById("hospitalSatisfactionChart"), {
    type: "bar",
    data: {
      labels: values.map((_, i) => `Score ${i + 1}`),
      datasets: [{ label: "Satisfaction", data: values }]
    }
  });
}

function renderRegionalComparison(rows) {
  const labels = rows.map(d => d.region);
  const infra = rows.map(d => d.infrastructure_score);
  const resources = rows.map(d => d.resources_score);

  if (hospitalRegionalChart) hospitalRegionalChart.destroy();
  hospitalRegionalChart = new Chart(document.getElementById("hospitalRegionalChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Infrastructure", data: infra },
        { label: "Resources", data: resources }
      ]
    }
  });
}

function renderPerformanceMetrics(data) {
  if (hospitalPerformanceChart) hospitalPerformanceChart.destroy();
  hospitalPerformanceChart = new Chart(document.getElementById("hospitalPerformanceChart"), {
    type: "radar",
    data: {
      labels: data.labels,
      datasets: [
        {
          label: "Performance",
          data: data.values,
          fill: true
        }
      ]
    }
  });
}

// =======================
// Filters Trigger Fetch
// =======================
function applyHospitalFilters() {
  fetchAndRenderHospitalData();
}