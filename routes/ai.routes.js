/**
 * AI Routes untuk ThinkSpend
 */

const express = require("express");
const router = express.Router();
const aiController = require("../controllers/ai.controller");

// Health check endpoint
router.get("/", aiController.healthCheck);

// Endpoint utama AI untuk Flutter
router.post("/ask-ai", aiController.askAi);

// Endpoint analisis keuangan
router.post("/analyze-finance", aiController.analyzeFinance);

module.exports = router;
