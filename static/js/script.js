// handling section visibility
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

        if (infraDonutChart) infraDonutChart.update();
        if (populationDonutChart) populationDonutChart.update();
        if (resourcesDonutChart) resourcesDonutChart.update();
        if (infraBarChart) infraBarChart.update();
        if (populationBarChart) populationBarChart.update();
        if (resourcesBarChart) resourcesBarChart.update();
      }, 300);
    }
    else if (sectionId === "school-dashboard") {
      setTimeout(() => {
        if (!window.schoolMapInstance) {
          initSchoolMap();
        } else {
          schoolMapInstance.invalidateSize();
        }

        if (schoolInfraDonutChart) schoolInfraDonutChart.update();
        if (schoolPopulationDonutChart) schoolPopulationDonutChart.update();
        if (schoolResourcesDonutChart) schoolResourcesDonutChart.update();
        if (schoolInfrastructureBarChart) schoolInfrastructureBarChart.update();
        if (schoolPopulationBarChart) schoolPopulationBarChart.update();
        if (schoolResourcesBarChart) schoolResourcesBarChart.update();
      }, 300);
    }
    else if (sectionId === "preschool-dashboard") {
      setTimeout(() => {
        if (!window.preSchoolMapInstance) {
          initPreSchoolMap();
        } else {
          preSchoolMapInstance.invalidateSize();
        }
        if (preSchoolInfraDonutChart) preSchoolInfraDonutChart.update();
        if (preSchoolPopulationDonutChart) preSchoolPopulationDonutChart.update();
        if (preSchoolResourcesDonutChart) preSchoolResourcesDonutChart.update();
        if (preSchoolInfrastructureBarChart) preSchoolInfrastructureBarChart.update();
        if (preSchoolPopulationBarChart) preSchoolPopulationBarChart.update();
        if (preSchoolResourcesBarChart) preSchoolResourcesBarChart.update();
      }, 300);
    }
  }
}

// Handling sidebar visibility

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

// Handling the dashboard section visibility

function toggleDashboardDropdown(e) {
  e.stopPropagation();
  const btn = document.getElementById('dashboardDropdownBtn');
  const caret = document.getElementById('dashboardCaret');
  const menu = document.getElementById('dashboardDropdown');
  const isOpen = menu.style.display === 'block';
  menu.style.display = isOpen ? 'none' : 'block';
  btn.classList.toggle('open', !isOpen);
  btn.classList.toggle('active', !isOpen);
  caret.textContent = !isOpen ? '▲' : '▼';
  menu.setAttribute('aria-expanded', !isOpen ? 'true' : 'false');
}

// Hide dropdown if clicking outside
window.addEventListener('click', function (e) {
  const menu = document.getElementById('dashboardDropdown');
  const btn = document.getElementById('dashboardDropdownBtn');
  if (menu && btn && !btn.contains(e.target) && !menu.contains(e.target)) {
    menu.style.display = 'none';
    btn.classList.remove('open', 'active');
    document.getElementById('dashboardCaret').textContent = '▼';
    menu.setAttribute('aria-expanded', 'false');
  }
});

function showDashboard(type) {
  // Hide all dashboards
  document.getElementById('hospital-dashboard').classList.remove('active');
  document.getElementById('school-dashboard').classList.remove('active');
  document.getElementById('preschool-dashboard').classList.remove('active');
  document.getElementById(type + '-dashboard').classList.add('active');

  // Update sidebar dropdown active state
  const items = document.querySelectorAll('.sidebar-dropdown-item');
  items.forEach(item => {
    if (item.textContent.toLowerCase().includes(type)) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  if (typeof window[`load${type.charAt(0).toUpperCase() + type.slice(1)}DashboardData`] === 'function') {
    window[`load${type.charAt(0).toUpperCase() + type.slice(1)}DashboardData`]();
  }
}
