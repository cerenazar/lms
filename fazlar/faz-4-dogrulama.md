# Faz 4 — Uçtan uca doğrulama, commit, push

**Durum:** Tamamlandı
**Ön koşul:** Faz 1, 2 ve 3 Tamamlandı

## Amaç

Özelliğin gerçek veriyle çalıştığını kanıtlamak, test verisini temizlemek ve işi fork'a göndermek.

## Uçtan uca senaryo (çalışan API, curl)

Kurs `cmv6qcrcl0001yn5p5xozg9kq` (ogrenci@ bu kursa kayıtlı, egitmen@ bu kursa atanmış). Şifreler `sifre123`.

1. `egitmen@` olarak yayında 2 ödev oluştur: biri 1 gün sonra, biri 10 gün sonra teslim.
2. `egitmen@` olarak 3 gün sonra açılan yayında bir sınav ve 2 gün sonraya `lab` türünde bir takvim etkinliği oluştur.
3. `ogrenci@` olarak `GET /users/me/upcoming-tasks`:
   - 1 gün sonraki ödev, sınav ve lab görünmeli; 10 gün sonraki ödev görünmemeli.
   - Sıralama ödev → lab → sınav olmalı.
4. `ogrenci@` 1 gün sonraki ödevi teslim eder; tekrar GET → ödev listeden düşmeli.
5. `?days=14` → 10 gün sonraki ödev görünmeli.
6. **Temizlik:** oluşturulan ödevleri, sınavı ve etkinliği API ile sil. `uploads/` boş, yeni kayıt sayıları 0 olmalı, mevcut veri sayıları (User, Course, Lesson, Enrollment) başlangıçtakiyle aynı kalmalı.

## Son kontroller

```bash
cd server && npx tsc --noEmit && npm test
cd web && npm run typecheck && npm run build
```

## Commit ve push

- `srv.log`, `web.log` ve `web/tsconfig.app.tsbuildinfo` **commit'e alınmaz**.
- `fazlar/` klasörü commit'e alınır (planın kaydı).
- Mesaj: `feat: ana sayfada dinamik yaklaşan görevler (FR-12)`, sonuna Co-Authored-By satırı.
- `git fetch fork`, ardından `fork/master`'ın bu branch'in atası olduğunu doğrula. Sonra `git push -u fork feat/dinamik-gorevler`. `master`'a push ve force push **yapılmaz**.

## Bitince

Durumu **Tamamlandı** yap, README tablosunu güncelle. Kullanıcıya PR bağlantısını ver: `https://github.com/cerenazar/lms/pull/new/feat/dinamik-gorevler`. PR'ın hedefi `zcomert/lms:master`. Branch `feat/odev-sistemi`'nden türediği için, o PR merge edilmeden önce açılırsa önceki commit'ler de görünür; bunu kullanıcıya belirt. Zamanlanmış görev varsa sil: fazlar bitti.

## Koordinatör notu (2026-10-14)

- Uçtan uca senaryo (curl):
  - 7 günlük pencere: 1 gün sonraki ödev → lab → sınav sırası doğru, 10 gün sonraki ödev görünmedi.
  - Öğrenci 1 gün sonraki ödevi teslim edince ödev listeden düştü.
  - `?days=14` ile 10 gün sonraki ödev listeye girdi.
- Temizlik: test ödevleri, sınav ve etkinlik silindi. Sayılar başlangıçla aynı (User 7, Course 4, Lesson 159, Enrollment 7, Exam 2, CalendarEvent 11, Assignment 0); `uploads/` boş.
- Son kontroller: server tsc temiz, 431/431 test geçti; web typecheck ve build temiz.
