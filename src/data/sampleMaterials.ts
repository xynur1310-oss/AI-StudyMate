export interface SampleMaterial {
  id: string;
  title: string;
  subject: string;
  description: string;
  badge: string;
  content: string;
}

export const SAMPLE_MATERIALS: SampleMaterial[] = [
  {
    id: 'sample-dijkstra',
    title: 'Graph & Algoritma Lintasan Terpendek Dijkstra',
    subject: 'Struktur Data & Algoritma',
    badge: 'Informatika & Sains Komputer',
    description: 'Materi lengkap graf berbobot, representasi adjacency list/matrix, dan algoritma Dijkstra greedy.',
    content: `# STRUKTUR DATA & ALGORITMA: GRAPH DAN ALGORITMA DIJKSTRA

## BAB 1: Definisi dan Representasi Graf
Graf G didefinisikan sebagai pasangan terurut G = (V, E), di mana V adalah himpunan simpul (vertex atau node) dan E adalah himpunan sisi (edge) yang menghubungkan pasangan simpul.
- Graf Berarah (Directed Graph / Digraph): Sisi memiliki arah tertentu dari simpul asal ke simpul tujuan (u -> v).
- Graf Tak Berarah (Undirected Graph): Sisi tidak memiliki orientasi arah, hubungan bersifat simetris.
- Graf Berbobot (Weighted Graph): Setiap sisi memiliki nilai numerik (bobot/weight) yang merepresentasikan jarak, biaya, atau waktu tempuh.

Representasi Graf dalam Memori Komputer:
1. Adjacency Matrix (Matriks Ketetanggaan):
   - Matriks 2 dimensi berukuran |V| x |V|.
   - Kelebihan: Pengecekan hubungan antara simpul u dan v sangat cepat O(1).
   - Kekurangan: Membutuhkan memori O(|V|^2), sangat boros untuk graf jarang (sparse graph).
2. Adjacency List (Daftar Ketetanggaan):
   - Array atau linked list di mana setiap simpul menyimpan daftar tetangga langsungnya beserta bobot sisi.
   - Efisiensi ruang O(|V| + |E|), sangat ideal untuk sparse graph.

## BAB 2: Konsep Lintasan Terpendek (Shortest Path)
Masalah Single-Source Shortest Path (SSSP) mencari lintasan dengan total bobot sisi minimum dari satu simpul awal s ke seluruh simpul lain dalam graf.
Syarat penting:
- Total bobot lintasan P = (v0, v1, ..., vk) dihitung dari penjumlahan bobot seluruh sisi w(vi-1, vi).
- Algoritma Dijkstra mensyaratkan semua bobot sisi bernilai non-negatif (w(u, v) >= 0). Jika ada bobot sisi negatif, algoritma Dijkstra dapat menghasilkan solusi salah (harus menggunakan Bellman-Ford).

## BAB 3: Algoritma Dijkstra dan Implementasi Priority Queue
Algoritma Dijkstra menggunakan pendekatan Greedy:
1. Inisialisasi:
   - Jarak awal dist[s] = 0, sedangkan untuk semua simpul v lainnya dist[v] = infinity.
   - Buat himpunan simpul yang sudah dikunjungi (visited) atau gunakan Min-Priority Queue.
2. Langkah Berulang:
   - Pilih simpul u dengan nilai dist[u] terkecil yang belum dikunjungi.
   - Tandai simpul u sebagai visited.
   - Lakukan Relaksasi (Relaxation) untuk setiap tetangga v dari u:
     Jika dist[u] + w(u, v) < dist[v], maka perbarui dist[v] = dist[u] + w(u, v) dan set parent[v] = u.
3. Berhenti ketika seluruh simpul telah dikunjungi atau simpul tujuan telah diproses.

Kompleksitas Waktu:
- Menggunakan Array linier: O(|V|^2).
- Menggunakan Binary Heap (Priority Queue): O((|V| + |E|) log |V|).
- Menggunakan Fibonacci Heap: O(|E| + |V| log |V|).

## BAB 4: Poin Penting untuk Ujian & Jebakan Konsep
1. Mengapa Dijkstra gagal pada sisi berbobot negatif? Karena sifat greedy mengasumsikan bahwa begitu simpul ditandai visited, jarak minimumnya telah final. Sisi negatif dapat memperkecil jarak setelah simpul ditandai visited.
2. Relaksasi adalah inti dari pencarian lintasan terpendek.
3. Rekonstruksi lintasan dilakukan dengan menelusuri array parent dari simpul tujuan kembali ke simpul awal.`
  },
  {
    id: 'sample-os-deadlock',
    title: 'Sistem Operasi: Proses, Konkurensi & Deadlock',
    subject: 'Sistem Operasi Komputer',
    badge: 'Teknologi Informasi',
    description: 'Konsep state proses, critical section, mutex/semaphore, 4 kondisi Coffman, dan Algoritma Banker.',
    content: `# SISTEM OPERASI: KONKURENSI, SYNCHRONIZATION, DAN DEADLOCK

## BAB 1: Konsep Proses dan Thread
Proses adalah program yang sedang dieksekusi di memori utama. Proses memiliki status (state) yang berganti selama siklus hidupnya:
- New: Proses sedang dibuat.
- Ready: Proses siap dieksekusi di CPU, menunggu penjadwalan.
- Running: Instruksi sedang dijalankan oleh prosesor.
- Waiting/Blocked: Proses menunggu event I/O atau resource lain.
- Terminated: Proses selesai dieksekusi.

Process Control Block (PCB) menyimpan informasi penting seperti Program Counter (PC), Process ID (PID), register CPU, dan alokasi memori.

## BAB 2: Critical Section dan Sinkronisasi
Ketika beberapa proses atau thread mengakses memori bersama (shared memory) secara bersamaan, dapat terjadi Kondisi Balapan (Race Condition).
Critical Section adalah bagian kode yang mengakses sumber daya bersama. Solusi Critical Section harus memenuhi 3 syarat mutlak:
1. Mutual Exclusion: Jika satu proses sedang berada di critical section, tidak ada proses lain yang boleh masuk.
2. Progress: Jika tidak ada proses di critical section dan ada proses yang ingin masuk, hanya proses yang tidak di remainder section yang dapat menentukan siapa yang masuk berikutnya.
3. Bounded Waiting: Harus ada batas waktu berapa kali proses lain diizinkan masuk sebelum permintaan suatu proses dipenuhi (mencegah starvation).

Mekanisme Sinkronisasi:
- Mutex Lock: Mekanisme penguncian biner (lock/unlock) berbasis kepemilikan.
- Semaphore: Variabel integer yang hanya dapat diakses melalui operasi atomik wait() (atau P) dan signal() (atau V).
  - Counting Semaphore: Mengontrol akses ke resource dengan banyak instance.
  - Binary Semaphore: Bernilai 0 atau 1 (mirip mutex).

## BAB 3: Masalah Deadlock dan 4 Kondisi Coffman
Deadlock adalah kondisi di mana sekelompok proses saling menunggu sumber daya yang sedang ditahan oleh proses lain dalam kelompok tersebut, sehingga tidak ada yang dapat melanjutkan eksekusi.

Deadlock hanya dapat terjadi jika KEEMPAT kondisi Coffman terpenuhi secara simultan:
1. Mutual Exclusion: Sumber daya tidak dapat digunakan bersama (non-shareable).
2. Hold and Wait: Suatu proses sedang memegang setidaknya satu sumber daya sambil menunggu sumber daya tambahan yang sedang dipegang proses lain.
3. No Preemption: Sumber daya tidak dapat direbut paksa; hanya dapat dilepaskan secara sukarela oleh proses pemegangnya.
4. Circular Wait: Terdapat rantai proses {P0, P1, ..., Pn} sedemikian hingga P0 menunggu resource P1, P1 menunggu P2, dan Pn menunggu P0.

## BAB 4: Strategi Penanganan Deadlock
1. Deadlock Prevention: Mencegah terjadinya minimal satu dari 4 kondisi Coffman.
2. Deadlock Avoidance: Sistem mengevaluasi status dinamis alokasi sebelum menyetujui permintaan. Menggunakan Algoritma Banker (Safe State vs Unsafe State).
3. Deadlock Detection and Recovery: Membiarkan deadlock terjadi, lalu mendeteksi dengan graf alokasi sumber daya dan memulihkannya (misalnya membunuh proses atau preemption resource).
4. Ostrich Algorithm: Mengabaikan masalah seolah tidak pernah terjadi (digunakan pada OS umum karena efisiensi performa).`
  },
  {
    id: 'sample-economics',
    title: 'Mikroekonomi: Elastisitas & Keseimbangan Pasar',
    subject: 'Pengantar Ilmu Ekonomi',
    badge: 'Ekonomi & Bisnis',
    description: 'Hukum permintaan & penawaran, elastisitas harga, pergeseran kurva, dan intervensi pajak/subsidi.',
    content: `# PENGANTAR MIKROEKONOMI: MEKANISME PASAR DAN ELASTISITAS

## BAB 1: Hukum Permintaan dan Penawaran
1. Hukum Permintaan (Law of Demand):
   - Jika harga suatu barang naik, maka jumlah barang yang diminta akan turun, ceteris paribus (faktor lain konstan).
   - Kurva permintaan memiliki kemiringan negatif (downward sloping).
   - Faktor penggeser kurva permintaan: pendapatan konsumen, harga barang substitusi dan komplementer, selera, ekspektasi masa depan, dan jumlah penduduk.
2. Hukum Penawaran (Law of Supply):
   - Jika harga suatu barang naik, maka jumlah barang yang ditawarkan produsen akan meningkat, ceteris paribus.
   - Kurva penawaran memiliki kemiringan positif (upward sloping).
   - Faktor penggeser kurva penawaran: biaya produksi, teknologi, harga input, kebijakan pajak produsen.

## BAB 2: Keseimbangan Pasar (Market Equilibrium)
Keseimbangan pasar tercapai saat kuantitas yang diminta sama dengan kuantitas yang ditawarkan: Qd = Qs pada tingkat harga keseimbangan (Pe) dan kuantitas keseimbangan (Qe).
- Kelebihan Penawaran (Surplus): Terjadi ketika harga pasar di atas harga keseimbangan (P > Pe). Produsen akan menurunkan harga.
- Kelebihan Permintaan (Shortage): Terjadi ketika harga pasar di bawah harga keseimbangan (P < Pe). Terjadi perebutan barang dan harga akan terdorong naik.

## BAB 3: Konsep Elastisitas Harga Permintaan (Price Elasticity of Demand)
Elastisitas mengukur derajat kepekaan perubahan jumlah barang yang diminta terhadap perubahan harga.
Rumus: Ed = (% Perubahan Qd) / (% Perubahan P) = (Delta Q / Delta P) * (P / Q)

Kategori Nilai Elastisitas:
1. Elastis (|Ed| > 1): Perubahan harga kecil menyebabkan perubahan jumlah yang besar. Contoh: barang mewah.
2. Inelastis (|Ed| < 1): Perubahan harga tidak banyak memengaruhi jumlah yang diminta. Contoh: barang pokok, obat-obatan esensial.
3. Elastis Uniter (|Ed| = 1): Persentase perubahan harga sama persis dengan persentase perubahan kuantitas.
4. Elastis Sempurna (|Ed| = tak hingga): Kurva horizontal.
5. Inelastis Sempurna (|Ed| = 0): Kurva vertikal tegak lurus.

Hubungan dengan Total Revenue (TR = P x Q):
- Pada barang elastis: Menaikkan harga akan menurunkan Total Revenue.
- Pada barang inelastis: Menaikkan harga akan menaikkan Total Revenue.`
  }
];
