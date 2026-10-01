/**
 * Fallback Response Generator untuk ThinkSpend AI
 *
 * Digunakan jika pemanggilan Gemini API gagal, timeout, atau kuota habis.
 * Fallback tetap mendukung percakapan umum dan fitur keuangan ThinkSpend.
 */

// Helper format angka ke mata uang Rupiah
function formatRupiah(number) {
    if (number === null || number === undefined || isNaN(Number(number))) {
        return "Rp0";
    }

    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(Number(number));
}

// Deteksi apakah pertanyaan memang berkaitan dengan keuangan
function isFinancialQuery(q) {
    const financeKeywords = [
        "saldo",
        "pemasukan",
        "pengeluaran",
        "keuangan",
        "uang",
        "budget",
        "budgeting",
        "tabungan",
        "menabung",
        "nabung",
        "target tabungan",
        "boros",
        "hemat",
        "belanja",
        "pengeluaran",
        "transaksi",
        "gaji",
        "penghasilan",
        "saving",
        "dana darurat",
        "investasi",
        "invest",
        "utang",
        "hutang",
        "cicilan",
        "beli",
        "membeli"
    ];

    return financeKeywords.some(keyword => q.includes(keyword));
}

/**
 * Generate fallback response
 *
 * @param {string} question - Pertanyaan user
 * @param {object} financialData - Data keuangan user
 * @returns {string} - Respon fallback ThinkSpend AI
 */
