document.addEventListener("DOMContentLoaded", () => {
  const section = document.getElementById("preschool-dashboard");
  if (section && section.classList.contains("active")) {
    loadPreschoolDashboardData();
  }
});

function loadPreschoolDashboardData() {
  fetchAndRenderPreschoolData();
  populatePreschoolFilters();
}

function fetchAndRenderPreschoolData() {
  const region = document.getElementById("preschoolRegionFilter").value;
  const district = document.getElementById("preschoolDistrictFilter").value;
  const preschool = document.getElementById("preschoolEntityFilter").value;

  const url = new URL("/api/preschool-data", window.location.origin);
  if (region) url.searchParams.append("region", region);
  if (district) url.searchParams.append("district", district);
  if (preschool) url.searchParams.append("preschool_name", preschool);

  document.getElementById("preschoolDashboardOverlay").style.display = "block";

  fetch(url)
    .then(res => res.json())
    .then(data => {
      document.getElementById("preschoolDashboardOverlay").style.display = "none";
      if (data.summary) {
        updatePreschoolSummaryCards(data.summary);
        renderPreschoolCharts(data.charts);
      } else {
        alert("No data available for the selected filters.");
      }
    })
    .catch(err => {
      document.getElementById("preschoolDashboardOverlay").style.display = "none";
      alert("Failed to load data for the selected filters.");
      console.error("Preschool fetch error:", err);
    });
}

function updatePreschoolSummaryCards(summary) {
  document.getElementById("preschoolTotalCount").innerText = summary.total_count;
  document.getElementById("preschoolAvgSatisfaction").innerText = summary.avg_satisfaction;
  document.getElementById("preschoolInfraScore").innerText = summary.infrastructure_score;
  document.getElementById("preschoolResourcesScore").innerText = summary.resources_score;
}


function populatePreschoolFilters() {
  fetch("/api/preschool-data")
    .then(res => res.json())
    .then(data => {
      const regionSet = new Set();
      const districtSet = new Set();
      const preschoolSet = new Set();

      data.charts.infra_vs_resources.forEach(item => {
        if (item.kindergarten_name) preschoolSet.add(item.kindergarten_name);
        if (item.district) districtSet.add(item.district);
      });
      data.charts.regional_comparison.forEach(item => {
        if (item.region) regionSet.add(item.region);
      });

      setSelectOptions("preschoolRegionFilter", regionSet);
      setSelectOptions("preschoolDistrictFilter", districtSet);
      setSelectOptions("preschoolEntityFilter", preschoolSet);
    });
}

function setSelectOptions(id, valuesSet) {
  const select = document.getElementById(id);
  select.innerHTML = `<option value="">All</option>`;
  Array.from(valuesSet)
    .sort()
    .forEach(val => {
      const opt = document.createElement("option");
      opt.value = val;
      opt.textContent = val;
      select.appendChild(opt);
    });
}

let preschoolInfraChart, preschoolSatisfactionChart, preschoolRegionalChart, preschoolPerformanceChart;

function renderPreschoolCharts(data) {
  renderInfraVsResourcesChart(data.infra_vs_resources);
  renderSatisfactionChart(data.satisfaction_distribution);
  renderRegionalChart(data.regional_comparison);
  renderPerformanceChart(data.performance_metrics);
}


function renderInfraVsResourcesChart(rows) {
  const labels = rows.map(d => d.kindergarten_name);
  const infra = rows.map(d => d.infrastructure_score);
  const resources = rows.map(d => d.resources_score);

  if (preschoolInfraChart) preschoolInfraChart.destroy();
  preschoolInfraChart = new Chart(document.getElementById("preschoolInfraChart"), {
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

function renderSatisfactionChart(values) {
  if (preschoolSatisfactionChart) preschoolSatisfactionChart.destroy();
  preschoolSatisfactionChart = new Chart(document.getElementById("preschoolSatisfactionChart"), {
    type: "bar",
    data: {
      labels: values.map((_, i) => `Score ${i + 1}`),
      datasets: [{ label: "Satisfaction", data: values }]
    }
  });
}

function renderRegionalChart(rows) {
  const labels = rows.map(d => d.region);
  const infra = rows.map(d => d.infrastructure_score);
  const resources = rows.map(d => d.resources_score);

  if (preschoolRegionalChart) preschoolRegionalChart.destroy();
  preschoolRegionalChart = new Chart(document.getElementById("preschoolRegionalChart"), {
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

function renderPerformanceChart(data) {
  if (preschoolPerformanceChart) preschoolPerformanceChart.destroy();
  preschoolPerformanceChart = new Chart(document.getElementById("preschoolPerformanceChart"), {
    type: "radar",
    data: {
      labels: data.labels,
      datasets: [{
        label: "Performance",
        data: data.values,
        fill: true
      }]
    }
  });
}

function applyPreschoolFilters() {
  fetchAndRenderPreschoolData();
}
