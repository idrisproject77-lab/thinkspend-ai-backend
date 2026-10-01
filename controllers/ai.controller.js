/**
 * AI Controller untuk ThinkSpend AI
 * Menghandle request masuk dari Flutter, validasi, normalisasi data,
 * dan memastikan format response selalu kompatibel:
 * { "success": true, "data": { "response": "..." } }
 */

const geminiService = require("../services/gemini.service");

/**
 * Ekstraktor untuk parsing backward compatibility jika client lama mengirim
 * data keuangan yang ditempel di string pertanyaan (regex format).
 */
function extractLegacyFinancialData(questionText) {
    if (typeof questionText !== "string") return {};

    const cleanNumber = (val) => {
        if (!val) return undefined;
        const num = val.replace(/[^0-9]/g, "");
        return num ? Number(num) : undefined;
    };

    const incomeMatch = questionText.match(/Pemasukan:\s*([^\n]+)/i)?.[1];
    const expenseMatch = questionText.match(/Pengeluaran:\s*([^\n]+)/i)?.[1];
    const balanceMatch = questionText.match(/Saldo:\s*([^\n]+)/i)?.[1];
    const countMatch = questionText.match(/Jumlah transaksi:\s*([^\n]+)/i)?.[1];
    const topCatMatch = questionText.match(/Pengeluaran terbesar:\s*([^\n]+)/i)?.[1];

    const data = {};
    if (incomeMatch) data.income = cleanNumber(incomeMatch);
    if (expenseMatch) data.expense = cleanNumber(expenseMatch);
    if (balanceMatch) data.balance = cleanNumber(balanceMatch);
    if (countMatch) data.transactionCount = cleanNumber(countMatch);
    if (topCatMatch) data.topExpenseCategory = topCatMatch.trim();

    return data;
}

/**
 * Endpoint POST /ask-ai
 */
async function askAi(req, res) {
    console.log("[POST /ask-ai] Incoming payload:", JSON.stringify(req.body, null, 2));

    try {
        const { question, financialData, history } = req.body;

        // Validasi pertanyaan
        if (!question || typeof question !== "string" || !question.trim()) {
            return res.status(400).json({
                success: false,
                error: "Pertanyaan tidak boleh kosong",
                data: {
                    response: "Halo! Silakan ketikkan pertanyaan seputar keuanganmu agar aku bisa membantu."
                }
            });
        }

        // Normalisasi data keuangan: prioritaskan structured payload req.body.financialData,
        // lalu fallback ke ekstraksi regex jika ada format legacy
        const legacyData = extractLegacyFinancialData(question);
        const resolvedFinancialData = {
            ...legacyData,
            ...(typeof financialData === "object" && financialData !== null ? financialData : {})
        };

        // Bersihkan string pertanyaan jika mengandung template data lama
        let cleanQuestion = question;
        if (question.includes("Pemasukan:") && question.includes("Pertanyaan user:")) {
            cleanQuestion = question.split("Pertanyaan user:")[1]?.trim() || question;
        }

        // Panggil service AI
        const aiResponse = await geminiService.generateAiResponse({
            question: cleanQuestion,
            financialData: resolvedFinancialData,
            history: Array.isArray(history) ? history : []
        });

        // Response format yang selalu diharapkan Flutter:
        // Flutter membaca: response.data['data']['response']
        return res.json({
            success: true,
            data: {
                response: aiResponse
            }
        });

    } catch (error) {
        console.error("[POST /ask-ai] Controller error:", error);

        // Fallback safety net agar Flutter tidak crash
        return res.status(500).json({
            success: false,
            error: "Gagal memproses permintaan AI",
            data: {
                response: "Maaf, terjadi kendala saat menghubungkan ke ThinkSpend AI. Silakan coba beberapa saat lagi ya!"
            }
        });
    }
}

/**
 * Endpoint POST /analyze-finance (Fungsi existing yang tetap dipertahankan)
 */
async function analyzeFinance(req, res) {
    try {
        const { income, expense, saving, goal } = req.body;

        if (income === undefined || expense === undefined) {
            return res.status(400).json({
                success: false,
                error: "Income dan expense wajib diisi"
            });
        }

        const data = await geminiService.analyzeFinanceService({
            income,
            expense,
            saving,
            goal
        });

        return res.json({
            success: true,
            data: data
        });

    } catch (error) {
        console.error("[POST /analyze-finance] Controller error:", error);
        return res.status(500).json({
            success: false,
            error: "Gagal menganalisis keuangan"
        });
    }
}

/**
 * Endpoint GET / (Health Check)
 */
function healthCheck(req, res) {
    return res.json({
        status: "online",
        message: "ThinkSpend AI Backend Aktif 🚀"
    });
}

module.exports = {
    askAi,
    analyzeFinance,
    healthCheck
};
