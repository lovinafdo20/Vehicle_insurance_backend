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
});
