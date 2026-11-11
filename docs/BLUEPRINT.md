# BLUEPRINT — DIAMONDAGENT

Spek terkunci (keputusan user, 11 Nov 2026):

| Item | Nilai |
|---|---|
| Nama koleksi | DIAMONDAGENT |
| Standar | ERC-721, BNB Chain (BSC) |
| Supply NFT | 2.222 |
| Tema | PFP pengibar bendera emblem diamond — ilustrasi AI di-pixelate ke pixel art gede (grid 64) — keputusan user 11 Nov 00:40 WIB |
| Token | $DAG (ERC-20, BSC) |
| Model rilis | Free mint agent-gated → claim token berfee → LP (opsional) |

Referensi gaya: Dashers (generative pixel flag-bearer) + word-art mosaic istilah crypto (untuk tier Legendary). Sampel konsep ada di `~/workspace/projects/flag-project/samples/`.

---

## 1. Konsep & Identitas

- Karakter agen pengibar bendera hijau dengan emblem diamond hitam — identitas visual utama, konsisten di semua token.
- Target minter: komunitas Binance Agent ID (registry `0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F`), segmen yang sudah terbukti farming free mint model begini (MIZUKAIRO, PAO, dll).
- Pembeda dari kloningan template: art layer digambar khusus (bukan template DannyNFT generik), kontrak diverifikasi Sourcify sejak hari pertama, ada `llms.txt`/`skill.md` resmi supaya agen lain bisa ikut mint.

## 2. Struktur Trait (Layer Art)

Urutan layer bawah → atas. Kanvas 1024×1024, digambar di grid pixel 128×128 lalu di-upscale nearest-neighbor supaya pixel tegas.

| Layer | Jumlah varian | Contoh |
|---|---|---|
| Background | 12 | stadion, sirkuit malam, pelabuhan, kota neon, gurun, luar angkasa, hutan, pantai, pegunungan, reruntuhan, senja, tribun warna-warni |
| Spesies | 8 | manusia, zombie, astronot, robot, banteng, kucing, alien, tengkorak |
| Outfit | 14 | racing suit, jubah raja, armor emas, jersey hijau, jas putih, dll |
| Headgear | 12 | mahkota, helm astronot, topi racer, tanduk emas, ikat kepala, none, dll |
| Mata / ekspresi | 6 | normal, berkedip, mata emas, visor, dll |
| Bendera | 5 | hijau diamond (default), hijau checker, hitam diamond, emas diamond (langka), pelangi (super langka) |

Total kombinasi mentah: 12 × 8 × 14 × 12 × 6 × 5 ≈ 483.840 — jauh di atas supply 2.222, jadi keunikan bukan masalah.

**Tier rarity** (diatur lewat bobot acak di script generator):

| Tier | Porsi | Jumlah (±) | Penanda |
|---|---|---|---|
| Common | 55% | 1.222 | trait umum |
| Rare | 27% | 600 | 1–2 trait langka |
| Epic | 12% | 267 | bendera hitam / trait epic |
| Legendary | 5% | 111 | bendera emas |
| Mythic | 1% | 22 | **word-art mosaic** (gambar dibentuk dari kata istilah crypto), 1/1 style |

Generator: script Python (PIL) — weighted random per layer, tolak kombinasi duplikat, hitung rarity score, hasilkan 2.222 PNG + 2.222 metadata JSON (nama, atribut, tier).

## 3. Tokenomics $DAG

| Item | Nilai usulan |
|---|---|
| Total supply | 222.200.000 DAG (18 desimal, fixed, mint sekali) |
| Holder claim | 40% = 88.880.000 → **40.000 DAG per NFT**, 1x per token ID |
| Liquidity (LP) | 20% = 44.440.000 (dibuka belakangan, butuh modal BNB terpisah) |
| Treasury/dev | 20% = 44.440.000 (wallet terpisah dari wallet mint harian) |
| Komunitas & marketing | 20% = 44.440.000 (airdrop, giveaway, kolaborasi) |
| Fee claim | **0,00015 BNB per NFT** (sedikit di bawah MIZU 0,00016 biar kompetitif) |

Potensi fee claim bila semua 2.222 NFT diklaim: ±0,3333 BNB. Fee masuk wallet treasury, bukan ngendap di kontrak.

Catatan: jangan pernah menjanjikan nilai/harga $DAG ke publik. Token didistribusikan sebagai token komunitas; LP adalah keputusan dan modal terpisah.

## 4. Kontrak yang Dibangun

1. **DiamondAgent.sol** (ERC-721)
   - `maxSupply = 2222`, mint gratis (`mint(uint256)` value 0)
   - Gate Agent ID: `balanceOf(msg.sender) > 0` di registry Agent ID
   - Maks **2 per wallet** (usulan — biar distribusi merata tapi tetap bisa koleksi)
   - `baseURI` bisa diset owner sebelum reveal; fungsi `reveal()` sekali jalan
   - Jendela mint bisa dibuka/ditutup owner (`mintOpen`)
2. **DAGToken.sol** (ERC-20)
   - Fixed supply 222.200.000, dicetak sekali saat deploy ke alamat distribusi
   - Tanpa fungsi mint tambahan; ownership bisa di-renounce setelah distribusi
3. **DAGClaim.sol**
   - `claim(uint256[] tokenIds)` payable — cek owner NFT, cek belum pernah klaim per token ID, kirim 40.000 DAG × jumlah NFT, fee 0,00015 BNB × jumlah NFT diteruskan ke treasury
   - Pola sama seperti kontrak claim MIZU yang sudah terbukti jalan

