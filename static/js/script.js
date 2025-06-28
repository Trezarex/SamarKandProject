// Navigation functionality
function showSection(sectionId) {
    // Hide all content sections here .. ..
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.classList.remove('active'));

    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));

    document.getElementById(sectionId).classList.add('active');

    event.target.classList.add('active');

    if (sectionId === 'dashboard') {
        setTimeout(() => {
            if (!currentDataset) {
                loadData('hospitals');
            }
        }, 100);
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        alert('Nice try Diddyy .. .');
        // window.location.href = '/login';
    }
}

// =============================
// 🚑 Insight Dashboard Renderer
// =============================

function renderHospitalDashboard() {
    const metrics = {
        totalHospitals: 238,
        avgSatisfaction: 0.83,
        avgBedCapacity: 0.06,
        avgMedicalStaff: 0.06,
        infraScore: 9.85,
        resourcesScore: 0.74
    };

    const infraAvailability = {
        "Generator": 67,
        "Solar Panels": 45,
        "Water Pipeline": 170,
        "Fence": 215,
        "CCTV": 172,
        "Nearby Transport": 136,
        "Fire Safety": 200
    };

    // Inject metric cards
    for (let key in metrics) {
        const element = document.getElementById(key);
        if (element) element.innerText = metrics[key];
    }

    // Draw bar chart
    const ctx = document.getElementById('infraBarChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(infraAvailability),
            datasets: [{
                label: 'Hospitals with Feature',
                data: Object.values(infraAvailability),
                backgroundColor: 'rgba(67, 97, 238, 0.6)',
                borderColor: 'rgba(67, 97, 238, 1)',
                borderWidth: 1,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => `${ctx.raw} hospitals`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 25
                    }
                }
            }
        }
    });

    // Additional charts inside renderHospitalDashboard()
    const pieCtx = document.getElementById('infraPieChart')?.getContext('2d');
    if (pieCtx) {
        new Chart(pieCtx, {
            type: 'pie',
            data: {
                labels: ['Low (0–2)', 'Medium (3–5)', 'High (6–7)'],
                datasets: [{
                    label: 'Infra Coverage',
                    data: [40, 120, 78],
                    backgroundColor: ['#4cc9f0', '#4361ee', '#3f37c9'],
                    borderColor: '#fff',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }

    const lineCtx = document.getElementById('satisfactionLineChart')?.getContext('2d');
    if (lineCtx) {
        new Chart(lineCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Avg. Satisfaction',
                    data: [0.76, 0.79, 0.82, 0.83, 0.84, 0.83],
                    fill: false,
                    borderColor: '#4361ee',
                    backgroundColor: '#4361ee',
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        min: 0,
                        max: 1,
                        ticks: {
                            stepSize: 0.1
                        }
                    }
                }
            }
        });
    }

    const radarCtx = document.getElementById('infraRadarChart')?.getContext('2d');
    if (radarCtx) {
        new Chart(radarCtx, {
            type: 'radar',
            data: {
                labels: ['District A', 'District B', 'District C', 'District D', 'District E'],
                datasets: [
                    {
                        label: 'Infra Score',
                        data: [8.2, 9.1, 7.8, 8.9, 9.4],
                        fill: true,
                        backgroundColor: 'rgba(67, 97, 238, 0.2)',
                        borderColor: '#4361ee',
                        pointBackgroundColor: '#4361ee'
                    },
                    {
                        label: 'Resource Score',
                        data: [0.72, 0.81, 0.66, 0.74, 0.79],
                        fill: true,
                        backgroundColor: 'rgba(76, 201, 240, 0.2)',
                        borderColor: '#4cc9f0',
                        pointBackgroundColor: '#4cc9f0'
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' }
                },
                scales: {
                    r: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
}

// 👇 Auto-trigger when dashboard is loaded
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("infraBarChart")) {
        renderHospitalDashboard();
    }
});
// =============================

// === Chat Bot Logic ===
function appendMessage(sender, text, isLoading = false) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    const msgDiv = document.createElement('div');
    msgDiv.className = sender === 'user' ? 'user-message' : 'bot-message';
    if (isLoading) {
        msgDiv.innerHTML = '<span class="loading-dots"><span>.</span><span>.</span><span>.</span></span>';
        msgDiv.classList.add('bot-loading');
    } else {
        msgDiv.textContent = text;
    }
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return msgDiv;
}

function sendMessage(event) {
    event.preventDefault();
    const input = document.getElementById('chat-input');
    if (!input) return false;
    const message = input.value.trim();
    if (!message) return false;
    appendMessage('user', message);
    input.value = '';
    // Show loading message and keep reference
    const loadingDiv = appendMessage('bot', '', true);
    fetch('/deepseek_chat_bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
    })
        .then(res => res.json())
        .then(data => {
            if (loadingDiv) {
                loadingDiv.classList.remove('bot-loading');
                loadingDiv.innerHTML = '';
                loadingDiv.textContent = data.response;
            } else {
                appendMessage('bot', data.response);
            }
        })
        .catch(() => {
            if (loadingDiv) {
                loadingDiv.classList.remove('bot-loading');
                loadingDiv.innerHTML = '';
                loadingDiv.textContent = 'Sorry, there was an error connecting to the AI.';
            } else {
                appendMessage('bot', 'Sorry, there was an error connecting to the AI.');
            }
        });
    return false;
}

window.addEventListener('DOMContentLoaded', function () {
    const chatForm = document.getElementById('chat-form');
    if (chatForm) {
        chatForm.onsubmit = sendMessage;
    }
});

// Initialize the application
window.onload = () => {
    // Start with homepage active
    showSection('homepage');
};