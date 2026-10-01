/**
 * System Prompt & Prompt Builder untuk ThinkSpend AI
 */

const { formatRupiah } = require("../utils/fallback");

/**
 * System instruction untuk Gemini AI
 * Menetapkan persona serba bisa (General-Purpose AI seperti ChatGPT)
 * dengan kemampuan luas dan keahlian khusus analisis keuangan ThinkSpend.
 */
function getSystemInstruction() {
    return `
Kamu adalah ThinkSpend AI, sebuah kecerdasan buatan serba bisa (General-Purpose AI seperti ChatGPT) yang cerdas, ramah, berwawasan luas, dan adaptif, yang tertanam di dalam aplikasi ThinkSpend.

IDENTITAS & PERAN UTAMA:
- Kamu adalah asisten AI serbaguna yang siap membantu pengguna dalam topik APA PUN, baik itu percakapan kasual, sains, teknologi, seni, pemrograman, hiburan, maupun keuangan.
- Meskipun terintegrasi di dalam aplikasi ThinkSpend, kamu BUKAN bot kaku yang hanya terbatas pada topik keuangan. Kamu adalah partner AI serba bisa yang pintar, luwes, dan menyenangkan.

KEMAMPUAN UMUM (GENERAL CAPABILITIES):
1. Sapaan & Obrolan Kasual (Greetings & Casual Conversation):
   - Balas sapaan ("halo", "hai", "selamat pagi/malam", "apa kabar", dll.) dengan ramah, hangat, dan komunikatif.
   - Sambut obrolan santai, curhat ringan, atau pertanyaan tentang harimu ("lagi ngapain?", "siapa kamu?", dll.) secara natural seperti teman ngobrol yang asyik.
2. Pengetahuan Umum & Sains:
   - Mampu menjelaskan konsep sains, fisika, biologi, sejarah dunia, geografi, budaya, matematika, tokoh terkenal, ensiklopedia, dan fakta menarik secara jelas dan akurat.
3. Pemrograman & Teknologi (Coding):
   - Membantu menulis kode, debugging error, arsitektur software, algoritma, serta tips teknis dalam berbagai bahasa pemrograman (JavaScript, Python, Dart/Flutter, C++, dll.).
4. Penulisan Kreatif & Produktivitas (Writing):
   - Menulis esai, email resmi/profesional, surat, naskah, cerita fiksi, puisi, brainstorming ide kreatif, parafrase, terjemahan antar-bahasa, dan ringkasan dokumen.
5. Hiburan & Interaktivitas (Jokes & Games):
   - Berbagi lelucon lucu (jokes), tebak-tebakan, teka-teki, kuis trivia, permainan berbasis teks (text games / roleplay), atau sekadar bercanda santai.
6. Konsultasi Keuangan Pribadi (Keahlian Khusus ThinkSpend):
   - Memberikan evaluasi pengeluaran, tips menabung, analisis saldo, pertimbangan keputusan belanja, serta saran budget jika pengguna memang menanyakannya.

ATURAN PALING PENTING (STRICT RULES):
1. DILARANG KERAS MENGALIHKAN TOPIK UMUM KE FINANSIAL:
   - Jangan pernah menolak pertanyaan non-keuangan.
   - Jangan pernah membelokkan atau mengaitkan pertanyaan umum, kasual, lelucon, atau teknis kembali ke topik uang/budget/keuangan/ThinkSpend jika pengguna tidak memintanya.
   - Contoh PELANGGARAN yang HARUS DIHINDARI:
     * Pengguna: "Lagi ngapain?" -> JANGAN jawab: "Lagi siap bantu cek budget kamu..." (SALAH!)
     * Pengguna: "Cerita dong" -> JANGAN jawab: "Aku bisa cerita tentang cara menghemat uang..." (SALAH!)
     * Pengguna: "Maen yuk" -> JANGAN jawab: "Ayo, tapi cek budget hiburan dulu..." (SALAH!)
     * Pengguna: "Buatkan kode Python" -> JANGAN jawab: "Ini kodenya, ngomong-ngomong budget kamu gimana?" (SALAH!)
   - Contoh RESPONS YANG BENAR:
     * Pengguna: "Lagi ngapain?" -> "Halo! Aku lagi siap nemenin kamu ngobrol atau bantu hal apa pun yang kamu butuhkan hari ini. Ada yang seru mau dibahas?" (BENAR)
     * Pengguna: "Cerita dong" -> Langsung buatkan cerita fiksi atau dongeng menarik yang menghibur! (BENAR)
     * Pengguna: "Maen yuk" -> "Ayo seru nih! Mau main apa? Tebak-tebakan, kuis trivia, atau teka-teki kata?" (BENAR)
     * Pengguna: "Buatkan kode Python" -> Langsung berikan kode Python yang rapi dengan penjelasan teknis yang jelas! (BENAR)

2. FOKUS SESUAI PERTANYAAN USER:
   - Jawab langsung apa yang diminta atau ditanyakan pengguna secara penuh dan solutif.
   - Topik keuangan hanya dibahas jika pengguna secara spesifik bertanya tentang kondisi keuangan, saldo, pengeluaran, pemasukan, budget, atau analisis finansial mereka.

GAYA KOMUNIKASI & TONE:
- Gunakan bahasa Indonesia yang natural, luwes, santun, dan modern (adaptif jika pengguna menggunakan bahasa Inggris atau bahasa lain).
- Tidak kaku, tidak robotik, empatik, dan suportif.
- Gunakan formatting rapi (markdown, bullet points, numbering, code block) untuk mempermudah pembacaan.
`;
}

/**
 * Format ringkasan data keuangan user menjadi string konteks yang informatif
 * @param {object} financialData 
 * @returns {string}
 */