Semua kontrak: ditulis dari nol (bukan template generik), unit test lokal, deploy **testnet dulu**, dan diverifikasi di Sourcify saat mainnet — standar yang sama seperti Gate 1 yang selama ini dipakai buat menilai proyek orang.

## 5. Pipeline Art — METODE FINAL (keputusan user 11 Nov 2026, 00:39–00:40 WIB)

Jalur pixel programmatic (layer digambar kode) DITOLAK user dua kali ("jelek amat", "masih jelek") — MATI, jangan dihidupkan lagi. Metode produksi resmi:

1. **Assignment dulu**: `art/build_assignments.py` menghasilkan 2.222 baris trait + tier + prompt deterministik (`art/production/assignments.json`, seed 22221111, kuota tier persis: Common 1.222 / Rare 600 / Epic 267 / Legendary 111 / Mythic 22, semua kombinasi unik). Bendera = penanda tier (Legendary emas, Epic hitam/pelangi, Rare checker).
2. **Generate pixel-art AI (STYLE FINAL v3 — keputusan user 11 Nov 00:43–00:45 WIB)**: master prompt pixel-art chibi (kepala gede, warna flat, outline gelap, pixel chunky) + **background scene pixel yang rame** (pilihan user: "campur gaya ini + background rame"). Referensi gaya: gambar chibi kostum katak yang dikirim user 00:43 WIB. **TANPA langkah pixelate** — snap/downscale terbukti merusak gaya ini; hasil AI langsung jadi produk.
3. **QA per gambar** — tolak & generate ulang bila: emblem hilang/bukan diamond, warna bendera salah, spesies meleset, ada teks/watermark, ada karakter kedua. Hasil non-persegi (kadang 3:2) → center-crop ke persegi (karakter selalu di tengah). Master prompt kini diawali "Square 1:1 image." untuk menekan output landscape.
4. Simpan final sebagai `token_<id>.png` + metadata JSON per token (nama, atribut trait, tier).
5. Upload gambar + metadata ke IPFS (Pinata/nft.storage); `baseURI = ipfs://<CID>/`.
6. 22 Mythic word-art: prompt template mosaik kata crypto tersendiri (di assignments.json).

Produksi berjalan per batch (generate → QA → crop → simpan). Token #1–4 SUDAH dibuat ulang gaya v3 dan LOLOS QA (sheet: `art/production/sheet_v3_first4.png`). Token #5–8 versi lama (ilustrasi + pixelate grid 32) TIDAK dipakai — antre buat ulang gaya v3.

## 6. Website

- 3 halaman statis pola mizukairo.xyz: landing, mint, claim (HTML + ethers.js)
- Hosting Cloudflare Pages (gratis); domain `diamondagent.xyz` opsional (±$10/thn) atau subdomain gratis dulu
- `llms.txt` + `skill.md` di situs resmi: panduan mint untuk agen — kanal distribusi utama di ekosistem Agent ID
- Daftarkan ke NFTCalendar + The Colony sebelum jendela mint dibuka

## 7. Estimasi Biaya

| Item | Estimasi |
|---|---|
| Deploy 3 kontrak BSC mainnet | total < 0,005 BNB (tergantung gas saat deploy) |
| Testnet | gratis (faucet tBNB) |
| IPFS pinning | gratis (tier awal) |
| Hosting web | gratis |
| Domain (opsional) | ±$10/thn |
| LP $DAG (opsional, belakangan) | modal BNB terpisah, keputusan sendiri |

Saldo BNB user saat blueprint dibuat: 0,000649 — perlu top-up ±0,01 BNB sebelum tahap deploy mainnet.

## 8. Urutan Bangun

1. ✅ Blueprint disetujui
2. Kontrak ditulis + unit test + deploy **BSC testnet**, mint test end-to-end
3. Produksi layer art + generator 2.222 + metadata
4. Upload IPFS, set baseURI, uji reveal di testnet
5. Website mint/claim (testnet dulu)
6. Review keamanan mandiri (cek fungsi owner, jalur fee, batas supply)
7. Deploy mainnet + verifikasi Sourcify + umumkan jadwal mint di X
8. Mint dibuka (free, agent-gated)
9. Setelah mint jalan: deploy $DAG + buka claim
10. Opsional: LP PancakeSwap + listing marketplace

## 9. Risiko & Catatan Jujur

- **Distribusi adalah tantangan utama**, bukan teknis. Tanpa dorongan komunitas (X, NFTCalendar, The Colony, grup agen), mint bisa sepi — pola proyek kismin yang gagal selalu di sini.
- Fee claim + treasury transparan diumumkan sejak awal (besaran fee tertulis di situs), jangan diubah diam-diam.
- Kunci owner kontrak = tanggung jawab penuh; gunakan wallet yang seed-nya disimpan aman.
- Jangan pakai art Dashers secara langsung — gaya boleh terinspirasi, aset harus original (layer sendiri) supaya tidak jadi masalah IP.

## 10. Keputusan User (DISETUJUI 11 Nov 2026, ±00:22 WIB)

1. Maks mint per wallet: **2** ✅
2. Fee claim: **0,00015 BNB per NFT** ✅
3. Jatah claim: **40.000 DAG per NFT** ✅
4. Domain: **subdomain gratis dulu** (Cloudflare Pages `*.pages.dev`) ✅
