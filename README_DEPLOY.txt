Reverious AI - Video Vision Fixed

Ganti script.js lama dengan script.js dari folder ini.
Fitur video:
- Pilih video dari tombol Kirim Video.
- Video ditahan sebagai attachment, tidak langsung dikirim ke AI.
- Ketik pertanyaan lalu tekan Kirim.
- Browser mengambil 8 frame dari awal sampai akhir video.
- Frame dikompres menjadi JPEG lalu dianalisis oleh Vision Auto-Fallback.
- OpenRouter dicoba lebih dulu, lalu Groq Vision sebagai fallback.

Catatan: versi ini menganalisis isi visual berdasarkan frame sampel. Audio/video penuh tidak dikirim langsung ke model.
