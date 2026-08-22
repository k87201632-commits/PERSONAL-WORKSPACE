// ==========================================================================
// PERSONAL-WORKSPACE — KONFIGURASI PESAN LOADING (LOADING-MESSAGES.JS)
// ==========================================================================

const LOADING_CONFIG = {
    durations: {
        firstDashboard: 2800,
        normalPage: 1800,
        returningDashboard: 2000
    },
    messages: {
        dashboard: {
            firstVisit: {
                title: "Selamat datang.",
                subtitle: "Semoga hari ini menjadi langkah kecil menuju sesuatu yang besar."
            },
            returning: [
                {
                    title: "Keep going.",
                    subtitle: "Kamu sudah sejauh ini. Jangan berhenti sekarang."
                },
                {
                    title: "Pelan-pelan juga tetap maju.",
                    subtitle: "Yang penting, kamu terus bergerak."
                },
                {
                    title: "Satu langkah lagi.",
                    subtitle: "Hal besar selalu dimulai dari langkah kecil."
                },
                {
                    title: "You're doing fine.",
                    subtitle: "Fokus pada prosesnya, bukan hanya hasil akhirnya."
                },
                {
                    title: "Jangan lupa bernapas.",
                    subtitle: "Kamu tidak harus menyelesaikan semuanya sekaligus."
                }
            ]
        },
        jadwal: {
            title: "Mari atur langkahmu.",
            subtitle: "Lihat apa yang menantimu hari ini."
        },
        tugas: {
            title: "Satu tugas, satu langkah.",
            subtitle: "Kerjakan perlahan, yang penting terus maju."
        },
        pelajaran: {
            title: "Saatnya belajar.",
            subtitle: "Sedikit demi sedikit, pemahamanmu akan bertambah."
        },
        arcade: {
            title: "Waktunya istirahat sejenak.",
            subtitle: "Nikmati permainan, lalu kembali dengan energi baru."
        },
        profil: {
            title: "Kenali dirimu lebih jauh.",
            subtitle: "Setiap perjalanan punya cerita masing-masing."
        }
    }
};

window.LOADING_CONFIG = LOADING_CONFIG;
