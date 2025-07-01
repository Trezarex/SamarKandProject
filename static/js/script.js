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

        // Handle charts
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

        // Update school charts
        if (schoolInfraDonutChart) schoolInfraDonutChart.update();
        if (schoolPopulationDonutChart) schoolPopulationDonutChart.update();
        if (schoolResourcesDonutChart) schoolResourcesDonutChart.update();
        // if (infraBarChart) infraBarChart.update();
        // if (populationBarChart) populationBarChart.update();
        // if (resourcesBarChart) resourcesBarChart.update();
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
