const express = require("express");
const cors = require("cors");
const app = express();

const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- MOCK DATABASE (Temporary Storage) ---
let users = [];
let cars = [];
let policies = [];
let payments = [];

// --- HEALTH CHECK ---
app.get("/health", (req, res) => res.json({ ok: true, message: "DriveSure API is live!" }));

// --- AUTH ROUTES ---
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

// --- CAR ROUTES ---
app.post("/cars", (req, res) => {
    const newCar = { ...req.body, car_id: Date.now() };
    cars.push(newCar);
    res.status(201).json({ message: "Vehicle added successfully!", car: newCar });
});

app.get("/cars/:id", (req, res) => {
    const userId = parseInt(req.params.id);
    const userCars = cars.filter(c => Number(c.customer_id) === userId);
    res.json({ cars: userCars });
});

// --- POLICY ROUTES ---
app.post("/policies", (req, res) => {
    const newPolicy = { ...req.body, policy_id: Date.now() };
    policies.push(newPolicy);
    res.status(201).json({ message: "Policy linked successfully!", policy: newPolicy });
});

app.get("/policies/:id", (req, res) => {
    const userId = parseInt(req.params.id);
    const userPolicies = policies.map(p => {
        const car = cars.find(c => c.car_id == p.car_id);
        return car ? { ...p, brand: car.brand, model_no: car.model_no, color: car.color } : p;
    }).filter(p => Number(p.customer_id) === userId);
    res.json({ policies: userPolicies });
});

// --- PAYMENT ROUTES ---
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