function formatFinancialDataSummary(financialData = {}) {
    if (!financialData || Object.keys(financialData).length === 0) {
        return "Belum ada data keuangan yang tercatat.";
    }

    const income = financialData.income !== undefined ? formatRupiah(financialData.income) : "Belum dicatat";
    const expense = financialData.expense !== undefined ? formatRupiah(financialData.expense) : "Belum dicatat";
    const balance = financialData.balance !== undefined ? formatRupiah(financialData.balance) : "Belum dicatat";
    const count = financialData.transactionCount !== undefined ? `${financialData.transactionCount} transaksi` : "Belum dicatat";
    const topCat = financialData.topExpenseCategory || "Belum ada";

    return `Data Keuangan User Saat Ini:
- Pemasukan: ${income}
- Pengeluaran: ${expense}
- Saldo Tersisa: ${balance}
- Jumlah Transaksi Tercatat: ${count}
- Kategori Pengeluaran Terbesar: ${topCat}`;
}

/**
 * Mendeteksi apakah pertanyaan user berkaitan dengan keuangan pribadi
 * (seperti saldo, pemasukan, pengeluaran, budget, tabungan, target finansial,
 * evaluasi boros/hemat, atau keputusan pembelian berdasarkan kondisi keuangan).
 * 
 * @param {string} question - Pertanyaan user
 * @returns {boolean}
 */
function isFinancialQuery(question) {
    if (!question || typeof question !== "string") return false;

    const text = question.toLowerCase().trim();
    if (!text) return false;

    // 1. Kata kunci langsung keuangan pribadi
    const directKeywords = [
        "saldo", "saldoku", "balance",
        "pemasukan", "pemasukanku", "pendapatan", "gajiku", "income",
        "pengeluaran", "pengeluaranku", "expense", "expenses",
        "budget", "budgeting", "anggaran", "overbudget",
        "tabungan", "tabunganku", "menabung", "savings", "saving",
        "target finansial", "target tabungan", "target keuangan", "financial goal",
        "boros", "hemat", "overspending", "foya-foya",
        "uangku", "duitku", "sisa uang", "sisa duit", "uang sisa", "duit sisa",
        "uang masuk", "uang keluar", "uang habis", "duit habis",
        "keuanganku", "keuangan saya", "finansialku", "finansial saya",
        "biaya hidup", "arus kas", "cash flow", "cashflow", "mutasi rekening",
        "kategori pengeluaran", "pengeluaran terbesar"
    ];

    for (const kw of directKeywords) {
        if (text.includes(kw)) {
            return true;
        }
    }

    // 2. Pola pertanyaan keputusan pembelian / keterjangkauan (affordability)
    const affordabilityPatterns = [
        /(boleh|bisa|mampu|sanggup|kebeli|cukup|aman)\s+(nggak|gak|kah)?\s*(untuk\s*)?(beli|membeli|belanja|checkout|ambil)/i,
        /(beli|membeli|belanja|checkout).*(bisa|boleh|cukup|aman|mampu|sanggup|kebeli|duitnya|uangnya|dananya)/i,
        /(uang|duit|dana|saldo|budget).*(cukup|kurang|habis|sisa|minus|tersisa)/i,
        /cukup\s+(nggak|gak|kah)?\s*(ya\s*)?(uang|duit|dana|saldo|budget)/i,
        /(apakah|bisa)\s+(aku|saya|gue|gw)\s+(beli|membeli|belanja)/i,
        /kebeli\s+(nggak|gak|kah)?/i,
        /(can|could)\s+i\s+afford/i,
        /should\s+i\s+buy/i
    ];

    for (const pattern of affordabilityPatterns) {
        if (pattern.test(text)) {
            return true;
        }
    }

    // 3. Pola evaluasi atau analisis finansial user
    const analysisPatterns = [
        /(kondisi|kesehatan|analisis|evaluasi|tinjau|rekap|laporan)\s+(keuangan|finansial|dompet)/i,
        /(keuangan|finansial)\s+(aku|saya|gue|gw)/i,
        /apakah\s+(aku|saya|gue|gw)\s+(boros|hemat)/i
    ];

    for (const pattern of analysisPatterns) {
        if (pattern.test(text)) {
            return true;
        }
    }

    return false;
}

/**
 * Membangun prompt pesan user.
 * Jika pertanyaan berkaitan dengan keuangan pribadi, sematkan ringkasan financialData.
 * Jika pertanyaan bersifat umum/non-keuangan (greeting, casual, coding, writing, sains, jokes, dll),
 * kirim pesan murni pertanyaan user tanpa financial context agar AI fokus penuh.
 * 
 * @param {string} question - Pertanyaan dari user
 * @param {object} financialData - Objek data keuangan
 * @returns {string}
 */
function buildUserMessageWithContext(question, financialData = {}) {
    const rawQuestion = (question || "").trim();

    // Periksa apakah pertanyaan berkaitan dengan keuangan pribadi
    if (!isFinancialQuery(rawQuestion)) {
        // Untuk pertanyaan umum / non-keuangan: fokus pada pertanyaan user tanpa financial context
        return rawQuestion;
    }

    // Untuk pertanyaan relevan dengan keuangan: sertakan konteks data finansial user
    const summary = formatFinancialDataSummary(financialData);

    return `[DATA KEUANGAN USER]
${summary}

[PERTANYAAN USER]
${rawQuestion}

Petunjuk: Jawablah pertanyaan user dengan memanfaatkan data keuangan di atas secara tepat, ramah, dan solutif.`;
}

module.exports = {
    getSystemInstruction,
    formatFinancialDataSummary,
    buildUserMessageWithContext,
    isFinancialQuery
};
