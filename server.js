require('dotenv').config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors()); 
app.use(express.json());

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
        res.status(500).json({ message: "Registration failed", details: err.message });
    }
});

app.post("/auth/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await db.query("SELECT * FROM users WHERE email = ? AND password = ?", [email, password]);
        if (rows.length > 0) {
            res.json({ message: "Welcome back!", user: rows[0] });
        } else {
            res.status(401).json({ message: "Invalid credentials" });
        }
    } catch (err) {
        res.status(500).json({ message: "Login error" });
    }
});

// --- VEHICLES & POLICIES ---
app.post("/vehicles", async (req, res) => {
    const { customer_id, vehicle_type, make, model, year, plate_no } = req.body;
    try {
        await db.query("INSERT INTO car (customer_id, vehicle_type, make, model, year, plate_no) VALUES (?, ?, ?, ?, ?, ?)", 
        [customer_id, vehicle_type, make, model, year, plate_no]);
        res.status(201).json({ message: "Vehicle added!" });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get("/vehicles/:id", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM car WHERE customer_id = ?", [req.params.id]);
        res.json(rows); // Send the list directly so .map() works on the frontend
    } catch (err) {
        res.status(500).json({ message: "Error fetching vehicles" });
    }
});

app.post("/payments", async (req, res) => {
    const { customer_id, policy_id, amount, payment_method, transaction_id } = req.body;
    try {
        await db.query(
            "INSERT INTO transactions (customer_id, policy_id, amount, payment_method, transaction_id, status) VALUES (?, ?, ?, ?, ?, 'Success')", 
            [customer_id, policy_id, amount, payment_method, transaction_id]
        );
        res.status(201).json({ message: "Payment successful!" });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
