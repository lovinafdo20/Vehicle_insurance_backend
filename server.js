const express = require("express");
const cors = require("cors");

// 1. Routes (Make sure these files exist in your 'routes' folder!)
const authRoutes = require("./routes/authRoutes");
const carRoutes = require("./routes/carRoutes");
const policyRoutes = require("./routes/policyRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();

// 2. Define PORT only once
const PORT = process.env.PORT || 3001;

// 3. Middleware
app.use(cors());
app.use(express.json());

// 4. Basic Health Check
app.get("/health", (_req, res) => {
  res.json({ ok: true, message: "DriveSure API is running." });
});

// 5. Use Routes
app.use("/auth", authRoutes);
app.use("/cars", carRoutes);
app.use("/policies", policyRoutes);
app.use("/payments", paymentRoutes);

// 6. 404 Handler
app.use((req, res) => {
  res.status(404).json({ ok: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// 7. Start Server (Only at the very bottom)
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
