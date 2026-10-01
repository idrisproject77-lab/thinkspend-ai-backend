/**
 * Gemini AI Service
 * Menggunakan SDK @google/genai dengan dukungan timeout 25 detik,
 * retry maksimal 1 kali, multi-turn history, dan fallback cerdas.
 */

const { GoogleGenAI } = require("@google/genai");
const { getSystemInstruction, buildUserMessageWithContext } = require("../prompts/thinkspend.prompt");
const { generateFallbackResponse } = require("../utils/fallback");

// Inisialisasi Google Gen AI client
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

// Model default sesuai permintaan
const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const TIMEOUT_MS = 25000; // Timeout 25 detik

/**
 * Helper untuk menjalankan promise dengan batas waktu (timeout)
 */
function withTimeout(promise, ms, errorMessage = "Request timed out") {
    let timer;
    const timeoutPromise = new Promise((_, reject) => {
        timer = setTimeout(() => {
            reject(new Error(errorMessage));
        }, ms);
    });

    return Promise.race([promise, timeoutPromise]).finally(() => {
        clearTimeout(timer);
    });
}

/**
 * Format riwayat percakapan agar sesuai dengan skema @google/genai
 * @param {Array} history 
 * @returns {Array}
 */
function formatHistory(history) {
    if (!Array.isArray(history) || history.length === 0) {
        return [];
    }

    const formatted = [];
    for (const item of history) {
        if (!item) continue;

        let role = item.role;
        // Ubah role jika ada yang mengirim 'assistant' ke 'model'
        if (role === "assistant") role = "model";
        if (role !== "user" && role !== "model") continue;

        let text = "";
        if (typeof item.text === "string") {
            text = item.text;
        } else if (Array.isArray(item.parts) && item.parts[0]?.text) {
            text = item.parts[0].text;
        }

        if (text.trim()) {
            formatted.push({
                role: role,
                parts: [{ text: text.trim() }]
            });
        }
    }

    return formatted;
}

/**
 * Membersihkan output teks dari markdown JSON bila ada
 */
function cleanOutputText(text) {
    if (!text) return "";
    let cleaned = text.trim();

    // Jika Gemini mengembalikan format JSON berbalut markdown
    if (cleaned.startsWith("```json") || cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```json\s*/i, "").replace(/^```\s*/i, "");
        cleaned = cleaned.replace(/\s*```$/, "").trim();
    }

    // Coba periksa apakah output adalah stringified JSON dengan properti 'response'
    if (cleaned.startsWith("{") && cleaned.endsWith("}")) {
        try {
            const parsed = JSON.parse(cleaned);
            if (parsed && typeof parsed.response === "string") {
                return parsed.response.trim();
            }
        } catch (_) {
            // Jika bukan JSON valid, gunakan teks aslinya
        }
    }

    return cleaned;
}

/**
 * Menghasilkan respon AI untuk ThinkSpend
 * @param {object} params
 * @param {string} params.question - Pertanyaan user
 * @param {object} params.financialData - Data keuangan user
 * @param {Array} params.history - Riwayat chat multi-turn
 * @returns {Promise<string>}
 */
async function generateAiResponse({ question, financialData = {}, history = [] }) {
    const userTurnContent = buildUserMessageWithContext(question, financialData);
    const formattedHistory = formatHistory(history);

    // Susun contents multi-turn
    const contents = [
        ...formattedHistory,
        {
            role: "user",
            parts: [{ text: userTurnContent }]
        }
    ];

    const generateOptions = {
        model: DEFAULT_MODEL,
        contents: contents,
        config: {
            temperature: 0.7,
            maxOutputTokens: 800,
            systemInstruction: getSystemInstruction()
        }
    };

    let lastError = null;

    // Retry maksimal 1 kali (total maksimal 2 percobaan: attempt 1 + retry 1)
    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            console.log(`[ThinkSpend AI] Percobaan ${attempt} memanggil Gemini (${DEFAULT_MODEL})...`);
            console.log("[DEBUG] generateOptions.config.systemInstruction:\n", generateOptions.config.systemInstruction);
            console.log("[DEBUG] userTurnContent:\n", userTurnContent);
            console.log("[DEBUG] formattedHistory:\n", formattedHistory);

            const callPromise = ai.models.generateContent(generateOptions);
            const result = await withTimeout(
                callPromise,
                TIMEOUT_MS,
                `Gemini API timeout setelah ${TIMEOUT_MS / 1000} detik`
            );

            if (result && result.text) {
                const finalResponse = cleanOutputText(result.text);
                if (finalResponse) {
                    return finalResponse;
                }
            }

            throw new Error("Respon Gemini kosong");
        } catch (err) {
            lastError = err;
            console.warn(`[ThinkSpend AI] Gagal percobaan ke-${attempt}:`, err.message || err);

            if (attempt === 1) {
                // Jeda 1.5 detik sebelum retry ke-1
                await new Promise(resolve => setTimeout(resolve, 1500));
            }
        }
    }

    // Jika kedua percobaan gagal, aktifkan fallback cerdas
    console.error("[ThinkSpend AI] Gemini gagal setelah retry. Mengaktifkan fallback lokal...");
    return generateFallbackResponse(question, financialData);
}

/**
 * Service untuk analisis keuangan terperinci (kompatibilitas fungsi yang sudah ada)
 */
async function analyzeFinanceService({ income, expense, saving = 0, goal = "Belum ada" }) {
    const prompt = `Kamu adalah ThinkSpend AI, asisten keuangan pribadi.
Analisis data keuangan user berikut:

Income: Rp${income}
Expense: Rp${expense}
Saving: Rp${saving}
Financial Goal: ${goal}

WAJIB jawab hanya dalam format JSON valid tanpa teks lain:
{
    "health_score": 0,
    "status": "",
    "cashflow": "",
    "saving_rate": "",
    "analysis": "",
    "tips": [
        "",
        ""
    ]
}`;

    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const callPromise = ai.models.generateContent({
                model: DEFAULT_MODEL,
                contents: prompt,
                config: {
                    temperature: 0.3
                }
            });

            const result = await withTimeout(callPromise, TIMEOUT_MS);
            let answer = cleanOutputText(result.text);
            return JSON.parse(answer);
        } catch (err) {
            if (attempt === 2) throw err;
            await new Promise(r => setTimeout(r, 1500));
        }
    }
}

module.exports = {
    generateAiResponse,
    analyzeFinanceService
};
