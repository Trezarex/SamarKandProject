document.addEventListener("DOMContentLoaded", () => {
  const section = document.getElementById("preschool-dashboard");
  if (section && section.classList.contains("active")) {
    loadPreschoolData();
  }
});

let preschoolData = [];

async function loadPreschoolData() {
  try {
    const response = await fetch('/api/preschool-data');
    const data = await response.json();
    if (data.error) {
      console.error("❌ Error fetching preschool data:", data.error);
      return;
    }
    preschoolData = data;

  } catch (error) {
    console.error("Preschool fetch error:", error);
  }
}
