require('dotenv').config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); 
app.use(express.json());

// Database Connection Pool
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    ssl: { rejectUnauthorized: false },
    waitForConnections: true,
    connectionLimit: 10
});

// --- ROOT ROUTE (Fixes "Cannot GET /") ---
app.get("/", (req, res) => {
    res.status(200).send("DriveSure API is online and connected.");
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
            message: "Account created!", 
            user: { customer_id: result.insertId, name, email } 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Registration failed", error: err.message });
    }
});

app.post("/auth/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        // Simple plain-text check (Note: In a real app, use bcrypt for password hashing)
        const [rows] = await db.query("SELECT * FROM users WHERE email = ? AND password = ?", [email, password]);
        if (rows.length > 0) {
            res.json({ message: "Welcome back!", user: rows[0] });
        } else {
            res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Login error", error: err.message });
    }
});

// --- VEHICLES ---
app.post("/vehicles", async (req, res) => {
    const { customer_id, vehicle_type, make, model, year, plate_no } = req.body;
    try {
        await db.query(
            "INSERT INTO car (customer_id, vehicle_type, make, model, year, plate_no) VALUES (?, ?, ?, ?, ?, ?)", 
            [customer_id, vehicle_type, make, model, year, plate_no]
        );
        res.status(201).json({ message: "Vehicle added successfully!" });
    } catch (err) { 
        console.error(err);
        res.status(500).json({ message: "Failed to add vehicle", error: err.message }); 
    }
});

app.get("/vehicles/:id", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM car WHERE customer_id = ?", [req.params.id]);
        res.json({ cars: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching vehicles", error: err.message });
    }
});

// --- PAYMENTS ---
app.post("/payments", async (req, res) => {
    const { customer_id, policy_id, amount, payment_method, transaction_id } = req.body;
    try {
        await db.query(
            "INSERT INTO transactions (customer_id, policy_id, amount, payment_method, transaction_id, status) VALUES (?, ?, ?, ?, ?, 'Success')", 
            [customer_id, policy_id, amount, payment_method, transaction_id]
        );
        res.status(201).json({ message: "Payment successful!" });
    } catch (err) { 
        console.error(err);
        res.status(500).json({ message: "Payment processing failed", error: err.message }); 
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
