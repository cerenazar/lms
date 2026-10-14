# Dinamik "Yaklaşan Görevler" — Faz Planı

**Hedef:** Ana sayfadaki (`/`) "Yaklaşan Görevler" paneli bugün `web/src/data/dashboard.fixtures.ts` içindeki 3 sabit kayıttan besleniyor. Panel, öğrencinin gerçek ödev, sınav ve takvim son tarihlerini gösterecek (FR-12: teslim tarihi yaklaşan ödev ve sınavlar, varsayılan 7 gün, tarih sırasıyla).

**Branch:** `feat/dinamik-gorevler`, `feat/odev-sistemi`'nden açılır (ödev tabloları o branch'te).

## Fazlar

Fazlar 5 dakikada bir tetiklenen zamanlanmış bir görevle yürür. Her tetiklemede:

1. Tabloda **Devam ediyor** olan bir faz varsa yeni iş başlatılmaz; o fazın ajanı bitmişse sonucu doğrulanır.
2. Yoksa **Bekliyor** olan ilk faz **Devam ediyor** yapılır ve uzman ajana verilir: Faz 1 → `backend-engineer`, Faz 2–3 → `frontend-engineer`, Faz 4 → koordinatör (ana oturum).
3. Ajan bitince koordinatör, fazın "Doğrulama" bölümündeki komutları kendisi çalıştırır. Geçerse **Tamamlandı**, geçmezse **Engellendi** yazılır; engellenen fazın sebebi faz dosyasına not edilir ve sonraki fazlara geçilmez.
4. Bütün fazlar Tamamlandı ya da biri Engellendi ise zamanlanmış görev silinir.

| Faz | Dosya | Konu | Durum |
|---|---|---|---|
| 1 | [faz-1-backend.md](faz-1-backend.md) | API sözleşmesi + `GET /users/me/upcoming-tasks` + testler | Tamamlandı |
| 2 | [faz-2-veri-katmani.md](faz-2-veri-katmani.md) | Web tipleri, `useUpcomingTasks` hook'u, görünüm eşleyici | Tamamlandı |
| 3 | [faz-3-arayuz.md](faz-3-arayuz.md) | `UpcomingTasks` paneli: gerçek veri, bağlantılar, boş/yükleniyor/hata durumları | Tamamlandı |
| 4 | [faz-4-dogrulama.md](faz-4-dogrulama.md) | Uçtan uca doğrulama, temizlik, commit + fork'a push | Tamamlandı |

## Değişmeyen kurallar (her faz için)

- `server/prisma/dev.db` asla silinmez veya resetlenmez. Bu iş için migration gerekmiyor; gerekirse durulur ve kullanıcıya sorulur.
- Dev sunucuları (API :4000, web :5173) çalışıyor. Yeni sunucu açılmaz.
- Bileşen CSS'inde ham renk değeri yazılmaz, yalnızca `tokens.css` token'ları kullanılır (CLAUDE.md).
- Hata formatı `{"error":{"code","message"}}`, mesajlar Türkçe.
- Her faz kendi doğrulamasını geçmeden **Tamamlandı** işaretlenmez.
- Commit yalnızca Faz 4'te yapılır; push yalnızca `fork` remote'una (`cerenazar/lms`), `master`'a değil.
