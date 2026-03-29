// Change this to your actual Render Backend URL
const API_BASE = "https://drive-sure-5gwr.onrender.com";

// --- SESSION MANAGEMENT ---
function saveSession(user) {
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("loggedIn", "true");
}

function getSession() {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
}

function clearSession() {
    localStorage.removeItem("user");
    localStorage.removeItem("loggedIn");
}

// --- HELPERS ---
function formatCurrency(value) {
    return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

async function sendRequest(path, options) {
    try {
        const response = await fetch(`${API_BASE}${path}`, {
            headers: { "Content-Type": "application/json" },
            ...options
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Request failed.");
        return data;
    } catch (error) {
        throw new Error(error.message || "Cannot reach the backend.");
    }
}

// --- AUTHENTICATION ---
document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
        email: document.getElementById("loginEmail").value.trim(),
        password: document.getElementById("loginPassword").value
    };
    try {
        const data = await sendRequest("/auth/login", { method: "POST", body: JSON.stringify(payload) });
        saveSession(data.user);
        alert(data.message);
        window.location.href = "dashboard.html";
    } catch (error) { alert(error.message); }
});

// --- VEHICLE MANAGEMENT ---
document.getElementById("carForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = getSession();
    const payload = {
        customer_id: user.customer_id,
        vehicle_type: document.getElementById("vehicleType").value,
        make: document.getElementById("make").value.trim(),
        model: document.getElementById("model").value.trim(),
        year: document.getElementById("year").value,
        plate_no: document.getElementById("plateNo").value.trim()
    };
    try {
        const data = await sendRequest("/vehicles", { method: "POST", body: JSON.stringify(payload) });
        alert(data.message);
        window.location.href = "dashboard.html";
    } catch (error) { alert(error.message); }
});

// --- POLICY SELECTION ---
async function loadPolicyVehicles() {
    const vehicleSelect = document.getElementById("policyVehicleSelect");
    const user = getSession();
    if (!vehicleSelect || !user) return;

    try {
        const data = await sendRequest(`/vehicles/${user.customer_id}`, { method: "GET" });
        vehicleSelect.innerHTML = '<option value="">Select a vehicle</option>';
        data.cars.forEach(car => {
            const opt = document.createElement("option");
            opt.value = car.car_id;
            opt.textContent = `${car.make} ${car.model} (${car.plate_no})`;
            vehicleSelect.appendChild(opt);
        });
    } catch (error) { console.error(error); }
}

// --- PAYMENT MANAGEMENT ---
async function loadPaymentPolicies() {
    const policySelect = document.getElementById("paymentPolicySelect");
    const user = getSession();
    if (!policySelect || !user) return;

    try {
        const data = await sendRequest(`/policies/${user.customer_id}`, { method: "GET" });
        policySelect.innerHTML = '<option value="">-- Choose a Policy --</option>';
        data.policies.forEach(policy => {
            const opt = document.createElement("option");
            opt.value = policy.policy_id;
            opt.textContent = `${policy.plan_name} - ${policy.plate_no || 'Policy #' + policy.policy_id}`;
            policySelect.appendChild(opt);
        });
    } catch (error) { console.error(error); }
}

document.querySelectorAll(".payment-action-btn").forEach((button) => {
    button.addEventListener("click", async () => {
        const user = getSession();
        const policyId = document.getElementById("paymentPolicySelect")?.value;

        if (!policyId) {
            alert("Please select a policy first!");
            return;
        }

        const payload = {
            customer_id: user.customer_id,
            policy_id: policyId,
            amount: button.dataset.amount,
            payment_method: button.dataset.paymentMethod,
            transaction_id: 'TXN' + Date.now(),
            status: button.dataset.paymentStatus || "Paid"
        };

        try {
            const data = await sendRequest("/payments", { method: "POST", body: JSON.stringify(payload) });
            alert("Payment Successful!");
            window.location.href = "dashboard.html";
        } catch (error) { alert(error.message); }
    });
});

// --- INITIALIZE PAGE ---
document.addEventListener("DOMContentLoaded", () => {
    const user = getSession();
    if (!user && !window.location.pathname.includes("login.html") && !window.location.pathname.includes("register.html")) {
        window.location.href = "login.html";
    }

    loadPolicyVehicles();
    loadPaymentPolicies();
    // Add other dashboard loaders here if needed
});
