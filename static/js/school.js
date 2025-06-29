
// Always call this when showing the school dashboard
function onShowSchoolDashboard() {
  loadSchoolDashboardData();
}

// Optionally, auto-load if active on page load
document.addEventListener("DOMContentLoaded", () => {
  const section = document.getElementById("school-dashboard");
  if (section && section.classList.contains("active")) {
    onShowSchoolDashboard();
  }
});

function loadSchoolDashboardData() {
  fetchAndRenderSchoolData();
  populateSchoolFilters();
}

function fetchAndRenderSchoolData() {
  const region = document.getElementById("schoolRegionFilter").value;
  const district = document.getElementById("schoolDistrictFilter").value;
  const school = document.getElementById("schoolEntityFilter").value;

  const url = new URL("/api/school-data", window.location.origin);
  if (region) url.searchParams.append("region", region);
  if (district) url.searchParams.append("district", district);
  if (school) url.searchParams.append("school_name", school);

  document.getElementById("schoolDashboardOverlay").style.display = "block";

  fetch(url)
    .then(res => res.json())
    .then(data => {
      document.getElementById("schoolDashboardOverlay").style.display = "none";
      if (data.summary) {
        updateSchoolSummaryCards(data.summary);
        renderSchoolCharts(data.charts);
      } else {
        alert("No data available for the selected filters.");
      }
    })
    .catch(err => {
      document.getElementById("schoolDashboardOverlay").style.display = "none";
      alert("Failed to load data for the selected filters.");
      console.error("Error loading school dashboard:", err);
    });
}

function updateSchoolSummaryCards(summary) {
  document.getElementById("schoolTotalCount").innerText = summary.total_count;
  document.getElementById("schoolAvgSatisfaction").innerText = summary.avg_satisfaction;
  document.getElementById("schoolInfraScore").innerText = summary.infrastructure_score;
  document.getElementById("schoolResourcesScore").innerText = summary.resources_score;
}


function populateSchoolFilters() {
  fetch("/api/school-data")
    .then(res => res.json())
    .then(data => {
      const regionSet = new Set();
      const districtSet = new Set();
      const schoolSet = new Set();

      data.charts.infra_vs_resources.forEach(item => {
        schoolSet.add(item.school_name);
        if (item.district) districtSet.add(item.district);
      });
      data.charts.regional_comparison.forEach(item => {
        regionSet.add(item.region);
      });

      setSelectOptions("schoolRegionFilter", regionSet);
      setSelectOptions("schoolDistrictFilter", districtSet);
      setSelectOptions("schoolEntityFilter", schoolSet);
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

let schoolInfraChart, schoolSatisfactionChart, schoolRegionalChart, schoolPerformanceChart;

function renderSchoolCharts(data) {
  renderSchoolInfraVsResources(data.infra_vs_resources);
  renderSchoolSatisfactionDistribution(data.satisfaction_distribution);
  renderSchoolRegionalComparison(data.regional_comparison);
  renderSchoolPerformanceMetrics(data.performance_metrics);
}

function renderSchoolInfraVsResources(rows) {
  const labels = rows.map(d => d.school_name);
  const infra = rows.map(d => d.infrastructure_score);
  const resources = rows.map(d => d.resources_score);

  if (schoolInfraChart) schoolInfraChart.destroy();
  schoolInfraChart = new Chart(document.getElementById("schoolInfraChart"), {
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

function renderSchoolSatisfactionDistribution(values) {
  if (schoolSatisfactionChart) schoolSatisfactionChart.destroy();
  schoolSatisfactionChart = new Chart(document.getElementById("schoolSatisfactionChart"), {
    type: "bar",
    data: {
      labels: values.map((_, i) => `Score ${i + 1}`),
      datasets: [{ label: "Satisfaction", data: values }]
    }
  });
}

function renderSchoolRegionalComparison(rows) {
  const labels = rows.map(d => d.region);
  const infra = rows.map(d => d.infrastructure_score);
  const resources = rows.map(d => d.resources_score);

  if (schoolRegionalChart) schoolRegionalChart.destroy();
  schoolRegionalChart = new Chart(document.getElementById("schoolRegionalChart"), {
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

function renderSchoolPerformanceMetrics(data) {
  if (schoolPerformanceChart) schoolPerformanceChart.destroy();
  schoolPerformanceChart = new Chart(document.getElementById("schoolPerformanceChart"), {
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

function applySchoolFilters() {
  fetchAndRenderSchoolData();
}
