require('dotenv').config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
const PORT = process.env.PORT || 3001;

// --- MIDDLEWARE ---
// Updated CORS to be more flexible for your Render deployment
app.use(cors()); 
app.use(express.json());

// --- DATABASE CONNECTION ---
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'vehicle_insurance',
    port: process.env.DB_PORT || 3307, 
    ssl: process.env.DB_HOST && process.env.DB_HOST !== 'localhost' 
         ? { rejectUnauthorized: false } 
         : null,
    waitForConnections: true,
    connectionLimit: 10
});

// --- HEALTH CHECK ---
app.get("/health", (req, res) => {
    res.json({ ok: true, message: "DriveSure API is live and connected!" });
});

// --- AUTHENTICATION ---
app.post("/auth/register", async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const [result] = await db.query(
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
            [name, email, password]
        );
        res.status(201).json({ 
            message: "User registered successfully!", 
            user: { customer_id: result.insertId, name, email } 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Registration failed: " + err.message });
    }
});

app.post("/auth/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await db.query(
            "SELECT * FROM users WHERE email = ? AND password = ?", 
            [email, password]
        );
        if (rows.length > 0) {
            const user = rows[0];
            res.json({ 
                message: "Login successful!", 
                user: { customer_id: user.customer_id, name: user.name } 
            });
        } else {
            res.status(401).json({ message: "Invalid email or password." });
        }
    } catch (err) {
        res.status(500).json({ error: "Login error: " + err.message });
    }
});

// --- VEHICLE MANAGEMENT ---
app.post("/vehicles", async (req, res) => {
    const { customer_id, vehicle_type, make, model, year, plate_no } = req.body;
    try {
        const [result] = await db.query(
            "INSERT INTO Car (customer_id, vehicle_type, make, model, year, plate_no) VALUES (?, ?, ?, ?, ?, ?)",
            [customer_id, vehicle_type, make, model, year, plate_no]
        );
        res.status(201).json({ message: "Vehicle added successfully!", car_id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: "Unable to save vehicle: " + err.message });
    }
});

app.get("/vehicles/:id", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM Car WHERE customer_id = ?", [req.params.id]);
        res.json({ cars: rows });
    } catch (err) {
        res.status(500).json({ error: "Error fetching vehicles." });
    }
});

// --- POLICY MANAGEMENT ---
app.post("/policies", async (req, res) => {
    const { customer_id, car_id, plan_name, premium_amount } = req.body;
    try {
        const [result] = await db.query(
            "INSERT INTO Policy (customer_id, car_id, plan_name, premium_amount) VALUES (?, ?, ?, ?)", 
            [customer_id, car_id, plan_name, premium_amount]
        );
        res.json({ message: "Policy linked!", id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: "Policy creation failed: " + err.message });
    }
});

// --- NEW: PAYMENT MANAGEMENT ---
app.post("/payments", async (req, res) => {
    const { customer_id, policy_id, amount, payment_method, transaction_id } = req.body;
    try {
        const [result] = await db.query(
            "INSERT INTO Transactions (customer_id, policy_id, amount, payment_method, transaction_id, status) VALUES (?, ?, ?, ?, ?, 'Success')", 
            [customer_id, policy_id, amount, payment_method, transaction_id]
        );
        res.status(201).json({ message: "Payment recorded successfully!", transaction_db_id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Payment recording failed: " + err.message });
    }
});

// --- START SERVER ---
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
