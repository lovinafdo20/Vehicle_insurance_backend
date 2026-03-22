const express = require("express");
const cors = require("cors");
const app = express();

const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- MOCK DATABASE ---
let users = [];
let vehicles = []; // Renamed from 'cars' to match your frontend
let policies = [];
let payments = [];

// --- HEALTH CHECK ---
app.get("/health", (req, res) => res.json({ ok: true, message: "DriveSure API is live!" }));

// --- AUTHENTICATION ---
app.post("/auth/register", (req, res) => {
    const { name, email, password } = req.body;
    const user = { customer_id: Date.now(), name, email };
    users.push({ ...user, password });
    res.status(201).json({ message: "User registered successfully!", user });
});

app.post("/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        res.json({ message: "Login successful!", user: { customer_id: user.customer_id, name: user.name } });
    } else {
        res.status(401).json({ message: "Invalid email or password." });
    }
});

// --- VEHICLE MANAGEMENT (Updated path to /vehicles) ---
app.post("/vehicles", (req, res) => {
    const newVehicle = { ...req.body, car_id: Date.now() };
    vehicles.push(newVehicle);
    res.status(201).json({ message: "Vehicle added successfully!", car: newVehicle });
});

app.get("/vehicles/:id", (req, res) => {
    const userId = parseInt(req.params.id);
    const userVehicles = vehicles.filter(v => Number(v.customer_id) === userId);
    res.json({ cars: userVehicles });
});

// --- POLICY MANAGEMENT ---
app.post("/policies", (req, res) => {
    const newPolicy = { ...req.body, policy_id: Date.now() };
    policies.push(newPolicy);
    res.status(201).json({ message: "Policy linked successfully!", policy: newPolicy });
});

app.get("/policies/:id", (req, res) => {
    const userId = parseInt(req.params.id);
    const userPolicies = policies.map(p => {
        const vehicle = vehicles.find(v => v.car_id == p.car_id);
        return vehicle ? { ...p, brand: vehicle.brand, model_no: vehicle.model_no, color: vehicle.color } : p;
    }).filter(p => Number(p.customer_id) === userId);
    res.json({ policies: userPolicies });
});

// --- PAYMENT MANAGEMENT ---
app.post("/payments", (req, res) => {
    const newPayment = { ...req.body, payment_id: Date.now() };
    payments.push(newPayment);
    res.status(201).json({ message: "Payment recorded!", payment: newPayment });
});

app.get("/payments/:id", (req, res) => {
    const userId = parseInt(req.params.id);
    const userPayments = payments.map(pay => {
        const policy = policies.find(p => p.policy_id == pay.policy_id);
        return policy ? { ...pay, plan_name: policy.plan_name, coverage_type: policy.coverage_type } : pay;
    }).filter(pay => Number(pay.customer_id) === userId);
    res.json({ payments: userPayments });
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
