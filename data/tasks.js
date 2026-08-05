// Data Tugas Awal Hasil Migrasi
const initialTasks = [
    {
        id: "task-1",
        title: "Peran Informatika dalam Kehidupan Sehari-hari",
        subject: "Informatika",
        category: "Artikel",
        createdAt: "2026-07-27",
        deadline: "2026-08-05",
        summary: "Artikel analisis tentang pentingnya informatika serta penerapannya dalam pendidikan, bisnis, dan layanan kesehatan.",
        content: `
            <p>Di era digital saat ini, informatika menjadi salah satu bidang ilmu yang memiliki peran penting dalam kehidupan manusia. Informatika tidak hanya mempelajari penggunaan komputer, tetapi juga bagaimana data diolah menjadi informasi yang bermanfaat melalui pemrograman, jaringan komputer, basis data, serta kecerdasan buatan. Hampir seluruh aktivitas masyarakat modern, seperti belajar, bekerja, berkomunikasi, hingga berbelanja, memanfaatkan teknologi yang dikembangkan melalui ilmu informatika.</p>
            <p>Salah satu penerapan informatika yang paling sering dijumpai adalah pada layanan pendidikan. Berbagai platform pembelajaran daring memungkinkan siswa mengakses materi, mengumpulkan tugas, dan berinteraksi dengan guru tanpa harus berada di ruang kelas. Selain itu, dunia bisnis juga memanfaatkan sistem informasi untuk mengelola data pelanggan, transaksi, hingga laporan keuangan secara cepat dan akurat. Di bidang kesehatan, teknologi informatika membantu rumah sakit dalam menyimpan rekam medis digital sehingga pelayanan kepada pasien menjadi lebih efisien.</p>
            <p>Meskipun memberikan banyak manfaat, perkembangan informatika juga menghadirkan tantangan. Ancaman seperti pencurian data pribadi, penyebaran berita palsu, peretasan akun, serta penyalahgunaan teknologi menjadi masalah yang harus dihadapi. Oleh karena itu, setiap pengguna teknologi perlu memiliki literasi digital, memahami pentingnya menjaga keamanan data, menggunakan kata sandi yang kuat, serta bersikap bijak saat mengakses maupun membagikan informasi di internet.</p>
            <h3>Kesimpulan</h3>
            <p>Penguasaan informatika menjadi kemampuan penting bagi generasi muda untuk menghadapi perkembangan teknologi secara bertanggung jawab.</p>
        `,
        status: "Selesai",
        code: "",
        cover: "https://picsum.photos/seed/informatika-peran/800/600",
        attachments: []
    },
    {
        id: "task-2",
        title: "Undang-Undang ITE dan Etika Digital",
        subject: "Informatika",
        category: "Teori / Analisis",
        createdAt: "2026-07-28",
        deadline: "2026-08-08",
        summary: "Pembahasan mengenai aturan penggunaan teknologi informasi dan kepastian hukum transaksi elektronik di Indonesia.",
        content: `
            <p>UU ITE adalah singkatan dari Undang-Undang Informasi dan Transaksi Elektronik, yaitu aturan yang mengatur penggunaan teknologi informasi dan transaksi elektronik di Indonesia. UU ini dibuat untuk memberikan kepastian hukum dalam aktivitas digital, seperti komunikasi melalui internet, transaksi online, serta penyebaran informasi melalui media elektronik.</p>
            <p>UU ITE mengatur berbagai hal, termasuk penggunaan dokumen elektronik, transaksi elektronik, perlindungan data dan informasi, serta tindakan yang dilarang di dunia digital. Aturan ini juga berkaitan dengan berbagai bentuk penyalahgunaan teknologi, seperti akses ilegal, manipulasi informasi elektronik, dan penyebaran konten tertentu yang melanggar hukum.</p>
            <h3>Kesimpulan</h3>
            <p>UU ITE merupakan aturan penting dalam mengatur aktivitas digital di Indonesia. Dengan memahami dan menaati UU ITE, masyarakat dapat menggunakan teknologi dan internet secara lebih aman, bijak, dan bertanggung jawab.</p>
        `,
        status: "Selesai",
        code: "",
        cover: "https://picsum.photos/seed/informatika-uu-ite/800/600",
        attachments: []
    },
    {
        id: "task-3",
        title: "Kriptografi dan Keamanan Data",
        subject: "Informatika",
        category: "Pemrograman",
        createdAt: "2026-07-28",
        deadline: "2026-08-10",
        summary: "Studi pengolahan angka enkripsi dan dekripsi untuk melindungi transaksi serta komunikasi data pribadi.",
        content: `
            <p>Dalam kehidupan sehari-hari, kriptografi digunakan untuk melindungi kata sandi, transaksi online, pesan pribadi, dan komunikasi melalui internet. Salah satu penerapannya dapat ditemukan pada situs web yang menggunakan protokol HTTPS untuk membantu menjaga keamanan pertukaran data antara pengguna dan server.</p>
            <p>Pengolahan algoritma enkripsi memastikan bahwa data sensitif yang dikirim melalui jaringan tidak dapat dibaca oleh pihak yang tidak berwenang tanpa kunci dekripsi yang sah.</p>
            <h3>Kesimpulan</h3>
            <p>Pemahaman dasar kriptografi membantu pengembang web dan pengguna internet dalam membangun sistem yang aman serta terproteksi dari ancaman peretasan data.</p>
        `,
        status: "Sedang Dikerjakan",
        code: `// Contoh implementasi Caesar Cipher sederhana dalam JavaScript
function caesarCipher(text, shift) {
    return text.split('').map(char => {
        const code = char.charCodeAt(0);
        if (code >= 65 && code <= 90) {
            return String.fromCharCode(((code - 65 + shift) % 26) + 65);
        } else if (code >= 97 && code <= 122) {
            return String.fromCharCode(((code - 97 + shift) % 26) + 97);
        }
        return char;
    }).join('');
}

console.log(caesarCipher("WORKSPACE", 3)); // Hasil: ZRUNVSDFH`,
        cover: "https://picsum.photos/seed/informatika-kripto/800/600",
        attachments: ["Laporan_Kriptografi.pdf"]
    },
    {
        id: "task-4",
        title: "Hikayat Raja Arif dan Batu Cahaya",
        subject: "Bahasa Indonesia",
        category: "Hikayat",
        createdAt: "2026-07-30",
        deadline: "2026-08-06",
        summary: "Kisah hikayat klasik tentang kejujuran, ketulusan hati, dan bahaya keserakahan harta.",
        content: `
            <p>Pada zaman dahulu kala, berdirilah sebuah kerajaan bernama Purnama Jaya yang dipimpin oleh Raja Arif. Baginda dikenal sebagai raja yang adil, bijaksana, dan sangat menyayangi rakyatnya. Pada suatu hari, datanglah seorang pertapa tua membawa sebuah batu yang dapat memancarkan cahaya keemasan. Pertapa itu berkata bahwa batu tersebut hanya akan bersinar di tangan orang yang memiliki hati tulus dan jujur.</p>
            <p>Berita tentang Batu Cahaya itu kemudian tersebar ke seluruh kerajaan. Seorang saudagar kaya bernama Darman sangat ingin memilikinya. Ia menawarkan seluruh kekayaannya kepada Raja Arif, tetapi sang raja menolak karena benda tersebut bukanlah sesuatu yang dapat dibeli dengan harta. Karena dikuasai keserakahan, Darman akhirnya berniat mencuri batu tersebut pada malam hari.</p>
            <p>Ketika berhasil mengambil Batu Cahaya, tiba-tiba cahaya batu itu padam. Darman terkejut dan mendengar suara yang berkata bahwa harta yang diperoleh dengan keserakahan tidak akan membawa kebahagiaan. Darman pun menyadari kesalahannya dan segera mengembalikan batu tersebut kepada Raja Arif. Ia meminta maaf dan berjanji untuk meninggalkan sifat tamaknya.</p>
            <p>Raja Arif memaafkan Darman dan memintanya menggunakan kekayaannya untuk membantu rakyat yang membutuhkan. Sejak saat itu, Darman berubah menjadi saudagar yang dermawan dan suka menolong. Konon, setelah hatinya benar-benar berubah, Batu Cahaya kembali bersinar terang.</p>
            <h3>Amanat Hikayat</h3>
            <p>Kejujuran, ketulusan, dan kepedulian kepada sesama jauh lebih berharga daripada kekayaan yang diperoleh dengan cara yang tidak jujur.</p>
        `,
        status: "Selesai",
        code: "",
        cover: "https://picsum.photos/seed/bindo-hikayat/800/600",
        attachments: []
    },
    {
        id: "task-5",
        title: "Laporan Hasil Observasi Tanaman Lidah Buaya",
        subject: "Bahasa Indonesia",
        category: "Laporan Hasil Observasi",
        createdAt: "2026-07-30",
        deadline: "2026-08-12",
        summary: "Laporan hasil pengamatan ilmiah mengenai struktur fisik, manfaat, dan cara perawatan tanaman lidah buaya.",
        content: `
            <p>Tanaman lidah buaya merupakan salah satu tanaman yang banyak ditemukan di lingkungan sekitar. Tanaman ini dikenal memiliki daun yang tebal, panjang, dan berdaging. Lidah buaya dapat tumbuh di daerah dengan kondisi yang cukup panas dan tidak membutuhkan banyak air.</p>
            <p>Lidah buaya memiliki daun berwarna hijau dengan bentuk memanjang dan ujung yang meruncing. Pada bagian tepi daun terdapat duri-duri kecil. Di dalam daunnya terdapat gel bening yang mengandung banyak air dan sering dimanfaatkan dalam berbagai produk.</p>
            <p>Berdasarkan hasil pengamatan, lidah buaya memiliki beberapa manfaat bagi manusia. Gel lidah buaya dapat digunakan sebagai bahan dalam produk perawatan kulit dan rambut. Selain itu, tanaman ini juga sering dimanfaatkan sebagai tanaman hias karena perawatannya relatif mudah.</p>
            <h3>Kesimpulan</h3>
            <p>Lidah buaya merupakan tanaman yang mudah dirawat dan memiliki berbagai manfaat kesehatan serta kecantikan.</p>
        `,
        status: "Selesai",
        code: "",
        cover: "https://picsum.photos/seed/bindo-ai/800/600",
        attachments: []
    },
    {
        id: "task-6",
        title: "Analisis Kebahasaan Teks Negosiasi Laboratorium",
        subject: "Bahasa Indonesia",
        category: "Teks Negosiasi",
        createdAt: "2026-07-30",
        deadline: "2026-08-14",
        summary: "Analisis struktur orientasi, pengajuan, penawaran, dan kesepakatan dalam negosiasi pengadaan fasilitas sekolah.",
        content: `
            <p>Teks negosiasi memiliki karakteristik kebahasaan tersendiri yang membedakannya dari jenis teks lain. Tujuan utama negosiasi adalah mencapai kesepakatan di antara dua belah pihak yang memiliki kepentingan berbeda. Kaidah kebahasaan yang menonjol meliputi kalimat persuasif, pronomina persona, kalimat bersyarat, dan tuturan berpasangan.</p>
            <div class="dialog-box">
                <p><strong>OSIS:</strong> "Selamat pagi, Pak. Kami mewakili klub komputer ingin mengajukan proposal kerjasama pengadaan server lokal untuk latihan coding siswa." <em>(Pengajuan)</em></p>
                <p><strong>Kepala Sekolah:</strong> "Selamat pagi. Proposal sudah saya baca, namun dana operasional sekolah triwulan ini difokuskan untuk renovasi perpustakaan. Apakah proyek ini mendesak?" <em>(Penolakan Halus)</em></p>
                <p><strong>OSIS:</strong> "Kami memahaminya, Pak. Namun jika server ini disetujui, kami bersedia membantu mendigitalisasi katalog buku perpustakaan secara sukarela sebagai bagian proyek praktek kami." <em>(Penawaran Persuasif)</em></p>
                <p><strong>Kepala Sekolah:</strong> "Tawaran yang menarik. Baiklah, saya setuju memberikan setengah dari anggaran proposal, asalkan digitalisasi perpus rampung sebelum akhir semester." <em>(Kesepakatan)</em></p>
            </div>
            <h3>Analisis Kebahasaan</h3>
            <p>Teks di atas mendemonstrasikan struktur penuh negosiasi: Orientasi, Pengajuan, Penawaran, dan Persetujuan. Penggunaan kalimat bersyarat menjadi jembatan diplomasi yang efektif.</p>
        `,
        status: "Belum Dikerjakan",
        code: "",
        cover: "https://picsum.photos/seed/bindo-nego/800/600",
        attachments: ["Proposal_Laboratorium.pdf"]
    },
    {
        id: "task-7",
        title: "Vibe Coding: Cara Baru Berkolaborasi dengan AI dalam Membuat Program",
        subject: "Informatika",
        category: "Artikel",
        createdAt: "2026-08-06",
        deadline: "2026-08-20",
        summary: "Memahami konsep Vibe Coding, cara kerjanya bersama AI, serta kelebihan dan risiko dalam penggunaannya.",
        content: `
            <p>Belakangan ini, istilah <strong>Vibe Coding</strong> mulai ramai diperbincangkan di kalangan pengembang perangkat lunak, termasuk pelajar dan mahasiswa yang tertarik pada dunia pemrograman. Konsep ini merujuk pada gaya baru dalam menulis kode atau membuat program, di mana seseorang tidak lagi harus mengetik setiap baris kode secara manual dari nol. Sebaliknya, mereka berkolaborasi secara intensif dengan kecerdasan buatan (AI) untuk menghasilkan, memperbaiki, dan mengembangkan kode. Dinamakan "vibe" karena pendekatannya yang lebih intuitif, mengalir, dan berfokus pada hasil akhir, sementara AI menangani hal-hal teknis yang detail.</p>
            <p>Secara teknis, Vibe Coding bekerja melalui interaksi antara pengguna dan AI menggunakan <em>prompt</em> atau instruksi teks. Seseorang cukup memberikan penjelasan mengenai fitur atau program apa yang ingin dibuat. Misalnya, "Buatkan saya halaman website portofolio dengan tema gelap yang memiliki animasi saat di-scroll." AI kemudian akan menghasilkan prototype kode yang diminta. Pengguna dapat langsung meninjau hasilnya dan memberikan umpan balik (feedback) jika ada bagian yang kurang sesuai, seolah-olah sedang berdiskusi dengan asisten programmer profesional.</p>
            <p>Kelebihan utama dari metode ini adalah kecepatan dan kemudahannya. Bagi pemula atau siswa SMA yang baru belajar coding, AI sangat membantu mengatasi hambatan awal seperti sintaks yang rumit atau error yang sulit dipahami (debugging). Vibe Coding mempercepat proses pembuatan prototype dan eksperimen, memungkinkan pembuatnya fokus pada perancangan logika dan kreativitas penyelesaian masalah tanpa terhambat oleh masalah teknis sepele. Selain itu, cara ini juga sangat berguna untuk melakukan brainstorming saat menemui jalan buntu dalam sebuah proyek.</p>
            <p>Namun, Vibe Coding juga memiliki kekurangan dan risiko yang perlu diwaspadai. AI tidak selalu sempurna; terkadang kode yang dihasilkan mengandung kesalahan logika, bug yang tersembunyi, atau celah keamanan (security issue). Risiko terbesarnya adalah jika pengguna terlalu bergantung pada AI tanpa memahami cara kerja kode tersebut. Ketika terjadi error kompleks yang tidak bisa diselesaikan oleh AI, seseorang yang hanya melakukan copy-paste akan kesulitan memperbaikinya. Selain itu, penggunaan komponen atau dependency eksternal yang tidak dikenali bisa membuat program menjadi tidak stabil.</p>
            <h3>Kesimpulan</h3>
            <p>Vibe Coding merupakan inovasi luar biasa yang membuat pemrograman menjadi lebih cepat, mudah, dan menyenangkan. Meski demikian, metode ini sebaiknya diperlakukan sebagai <strong>alat bantu</strong> (tools), bukan sebagai pengganti pemahaman dasar programming. Pemahaman fundamental tetap menjadi kunci utama agar kita dapat mengontrol, memodifikasi, dan memastikan kualitas dari kode yang dihasilkan bersama AI.</p>
        `,
        status: "Selesai",
        code: "",
        cover: "https://picsum.photos/seed/vibe-coding/800/600",
        attachments: []
    }
];
