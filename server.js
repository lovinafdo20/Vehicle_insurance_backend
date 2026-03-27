require('dotenv').config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
// Render assigns a port automatically, or it defaults to 3001 locally
const PORT = process.env.PORT || 3001;

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- DATABASE CONNECTION ---
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'vehicle_insurance',
    // Uses 3307 for your XAMPP, or the Cloud Port on Render
    port: process.env.DB_PORT || 3307, 
    // SSL is required for most Cloud DBs (Aiven/Railway) but disabled for Localhost
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
// Registration Logic
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

// Login Logic
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

app.get("/policies/:id", async (req, res) => {
    try {
        const sql = `
            SELECT p.*, c.make, c.model, c.plate_no 
            FROM Policy p 
            JOIN Car c ON p.car_id = c.car_id 
            WHERE p.customer_id = ?`;
        const [rows] = await db.query(sql, [req.params.id]);
        res.json({ policies: rows });
    } catch (err) {
        res.status(500).json({ error: "Error fetching policies." });
    }
});

// --- START SERVER ---
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
