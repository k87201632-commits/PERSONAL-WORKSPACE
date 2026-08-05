// Data Terpusat Mata Pelajaran Sekolah XI.3 SMA Cinta Kasih Tzu Chi
// Setiap subject memiliki properti 'file' untuk routing ke halaman terpisah
const subjectsData = [
    {
        id: "informatika",
        name: "Informatika",
        icon: "💻",
        accent: "#3b82f6",
        file: "informatika.html",
        description: "Pembelajaran ilmu komputer, algoritma pemrograman, basis data, jaringan komputer, serta etika dan hukum teknologi informasi.",
        resources: [
            { title: "Modul Dasar Pemrograman & Algoritma", type: "PDF" },
            { title: "Panduan Dasar Enkripsi Kriptografi", type: "Dokumen" },
            { title: "Rangkuman UU ITE & Etika Digital", type: "Artikel" }
        ]
    },
    {
        id: "bahasa-indonesia",
        name: "Bahasa Indonesia",
        icon: "✍️",
        accent: "#a855f7",
        file: "bahasa-indonesia.html",
        description: "Pengembangan keterampilan berbahasa, analisis sastra klasik hikayat, penulisan esai kritis, teks observasi, dan diplomasi teks negosiasi.",
        resources: [
            { title: "Pedoman Penulisan Esai & Resensi", type: "PDF" },
            { title: "Kumpulan Teks Hikayat Klasik", type: "Dokumen" },
            { title: "Kaidah Kebahasaan Teks Negosiasi", type: "Materi" }
        ]
    },
    {
        id: "matematika-wajib",
        name: "Matematika Wajib",
        icon: "📐",
        accent: "#10b981",
        file: "matematika-wajib.html",
        description: "Penalaran logis, aljabar, kalkulus dasar, fungsi, dan pengolahan data statistik matematika.",
        resources: [
            { title: "Rumus Utama Aljabar & Fungsi", type: "PDF" }
        ]
    },
    {
        id: "sosiologi",
        name: "Sosiologi",
        icon: "👥",
        accent: "#f59e0b",
        file: "sosiologi.html",
        description: "Studi struktur sosial, dinamika kelompok masyarakat, interaksi sosial, dan analisis permasalahan sosial.",
        resources: [
            { title: "Modul Interaksi & Struktur Sosial", type: "PDF" }
        ]
    },
    {
        id: "ekonomi",
        name: "Ekonomi",
        icon: "📊",
        accent: "#06b6d4",
        file: "ekonomi.html",
        description: "Pemahaman mekanisme pasar, manajemen keuangan, akuntansi dasar, serta kebijakan ekonomi publik.",
        resources: [
            { title: "Dasar Akuntansi & Laporan Keuangan", type: "Dokumen" }
        ]
    },
    {
        id: "sejarah",
        name: "Sejarah",
        icon: "🏛️",
        accent: "#ec4899",
        file: "sejarah.html",
        description: "Kajian peristiwa sejarah peradaban, perjuangan kemerdekaan, dan perkembangan bangsa.",
        resources: [
            { title: "Catatan Sejarah Kebangsaan", type: "PDF" }
        ]
    },
    {
        id: "geografi",
        name: "Geografi",
        icon: "🌍",
        accent: "#8b5cf6",
        file: "geografi.html",
        description: "Analisis fenomena geosfer, pemetaan peta spasial, iklim, dan tata ruang wilayah.",
        resources: [
            { title: "Panduan Membaca Peta & Spasial", type: "Materi" }
        ]
    },
    {
        id: "ppkn",
        name: "PPKN",
        icon: "🇮🇩",
        accent: "#ef4444",
        file: "ppkn.html",
        description: "Pendidikan kewarganegaraan, konstitusi Pancasila, UUD 1945, serta kesadaran hukum bangsa.",
        resources: [
            { title: "Rangkuman Konstitusi & Hak Asasi", type: "PDF" }
        ]
    },
    {
        id: "bahasa-inggris",
        name: "Bahasa Inggris",
        icon: "🗣️",
        accent: "#6366f1",
        file: "bahasa-inggris.html",
        description: "Penguasaan tata bahasa internasional, pemahaman bacaan naratif, dan komunikasi lisan profesional.",
        resources: [
            { title: "Grammar & Academic Writing Guide", type: "PDF" }
        ]
    },
    {
        id: "mandarin",
        name: "Mandarin",
        icon: "🏮",
        accent: "#f43f5e",
        file: "mandarin.html",
        description: "Pembelajaran karakter Hanzi, tata bahasa Mandarin dasar, percakapan harian, dan kebudayaan.",
        resources: [
            { title: "Kosakata Hanzi Dasar XI", type: "Dokumen" }
        ]
    },
    {
        id: "pkwu",
        name: "PKWU",
        icon: "💡",
        accent: "#14b8a6",
        file: "pkwu.html",
        description: "Prakarya dan kewirausahaan, inovasi produk, perencanaan bisnis kreatif, serta pemasaran.",
        resources: [
            { title: "Perencanaan Usaha Kreatif", type: "PDF" }
        ]
    },
    {
        id: "pjok",
        name: "PJOK",
        icon: "⚽",
        accent: "#84cc16",
        file: "pjok.html",
        description: "Pendidikan jasmani, olahraga kesehatan, kebugaran fisik, dan pembentukan kebiasaan hidup sehat.",
        resources: [
            { title: "Panduan Kebugaran Jasmani Mandiri", type: "Dokumen" }
        ]
    },
    {
        id: "seni-budaya",
        name: "Seni Budaya",
        icon: "🎨",
        accent: "#d946ef",
        file: "seni-budaya.html",
        description: "Apresiasi karya seni rupa, musik daerah, pementasan seni, dan kreativitas ekspresi budaya.",
        resources: [
            { title: "Modul Apresiasi Seni Rupa", type: "PDF" }
        ]
    }
];
