const express = require("express");
const cors = require("cors");
const app = express();

const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Mock Databases
let users = [];
let cars = [];

// --- ROUTES ---

// Health Check
app.get("/health", (req, res) => res.json({ ok: true, message: "DriveSure API is live!" }));

// Auth: Register
app.post("/auth/register", (req, res) => {
    const { name, email, password } = req.body;
    const user = { customer_id: Date.now(), name, email };
    users.push({ ...user, password });
    res.status(201).json({ message: "User registered!", user });
});

// Auth: Login
app.post("/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        res.json({ message: "Login successful", user: { customer_id: user.customer_id, name: user.name } });
    } else {
        res.status(401).json({ message: "Invalid credentials" });
    }
});

// Cars: Add
app.post("/cars", (req, res) => {
    cars.push(req.body);
    res.status(201).json({ message: "Vehicle added successfully!" });
});

// Cars: Get by User ID
app.get("/cars/:id", (req, res) => {
    const userId = parseInt(req.params.id);
    const userCars = cars.filter(c => Number(c.customer_id) === userId);
    res.json({ cars: userCars });
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
