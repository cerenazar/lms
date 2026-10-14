# Faz 2 — Web veri katmanı

**Durum:** Tamamlandı
**Ön koşul:** Faz 1 Tamamlandı

## Amaç

API'den gelen görevleri çekip paneldeki mevcut `UpcomingTask` görünüm modeline çevirmek. Arayüz bileşenine bu fazda dokunulmaz.

## Yapılacaklar

1. **Tipler** (`web/src/types/index.ts`)
   - Faz 1 sözleşmesine birebir uyan `UpcomingTaskItem` (API tipi) ve `UpcomingTasksResponse` ekle.
   - Mevcut görünüm tipi `UpcomingTask`'ı genişlet:
     - `TaskKind`'e `'event'` ekle; `'lab'` takvim etkinliği türü olarak kalabilir.
     - `href: string` ekle (aksiyon bağlantısı).
     - `isOverdue?: boolean` ekle.
2. **Hook** (`web/src/features/dashboard/useUpcomingTasks.ts`)
   - `useAnnouncements.ts` desenini izle: `apiFetch`, `{ tasks, loading, error, reload }` durumu.
   - Hata mesajı: "Yaklaşan görevler yüklenemedi."
   - İsteği `?days=7` ile at.
3. **Eşleyici** (`web/src/features/dashboard/upcomingTaskMeta.ts`)
   - `toUpcomingTask(item, now)` saf fonksiyonu. `now` parametre olarak alınır, böylece sonuç belirleyici olur.

   | Durum | `tagLabel` | `tagTone` | `tagIcon` |
   |---|---|---|---|
   | `isOverdue` | Gecikti | `error` | `warning` |
   | ödev, kalan < 48 saat | Yüksek Öncelik | `error` | `priority_high` |
   | ödev | Ödev | `info` | `assignment` |
   | sınav, `OPEN` | Sınav Açık | `success` | `quiz` |
   | sınav, `UPCOMING` | Çevrim İçi Sınav | `brand` | `quiz` |
   | etkinlik `lab` | Laboratuvar | `cyan` | `science` |
   | etkinlik `exam` | Sınav | `brand` | `event` |
   | etkinlik `deadline` | Son Tarih | `warning` | `flag` |

   - `dueLabel` (Türkçe göreli süre):
     - Gecikmiş: "1 gün gecikti".
     - 1 saatten az: "45 dk kaldı".
     - 24 saatten az: "5 saat kaldı".
     - Bugün içinde: "Bugün 14:00".
     - Daha ileri: "2 gün kaldı".
     - Sınav `UPCOMING`: "Cuma 14:00" (gün adı + saat).
   - `metaLabel`: `dueAt`'in "27 Ekim 23:59" biçimi (`tr-TR`, `Europe/Istanbul`). `metaIcon`: `schedule`. Sınav süresi varsa `durationLabel`: "45 dakika".
   - `description`: API açıklaması yoksa kurs adı; ikisi de yoksa boş.
   - Aksiyon:

   | Tür | `actionLabel` | `href` |
   |---|---|---|
   | ödev | Teslim Et | `/kurslarim/:courseId/odevler/:sourceId` |
   | sınav | Detaylar | `/sinavlar` |
   | etkinlik | Takvimde Gör | `/takvim` |

   - Var olan `formatDateTime.ts` / `formatRelative` yardımcılarını incele, uygun olanı yeniden kullan; aynı işi yapan yeni bir yardımcı yazma.

## Doğrulama

```bash
cd web && npm run typecheck && npm run build
```

Web tarafında test çerçevesi yok (CLAUDE.md: "test framework TBD"). Yeni bağımlılık **eklenmez**. Eşleyiciyi doğrulamak için geçici bir script yaz (`npx tsx` ile scratchpad'de çalıştır, repoya ekleme). Script şu durumların hepsini kontrol etsin: geciken, 30 dk kalan, 5 saat kalan, 3 gün kalan, `UPCOMING` sınav, `lab` etkinliği. Çıktıyı faz notuna ekle.

## Bitince

Durumu **Tamamlandı** yap, altına not ekle ve `README.md` tablosunu güncelle.

## Uygulama notu

Dosyalar: `web/src/types/index.ts` (`UpcomingTaskItem`, `UpcomingTasksResponse`, `TaskKind` + `'event'`, `UpcomingTask.href` / `isOverdue?`), `web/src/features/dashboard/useUpcomingTasks.ts`, `web/src/features/dashboard/upcomingTaskMeta.ts`, `web/src/data/dashboard.fixtures.ts` (geçici `href` değerleri; Faz 3 kaldıracak).

Sapmalar:
- `formatDateTime` / `formatRelative` ("3 saat önce", "27 Ekim 2026 23:59") istenen biçimleri üretmediği için eşleyicide `Intl.DateTimeFormat` (`tr-TR`, `Europe/Istanbul`) kullanıldı.
- "Bugün 14:00" etiketi, "24 saatten az -> N saat kaldı" kuralıyla çeliştiği (ulaşılamaz) için üretilmiyor.
- Gecikme 24 saatten kısaysa "N saat/dk gecikti" yazılır; 1 gün ve üstü "N gün gecikti".
- Kursu olmayan ödevde `href` `/kurslarim`'a düşer.

Eşleyici çıktısı (`now` = 2026-10-21T10:00Z):
```
geciken        Gecikti / error / 1 gün gecikti / 20 Ekim 12:00 / Teslim Et /kurslarim/c1/odevler/a1
30 dk          Yüksek Öncelik / error / 30 dk kaldı / 21 Ekim 13:30 / Teslim Et /kurslarim/c1/odevler/a2
5 saat (OPEN)  Sınav Açık / success / 5 saat kaldı / 21 Ekim 18:00 / 45 dakika / Detaylar /sinavlar
3 gün          Ödev / info / 3 gün kaldı / 24 Ekim 13:00 / Teslim Et /kurslarim/c1/odevler/a3
UPCOMING sınav Çevrim İçi Sınav / brand / Cuma 14:00 / 23 Ekim 14:00 / 45 dakika / Detaylar /sinavlar
lab            Laboratuvar / cyan / 2 gün kaldı / 23 Ekim 13:00 / Takvimde Gör /takvim
```
`npm run typecheck` ve `npm run build` başarılı.

## Koordinatör doğrulaması (2026-10-14)

- `npm run typecheck` ve `npm run build` temiz.
- Eşleyici script'i 6 durumda beklenen etiket, kalan süre, tarih ve bağlantıyı üretti. 23 Ekim 2026'nın Cuma olduğu doğrulandı.
- Sapmalar kabul edildi. "Bugün HH:MM" kuralı şartnamedeki sıra yüzünden zaten ulaşılamazdı.
