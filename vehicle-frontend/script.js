const API_BASE = "https://drive-sure-5gwr.onrender.com";

// --- SESSION HELPERS ---
function saveSession(user) {
    localStorage.setItem("user", JSON.stringify(user));
}

function getSession() {
    return JSON.parse(localStorage.getItem("user"));
}

// --- FIXED REQUEST ENGINE ---
async function sendRequest(path, options) {
    const response = await fetch(`${API_BASE}${path}`, {
        method: options.method || 'GET',
        headers: { "Content-Type": "application/json" },
        // FIX: The body is stringified ONLY here
        body: options.body ? JSON.stringify(options.body) : null
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Request failed");
    return data;
}

// --- VEHICLE REGISTRATION ---
document.getElementById("carForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = getSession();
    
    if (!user || !user.customer_id) {
        alert("Session error: Please log in again.");
        return;
    }

    // Ensure these IDs match your HTML exactly
    const payload = {
        customer_id: user.customer_id,
        vehicle_type: document.getElementById("vehicleType").value,
        make: document.getElementById("make").value.trim(),
        model: document.getElementById("model").value.trim(),
        year: document.getElementById("year").value,
        plate_no: document.getElementById("plateNo").value.trim()
    };

    try {
        // Pass the raw object; sendRequest handles the stringify
        const data = await sendRequest("/vehicles", { method: "POST", body: payload });
        alert(data.message);
        window.location.href = "dashboard.html";
    } catch (error) { 
        alert("Save failed: " + error.message); 
    }
});

// --- AUTH HANDLERS ---
document.getElementById("registerForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        password: document.getElementById("password").value
    };
    try {
        const data = await sendRequest("/auth/register", { method: "POST", body: payload });
        saveSession(data.user);
        alert(data.message);
        window.location.href = "dashboard.html";
    } catch (err) { alert(err.message); }
});

document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
        email: (document.getElementById("loginEmail") || document.getElementById("email")).value.trim(),
        password: (document.getElementById("loginPassword") || document.getElementById("password")).value
    };
    try {
        const data = await sendRequest("/auth/login", { method: "POST", body: payload });
        saveSession(data.user);
        window.location.href = "dashboard.html";
    } catch (error) { alert(error.message); }
    // --- DASHBOARD INITIALIZER ---
async function loadDashboard() {
    const user = getSession();
    
    // 1. Check if we are on the dashboard page
    const vehicleGrid = document.getElementById("vehicleGrid");
    if (!vehicleGrid || !user) return;

    try {
        // 2. Fetch vehicles for this specific user
        const vehicles = await sendRequest(`/vehicles/${user.customer_id}`);
        
        // 3. Update the UI counts and toggle visibility
        const summaryCount = document.getElementById("summaryVehicleCount");
        const vehicleCount = document.getElementById("vehicleCount");
        const emptyState = document.getElementById("vehicleEmptyState");

        if (vehicles && vehicles.length > 0) {
            // Update numbers
            if (summaryCount) summaryCount.innerText = vehicles.length;
            if (vehicleCount) vehicleCount.innerText = `${vehicles.length} vehicles`;
            
            // Hide the "No vehicles" message
            if (emptyState) emptyState.style.display = "none";

            // Build the list of vehicle cards
            vehicleGrid.innerHTML = vehicles.map(v => `
                <div class="action-card">
                    <div class="action-icon">V</div>
                    <h3>${v.make}</h3>
                    <p class="helper-text">${v.plate_no} • ${v.model}</p>
                    <p><strong>Price:</strong> Rs. ${v.year}</p>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error("Dashboard sync failed:", error.message);
    }
}

// Run the loader whenever the page finishes loading
document.addEventListener("DOMContentLoaded", loadDashboard);
});
