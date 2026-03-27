require('dotenv').config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Database Pool: Handles both local XAMPP and Cloud SQL
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'vehicle_insurance',
    port: process.env.DB_PORT || 3306,
    ssl: process.env.DB_HOST && process.env.DB_HOST !== 'localhost' 
         ? { rejectUnauthorized: false } 
         : null,
    waitForConnections: true,
    connectionLimit: 10
});

app.get("/health", (req, res) => res.json({ ok: true, message: "API Connected!" }));

// Auth: Login matching your script.js needs
app.post("/auth/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await db.query("SELECT * FROM users WHERE email = ? AND password = ?", [email, password]);
        if (rows.length > 0) {
            res.json({ message: "Login successful!", user: { customer_id: rows[0].customer_id, name: rows[0].name } });
        } else {
            res.status(401).json({ message: "Invalid credentials." });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Vehicles: Matches your 'carForm' fields
app.post("/vehicles", async (req, res) => {
    const { customer_id, vehicle_type, make, model, year, plate_no } = req.body;
    try {
        const [result] = await db.query(
            "INSERT INTO Car (customer_id, vehicle_type, make, model, year, plate_no) VALUES (?, ?, ?, ?, ?, ?)",
            [customer_id, vehicle_type, make, model, year, plate_no]
        );
        res.status(201).json({ message: "Vehicle added!", car_id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/vehicles/:id", async (req, res) => {
    const [rows] = await db.query("SELECT * FROM Car WHERE customer_id = ?", [req.params.id]);
    res.json({ cars: rows });
});

// Policies & Payments (Basic logic)
app.post("/policies", async (req, res) => {
    const { customer_id, car_id, plan_name, premium_amount } = req.body;
    const [result] = await db.query("INSERT INTO Policy (customer_id, car_id, plan_name, premium_amount) VALUES (?, ?, ?, ?)", [customer_id, car_id, plan_name, premium_amount]);
    res.json({ message: "Policy linked!", id: result.insertId });
});

app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
