require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const db = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "vehicle_insurance",
    port: process.env.DB_PORT || 3306,
    ssl: process.env.DB_HOST && process.env.DB_HOST !== "localhost"
        ? { rejectUnauthorized: false }
        : null,
    waitForConnections: true,
    connectionLimit: 10
});

app.get("/health", (_req, res) => {
    res.json({ ok: true, message: "DriveSure API is live and connected!" });
});

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
        const [rows] = await db.query(
            "SELECT * FROM users WHERE email = ? AND password = ?",
            [email, password]
        );

        if (rows.length === 0) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const user = rows[0];
        res.json({
            message: "Welcome back!",
            user: {
                customer_id: user.customer_id,
                name: user.name,
                email: user.email
            }
        });
    } catch (err) {
        res.status(500).json({ message: "Login error", details: err.message });
    }
});

app.post("/vehicles", async (req, res) => {
    const { customer_id, vehicle_type, make, model, year, plate_no } = req.body;

    try {
        const [result] = await db.query(
            "INSERT INTO Car (customer_id, vehicle_type, make, model, year, plate_no) VALUES (?, ?, ?, ?, ?, ?)",
            [customer_id, vehicle_type, make, model, year, plate_no]
        );

        res.status(201).json({ message: "Vehicle added!", car_id: result.insertId });
    } catch (err) {
        res.status(500).json({ message: "Unable to save vehicle", details: err.message });
    }
});

app.get("/vehicles/:id", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM Car WHERE customer_id = ?", [req.params.id]);
        res.json({ cars: rows });
    } catch (err) {
        res.status(500).json({ message: "Error fetching vehicles", details: err.message });
    }
});

app.post("/policies", async (req, res) => {
    const {
        customer_id,
        car_id,
        plan_name,
        coverage_type,
        premium_amount,
        billing_cycle,
        status
    } = req.body;

    try {
        const [result] = await db.query(
            `INSERT INTO Policy (customer_id, car_id, plan_name, coverage_type, premium_amount, billing_cycle, status)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                customer_id,
                car_id,
                plan_name,
                coverage_type || null,
                premium_amount,
                billing_cycle || null,
                status || "Active"
            ]
        );

        res.json({ message: "Policy linked!", id: result.insertId });
    } catch (err) {
        res.status(500).json({ message: "Policy creation failed", details: err.message });
    }
});

app.get("/policies/:id", async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT p.*, c.make, c.model, c.plate_no
             FROM Policy p
             JOIN Car c ON p.car_id = c.car_id
             WHERE p.customer_id = ?`,
            [req.params.id]
        );

        res.json({ policies: rows });
    } catch (err) {
        res.status(500).json({ message: "Error fetching policies", details: err.message });
    }
});

app.post("/payments", async (req, res) => {
    const { policy_id, amount, payment_method, status, payment_date } = req.body;

    if (!policy_id) {
        return res.status(400).json({ message: "policy_id is required." });
    }

    try {
        const [policyRows] = await db.query(
            "SELECT customer_id FROM Policy WHERE policy_id = ?",
            [policy_id]
        );

        if (policyRows.length === 0) {
            return res.status(404).json({ message: "Policy not found." });
        }

        const [result] = await db.query(
            `INSERT INTO transactions (customer_id, policy_id, amount, payment_method, status, payment_date)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                policyRows[0].customer_id,
                policy_id,
                amount || 0,
                payment_method || "Card",
                status || "Paid",
                payment_date || new Date()
            ]
        );

        res.status(201).json({
            message: "Payment successful!",
            payment_id: result.insertId
        });
    } catch (err) {
        res.status(500).json({ message: "Payment failed", details: err.message });
    }
});

app.get("/payments/:id", async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT
                t.transaction_id AS payment_id,
                t.policy_id,
                t.amount,
                t.payment_method,
                t.status,
                t.payment_date,
                p.plan_name,
                p.coverage_type
             FROM transactions t
             LEFT JOIN Policy p ON t.policy_id = p.policy_id
             WHERE t.customer_id = ?
             ORDER BY t.payment_date DESC, t.transaction_id DESC`,
            [req.params.id]
        );

        res.json({ payments: rows });
    } catch (err) {
        res.status(500).json({ message: "Error fetching payments", details: err.message });
    }
});

app.use((req, res) => {
    res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.listen(PORT, () => console.log(`DriveSure backend running on ${PORT}`));
