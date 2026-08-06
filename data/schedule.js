// Data Jadwal Pelajaran XI.3 SMA Cinta Kasih Tzu Chi
const schoolSchedule = {
    kelas: "XI.3",
    hari: {
        Senin: [
            { start: "06:30", end: "07:30", subject: "Upacara / Pembiasaan", room: "Lapangan / Kelas", isBreak: false },
            { start: "07:30", end: "08:15", subject: "Sosiologi-3", room: "Ruang 11.3", isBreak: false },
            { start: "08:15", end: "09:00", subject: "Sosiologi-3", room: "Ruang 11.3", isBreak: false },
            { start: "09:00", end: "09:30", subject: "Istirahat I", room: "Kantin", isBreak: true },
            { start: "09:30", end: "10:10", subject: "Mandarin-25", room: "Ruang 11.3", isBreak: false },
            { start: "10:10", end: "10:50", subject: "Mandarin-25", room: "Ruang 11.3", isBreak: false },
            { start: "10:50", end: "11:30", subject: "Budi Pekerti-26", room: "Ruang 11.3", isBreak: false },
            { start: "11:30", end: "12:10", subject: "Budaya Humanis-9", room: "Ruang 11.3", isBreak: false },
            { start: "12:10", end: "12:40", subject: "Istirahat II", room: "Kantin", isBreak: true },
            { start: "12:40", end: "13:20", subject: "Matematika Wajib-10", room: "Ruang 11.3", isBreak: false },
            { start: "13:20", end: "14:00", subject: "Ekonomi-4", room: "Ruang 11.3", isBreak: false },
            { start: "14:00", end: "14:40", subject: "Ekonomi-4", room: "Ruang 11.3", isBreak: false }
        ],
        Selasa: [
            { start: "06:30", end: "06:45", subject: "Pembiasaan Pagi", room: "Ruang 11.3", isBreak: false },
            { start: "06:45", end: "07:30", subject: "Matematika Wajib-10", room: "Ruang 11.3", isBreak: false },
            { start: "07:30", end: "08:15", subject: "Matematika Wajib-10", room: "Ruang 11.3", isBreak: false },
            { start: "08:15", end: "09:00", subject: "Agama-26", room: "Ruang 11.3", isBreak: false },
            { start: "09:00", end: "09:45", subject: "Agama-26", room: "Ruang 11.3", isBreak: false },
            { start: "09:45", end: "10:05", subject: "Istirahat I", room: "Kantin", isBreak: true },
            { start: "10:05", end: "10:50", subject: "Informatika-22", room: "Lab Komputer", isBreak: false },
            { start: "10:50", end: "11:35", subject: "Informatika-22", room: "Lab Komputer", isBreak: false },
            { start: "11:35", end: "12:00", subject: "Istirahat II", room: "Kantin", isBreak: true },
            { start: "12:00", end: "12:40", subject: "Ekonomi-4", room: "Ruang 11.3", isBreak: false },
            { start: "12:40", end: "13:20", subject: "Ekonomi-4", room: "Ruang 11.3", isBreak: false },
            { start: "13:20", end: "14:00", subject: "Sosiologi-3", room: "Ruang 11.3", isBreak: false },
            { start: "14:00", end: "14:30", subject: "Sosiologi-3", room: "Ruang 11.3", isBreak: false }
        ],
        Rabu: [
            { start: "06:30", end: "06:45", subject: "Pembiasaan Pagi", room: "Ruang 11.3", isBreak: false },
            { start: "06:45", end: "07:30", subject: "Informatika-22", room: "Lab Komputer", isBreak: false },
            { start: "07:30", end: "08:15", subject: "Informatika-22", room: "Lab Komputer", isBreak: false },
            { start: "08:15", end: "09:00", subject: "Mandarin-25", room: "Ruang 11.3", isBreak: false },
            { start: "09:00", end: "09:30", subject: "Istirahat I", room: "Kantin", isBreak: true },
            { start: "09:30", end: "10:10", subject: "Mandarin-25", room: "Ruang 11.3", isBreak: false },
            { start: "10:10", end: "10:50", subject: "Sosiologi-3", room: "Ruang 11.3", isBreak: false },
            { start: "10:50", end: "11:30", subject: "Bahasa Indonesia-17", room: "Ruang 11.3", isBreak: false },
            { start: "11:30", end: "12:10", subject: "Kokurikuler-4", room: "Ruang 11.3", isBreak: false },
            { start: "12:10", end: "12:40", subject: "Istirahat II", room: "Kantin", isBreak: true },
            { start: "12:40", end: "13:20", subject: "Sejarah-3", room: "Ruang 11.3", isBreak: false },
            { start: "13:20", end: "14:00", subject: "Sejarah-3", room: "Ruang 11.3", isBreak: false },
            { start: "14:00", end: "14:40", subject: "Seni Budaya-5", room: "Ruang Kesenian", isBreak: false },
            { start: "14:40", end: "15:20", subject: "Seni Budaya-5", room: "Ruang Kesenian", isBreak: false }
        ],
        Kamis: [
            { start: "06:30", end: "06:45", subject: "Pembiasaan Pagi", room: "Ruang 11.3", isBreak: false },
            { start: "06:45", end: "07:30", subject: "Informatika-22", room: "Lab Komputer", isBreak: false },
            { start: "07:30", end: "08:15", subject: "Informatika-22", room: "Lab Komputer", isBreak: false },
            { start: "08:15", end: "09:00", subject: "Matematika Wajib-10", room: "Ruang 11.3", isBreak: false },
            { start: "09:00", end: "09:30", subject: "Istirahat I", room: "Kantin", isBreak: true },
            { start: "09:30", end: "10:15", subject: "Matematika Wajib-10", room: "Ruang 11.3", isBreak: false },
            { start: "10:15", end: "11:00", subject: "PPKN-2", room: "Ruang 11.3", isBreak: false },
            { start: "11:00", end: "11:45", subject: "PPKN-2", room: "Ruang 11.3", isBreak: false },
            { start: "11:45", end: "12:30", subject: "Istirahat II", room: "Kantin", isBreak: true },
            { start: "12:30", end: "13:15", subject: "Bahasa Inggris-27", room: "Ruang 11.3", isBreak: false },
            { start: "13:15", end: "13:55", subject: "Bahasa Inggris-27", room: "Ruang 11.3", isBreak: false },
            { start: "13:55", end: "14:35", subject: "Bahasa Inggris-27", room: "Ruang 11.3", isBreak: false },
            { start: "14:35", end: "15:15", subject: "Ekonomi-4", room: "Ruang 11.3", isBreak: false }
        ],
        Jumat: [
            { start: "06:30", end: "07:15", subject: "Jumat Bersih / Sehat / Literasi", room: "Lingkungan Sekolah", isBreak: false },
            { start: "07:15", end: "08:00", subject: "PKWU-4", room: "Ruang 11.3", isBreak: false },
            { start: "08:00", end: "08:45", subject: "PKWU-4", room: "Ruang 11.3", isBreak: false },
            { start: "08:45", end: "09:15", subject: "Istirahat I", room: "Kantin", isBreak: true },
            { start: "09:15", end: "10:00", subject: "PJOK-20", room: "Lapangan Olahraga", isBreak: false },
            { start: "10:00", end: "10:45", subject: "PJOK-20 / Konseling-11", room: "Lapangan / Ruang BK", isBreak: false },
            { start: "11:35", end: "12:30", subject: "Jumat Ibadah", room: "Aula / Tempat Ibadah", isBreak: false },
            { start: "12:30", end: "13:00", subject: "Istirahat II", room: "Kantin", isBreak: true },
            { start: "13:00", end: "13:45", subject: "Geografi-14", room: "Ruang 11.3", isBreak: false },
            { start: "13:45", end: "14:30", subject: "Geografi-14", room: "Ruang 11.3", isBreak: false }
        ]
    }
};
