# Faz 1 — Backend: yaklaşan görevler endpoint'i

**Durum:** Tamamlandı

## Amaç

Öğrencinin önümüzdeki N gündeki görevlerini tek listede, tarih sırasıyla döndüren bir endpoint. Ön yüz farklı kaynakları birleştirmekle uğraşmaz.

## Hazırlık

- `feat/odev-sistemi` üzerindeysen: `git switch -c feat/dinamik-gorevler`. Branch zaten varsa ona geç.
- Mevcut desenler: `server/src/routes/exams.ts` (`GET /exams/my`, `examAvailability`), `server/src/routes/assignments.ts` (`GET /users/me/assignments`), `server/src/routes/calendar.ts`, `server/src/lib/courseAccess.ts`.

## Sözleşme (`server/CONTRACT.md`'ye ekle)

`GET /api/v1/users/me/upcoming-tasks?days=7`. Giriş gerektirir. `days` 1–30 arası tam sayıdır, varsayılanı 7; aralık dışındaysa 400 `VALIDATION_ERROR`.

```jsonc
{
  "tasks": [
    {
      "id": "assignment:<id>",          // kaynak:id, listede benzersiz
      "kind": "assignment",              // "assignment" | "exam" | "event"
      "sourceId": "<id>",
      "title": "Hesap Makinesi Projesi",
      "description": "…",                // kısa metin, en fazla 140 karakter, null olabilir
      "course": { "id": "…", "title": "…" },   // genel takvim etkinliğinde null
      "dueAt": "2026-10-21T20:59:00.000Z",     // sıralama ve geri sayım için tek tarih
      "state": "OPEN",                   // aşağıdaki tabloya bak
      "isOverdue": false,
      "durationMinutes": null,           // sınavlarda süre
      "eventType": null                  // event için: "exam" | "deadline" | "lab"
    }
  ],
  "windowDays": 7,
  "serverTime": "2026-10-14T08:00:00.000Z"
}
```

## Kaynaklar ve kurallar

Yalnızca kullanıcının **kayıtlı olduğu kurslar** dikkate alınır.

| Kaynak | Hangi kayıtlar listeye girer | `dueAt` | `state` |
|---|---|---|---|
| Ödev | `PUBLISHED`, kullanıcının teslimi yok, `dueAt ≤ şimdi + days`. Geç teslime izin olduğu için tarihi en fazla 7 gün önce geçmiş teslim edilmemiş ödevler de girer (`isOverdue: true`). | `Assignment.dueAt` | `NOT_SUBMITTED` |
| Sınav | `GET /exams/my` ile aynı görünürlük kuralı (audience/candidate). Durumu `OPEN` veya `UPCOMING` olan, ilgili tarihi pencere içinde ya da tarihi boş olan sınavlar. | `OPEN` → `endsAt`; `UPCOMING` → `startsAt`. İkisi de boşsa kayıt **listeye girmez**, çünkü sıralanamaz. | `OPEN` / `UPCOMING` |
| Takvim | `type ∈ {exam, deadline, lab}`, `courseId` kullanıcının kurslarından biri ya da `null` (genel), `şimdi ≤ start ≤ şimdi + days`. | `start` | `UPCOMING` |

- Sıralama `dueAt` artan. Geciken kayıtlar en üstte çıkar, bu istenen davranış.
- Liste en fazla 20 kayıt döner.
- Sınav tablosunda deneme (attempt) modeli yok, bu yüzden "çözülmüş sınav" ayıklanamaz. Bunu sözleşmeye bilinen sınır olarak not et.
- Aynı sınav hem `Exam` hem `CalendarEvent(type=exam)` olarak girilmiş olabilir. Bu fazda tekilleştirme yapılmaz, bilinen sınır olarak not edilir.
- E-posta veya başka kişisel veri dönmez.
- Mantığı route içinde şişirme: `server/src/lib/upcomingTasks.ts` içinde `collectUpcomingTasks(userId, now, days)` saf fonksiyonu yaz, route onu çağırsın. Test edilebilirlik için `now` dışarıdan verilir.

## Testler (`server/src/routes/upcomingTasks.test.ts`)

Mevcut test kurulum desenini (`assignments.test.ts`'deki `beforeEach` temizliği, `signToken`) izle.

- Girişsiz istek → 401.
- `days=0` ve `days=31` → 400.
- Kayıtsız olunan kursun ödevi, sınavı ve etkinliği görünmez.
- Taslak ödev ve taslak sınav görünmez.
- Teslim edilmiş ödev görünmez; teslim edilmemiş ve tarihi geçmiş ödev `isOverdue: true` ile görünür; 8 gün önce geçmiş ödev görünmez.
- Pencere dışındaki ödev görünmez (`days=7` iken 10 gün sonraki).
- `UPCOMING` sınavın `dueAt`'i `startsAt`, `OPEN` sınavınki `endsAt`; kapanmış sınav görünmez; tarihsiz sınav görünmez.
- `SELECTED` hedef kitleli sınav yalnızca aday olan öğrenciye görünür.
- Takvim: `lecture`/`holiday` görünmez; genel (`courseId: null`) `deadline` görünür.
- Sıralama `dueAt` artan; 25 kayıtta sonuç 20.

## Doğrulama (hepsi geçmeden faz bitmez)

```bash
cd server && npx tsc --noEmit && npm test
```

Çalışan API'de `ogrenci@btkakademi.test` / `sifre123` ile `GET /api/v1/users/me/upcoming-tasks` 200 dönmeli; boş liste kabul edilir.

## Bitince

Bu dosyada durumu **Tamamlandı** yap, altına kısa bir not ekle (eklenen dosyalar, test sayısı) ve `README.md` tablosunu güncelle.

## Uygulama notu

- Eklenen: `server/src/lib/upcomingTasks.ts` (`collectUpcomingTasks(userId, now, days)`), `server/src/routes/upcomingTasks.ts`, `server/src/routes/upcomingTasks.test.ts` (9 test). Değişen: `server/src/app.ts` (route kaydı), `server/CONTRACT.md` (yeni bölüm).
- `npx tsc --noEmit` temiz; `npm test`: 26 dosya, 431 test geçti.
- Bilinen sınırlar: çözülmüş sınav ayıklanamaz (attempt modeli yok); aynı sınav `Exam` ve `CalendarEvent(exam)` olarak girilmişse çift görünür; bitişi olmayan açık sınav sıralanamadığı için listeye girmez.

## Koordinatör doğrulaması (2026-10-14)

- `npx tsc --noEmit` temiz; `npm test` 26 dosya / 431 test geçti.
- Çalışan API (`ogrenci@`): 200, `windowDays` 7, 3 takvim kaydı tarih sırasıyla; `days=31` → 400; girişsiz → 401.