function generateFallbackResponse(question = "", financialData = {}) {
    const q = (question || "").toLowerCase().trim();

    const income = Number(financialData.income) || 0;
    const expense = Number(financialData.expense) || 0;
    const balance =
        financialData.balance !== undefined &&
        financialData.balance !== null
            ? Number(financialData.balance)
            : income - expense;

    const transactionCount =
        Number(financialData.transactionCount) || 0;

    const topCategory =
        financialData.topExpenseCategory || "pengeluaran harian";

    // =========================================================
    // 1. SAPAAN / OBROLAN KASUAL
    // =========================================================

    if (
        q === "halo" ||
        q === "hai" ||
        q === "hi" ||
        q.includes("selamat pagi") ||
        q.includes("selamat siang") ||
        q.includes("selamat sore") ||
        q.includes("selamat malam")
    ) {
        return "Halo! 👋 Aku ThinkSpend AI. Ada yang mau kamu tanyakan atau obrolkan hari ini?";
    }

   if (
    q.includes("apa kabar") ||
    q.includes("lagi ngapain") ||
    q.includes("siapa kamu") ||
    q.includes("kamu siapa")
) {
        return "Aku ThinkSpend AI 🤖 Aku bisa nemenin kamu ngobrol, bantu belajar, coding, nulis, menjawab pertanyaan umum, dan tentu saja membantu menganalisis keuanganmu di ThinkSpend.";
    }

    if (
        q.includes("makasih") ||
        q.includes("terima kasih") ||
        q.includes("thanks")
    ) {
        return "Sama-sama! 😄 Senang bisa bantu.";
    }

    // =========================================================
    // 2. PERTANYAAN UMUM TENTANG PYTHON / CODING
    // =========================================================

    if (
        q.includes("apa itu python") ||
        q.includes("python itu apa") ||
        q === "python"
    ) {
        return "Python adalah bahasa pemrograman tingkat tinggi yang populer karena sintaksnya relatif sederhana dan mudah dibaca. Python banyak digunakan untuk web development, data science, machine learning, automation, sampai pengembangan aplikasi.";
    }

    if (
        q.includes("buatkan kode python") ||
        q.includes("contoh kode python") ||
        q.includes("coding python")
    ) {
        return "Tentu! 😄 Kasih tahu aku program Python apa yang ingin kamu buat, misalnya kalkulator, CRUD, pengolahan data, machine learning, atau program sederhana lainnya.";
    }

    // =========================================================
    // 3. OBROLAN / HIBURAN
    // =========================================================

    if (
        q.includes("joke") ||
        q.includes("jokes") ||
        q.includes("lelucon") ||
        q.includes("tebak-tebakan")
    ) {
        return "Siap 😆 Kenapa programmer suka ngopi? Karena kalau nggak ada Java, hidupnya terasa kurang class. ☕😂";
    }

    if (
        q.includes("main yuk") ||
        q.includes("maen yuk") ||
        q.includes("ayo main")
    ) {
        return "Ayo! 😆 Kita bisa main tebak-tebakan, trivia, teka-teki, atau permainan kata. Pilih satu!";
    }

    // =========================================================
    // 4. JIKA BUKAN PERTANYAAN KEUANGAN
    // =========================================================

    if (!isFinancialQuery(q)) {
        return "Tentu! Aku siap bantu menjawab pertanyaan itu. Coba jelaskan sedikit lebih detail supaya aku bisa memberikan jawaban yang lebih tepat.";
    }

    // =========================================================
    // 5. DATA TRANSAKSI MASIH SEDIKIT
    // Hanya berlaku untuk pertanyaan finance
    // =========================================================

    if (transactionCount > 0 && transactionCount < 3) {
        return (
            "Data keuanganmu baru tercatat " +
            transactionCount +
            " transaksi, jadi belum cukup untuk menggambarkan pola pengeluaranmu secara akurat. " +
            "Coba lanjutkan mencatat transaksi selama beberapa hari ke depan ya, nanti aku bantu analisis lebih dalam!"
        );
    }

    // =========================================================
    // 6. BOROS / PENGELUARAN
    // =========================================================

    if (
        q.includes("boros") ||
        q.includes("pengeluaran") ||
        q.includes("banyak belanja")
    ) {
        if (income > 0 && expense > 0) {
            const expenseRatio = Math.round((expense / income) * 100);

            if (expense > income) {
                return `Pengeluaranmu saat ini (${formatRupiah(expense)}) sudah melebihi pemasukanmu (${formatRupiah(income)}). Kondisi ini menunjukkan arus kas sedang defisit. Untuk sementara, coba prioritaskan kebutuhan utama dan tunda pengeluaran yang belum mendesak.`;
            }

            if (expenseRatio > 70) {
                return `Pengeluaranmu saat ini sekitar ${expenseRatio}% dari pemasukan. Pos pengeluaran terbesar ada di kategori ${topCategory}. Kamu bisa mulai memperhatikan pengeluaran non-esensial agar saldo ${formatRupiah(balance)} tetap aman.`;
            }

            return `Pengeluaranmu saat ini sekitar ${expenseRatio}% dari pemasukan dengan saldo tersisa ${formatRupiah(balance)}. Dari data yang tersedia, arus kasmu masih terkendali.`;
        }

        return "Untuk menilai apakah pengeluaranmu tergolong boros, aku perlu data pemasukan dan pengeluaran yang lebih lengkap. Pastikan transaksi terbaru sudah tercatat di ThinkSpend.";
    }

    // =========================================================
    // 7. TABUNGAN / TARGET
    // =========================================================

    if (
        q.includes("tabung") ||
        q.includes("target") ||
        q.includes("goal") ||
        q.includes("nabung")
    ) {
        if (income > 0) {
            const idealSaving = Math.round(income * 0.2);

            return `Salah satu patokan yang bisa digunakan adalah menyisihkan sekitar 20% dari pemasukan. Dengan pemasukan ${formatRupiah(income)}, jumlah tersebut sekitar ${formatRupiah(idealSaving)}. Saldo saat ini tercatat ${formatRupiah(balance)}.`;
        }

        return `Untuk mencapai target tabungan, kamu bisa menetapkan nominal yang ingin disisihkan secara rutin. Saat ini saldo yang tercatat adalah ${formatRupiah(balance)}.`;
    }

    // =========================================================
    // 8. BOLEH BELI / MEMBELI BARANG
    // =========================================================

    if (
        q.includes("boleh beli") ||
        q.includes("beli") ||
        q.includes("membeli") ||
        q.includes("belanja")
    ) {
        return `Sebelum membeli barang tersebut, coba cek apakah pembelian itu kebutuhan atau keinginan dan apakah tidak mengganggu kebutuhan utama. Saldo yang tercatat saat ini adalah ${formatRupiah(balance)}.`;
    }

    // =========================================================
    // 9. MENGATUR UANG / HEMAT / BUDGETING
    // =========================================================

    if (
        q.includes("atur uang") ||
        q.includes("kelola uang") ||
        q.includes("cara hemat") ||
        q.includes("budgeting") ||
        q.includes("mengatur keuangan")
    ) {
        return "Salah satu cara sederhana mengatur uang adalah membagi pemasukan ke beberapa pos seperti kebutuhan utama, keinginan, tabungan, dan dana darurat. Yang paling penting, catat transaksi secara konsisten agar pola pengeluaranmu bisa terlihat.";
    }

    // =========================================================
    // 10. FOLLOW-UP KEUANGAN
    // =========================================================

    if (
        q.includes("terus gimana") ||
        q.includes("gimana dong") ||
        q.includes("lalu bagaimana") ||
        q.includes("solusi")
    ) {
        if (expense > income && income > 0) {
            return `Karena pengeluaranmu lebih besar daripada pemasukan, langkah pertama adalah melihat kategori ${topCategory} dan mencari pengeluaran yang bisa dikurangi. Saldo saat ini ${formatRupiah(balance)}.`;
        }

        return "Langkah berikutnya adalah terus mencatat transaksi dan melihat kategori pengeluaran yang paling banyak menggunakan uangmu. Dari sana kita bisa menentukan bagian mana yang perlu disesuaikan.";
    }

    // =========================================================
    // 11. DEFAULT UNTUK PERTANYAAN FINANCE
    // =========================================================

    if (isFinancialQuery(q)) {
        if (balance > 0 || income > 0 || expense > 0) {
            return `Berdasarkan catatan saat ini, saldo tercatat ${formatRupiah(balance)} dengan pengeluaran ${formatRupiah(expense)}. Kategori pengeluaran terbesar adalah ${topCategory}. Ada bagian keuangan tertentu yang ingin kamu analisis?`;
        }

        return "Aku belum memiliki cukup data keuangan untuk memberikan analisis. Coba pastikan pemasukan dan pengeluaranmu sudah tercatat di ThinkSpend.";
    }

    // =========================================================
    // 12. FALLBACK PALING AKHIR
    // =========================================================

    return "Aku siap membantu. Ceritakan apa yang ingin kamu tanyakan 😊";
}

module.exports = {
    generateFallbackResponse,
    formatRupiah
};