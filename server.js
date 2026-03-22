const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const carRoutes = require("./routes/carRoutes");
const policyRoutes = require("./routes/policyRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, message: "DriveSure API is running." });
});

app.use("/auth", authRoutes);
app.use("/cars", carRoutes);
app.use("/policies", policyRoutes);
app.use("/payments", paymentRoutes);

app.use((req, res) => {
  res.status(404).json({ ok: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
