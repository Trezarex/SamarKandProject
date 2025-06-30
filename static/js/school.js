// Optionally, auto-load if active on page load
document.addEventListener("DOMContentLoaded", () => {
  const section = document.getElementById("school-dashboard");
  if (section && section.classList.contains("active")) {
    onShowSchoolDashboard();
  }
});

let schoolData = [];

async function loadSchoolData() {
  try {
    const response = await fetch('/api/school-data');
    const data = await response.json();
    if (data.error) {
      console.error("❌ Error fetching school data:", data.error);
      return;
    }
    schoolData = data;

  } catch (error) {
    console.error("School fetch error:", error);
  }
}
