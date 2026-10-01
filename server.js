const express = require("express");
const cors = require("cors");
require("dotenv").config();

const aiRoutes = require("./routes/ai.routes");

// =====================
// INIT APP
// =====================
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Log status API Key saat startup
console.log(
    "API KEY:",
    process.env.GEMINI_API_KEY ? "TERBACA" : "KOSONG"
);

// =====================
// ROUTES
// =====================
// Mount aiRoutes ke root agar /ask-ai dan /analyze-finance langsung bisa diakses
app.use("/", aiRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("Unhandled Server Error:", err);
    res.status(500).json({
        success: false,
        error: "Terjadi kesalahan internal pada server",
        data: {
            response: "Maaf, server ThinkSpend AI sedang mengalami gangguan teknis. Coba beberapa saat lagi ya!"
        }
    });
});

// =====================
// SERVER LISTEN
// =====================
const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
    console.log(`ThinkSpend AI Backend berjalan di http://${HOST}:${PORT}`);
    console.log(`Endpoint aktif:`);
    console.log(`- GET  /`);
    console.log(`- POST /ask-ai`);
    console.log(`- POST /analyze-finance`);
});