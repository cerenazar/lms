# Faz 3 — Arayüz entegrasyonu

**Durum:** Tamamlandı
**Ön koşul:** Faz 2 Tamamlandı

## Amaç

Ana sayfadaki "Yaklaşan Görevler" panelinin gerçek veriyi göstermesi, bağlantıların çalışması ve sabit verinin kaldırılması.

## Yapılacaklar

1. **`DashboardPage.tsx`**: `useUpcomingTasks()` çağır, `toUpcomingTask(item, new Date())` ile eşle, panele `tasks`, `loading`, `error`, `onRetry` geçir. Duyurular ve notlar zaten bu desenle bağlı; aynısını izle.
2. **`components/UpcomingTasks.tsx`**
   - `<a href="#">` yerine React Router `<Link to={task.href}>` kullan. Bağlantının erişilebilir adı görevin başlığını içersin, ör. `aria-label="Teslim Et: Hesap Makinesi Projesi"`.
   - Sağ üst rozet: "{n} Teslim" yerine "{n} Görev"; liste boşsa rozet gösterilmez.
   - **Yükleniyor:** 2–3 iskelet satır, `aria-busy="true"`. Hareket `prefers-reduced-motion`'a uyar.
   - **Boş:** "Önümüzdeki 7 günde yaklaşan görevin yok." ve `/notlar-ve-gorevler`'e "Tüm görevler" bağlantısı.
   - **Hata:** hata metni + "Tekrar dene" düğmesi (`Button variant="ghost"`).
   - Gecikmiş görevde öğe kenarlığı veya arka planı `--color-state-error` tonunda vurgulanır, yalnızca token kullanılır.
   - Panel altına "Tüm görevleri gör → /notlar-ve-gorevler" bağlantısı ekle.
3. **`UpcomingTasks.module.css`**: yeni durumların stilleri; ham hex/rgba yok, boşluklar `--space-*` token'ları.
4. **Sabit veriyi kaldır**: `dashboard.fixtures.ts`'den `upcomingTasks` alanını, `DashboardData` tipinden de bu alanı sil. Başka bir yerin kullanmadığını `grep -rn upcomingTasks web/src` ile doğrula.

## Doğrulama

```bash
cd web && npm run typecheck && npm run build
grep -rnE "#[0-9a-fA-F]{3,8}\b|rgba?\(" web/src/features/dashboard/components/UpcomingTasks.module.css   # boş çıkmalı
```

Vite dev sunucusu çalışıyor. `http://localhost:5173/` 200 dönmeli; tarayıcı konsolunda bu bileşenden kaynaklı hata olmamalı. Tarayıcı aracı yoksa bunu "elle doğrulanmadı" olarak not et.

## Bitince

Durumu **Tamamlandı** yap, altına not ekle ve `README.md` tablosunu güncelle.

## Uygulama notu

Dosyalar: `web/src/features/dashboard/components/UpcomingTasks.tsx` ve `.module.css` (yükleniyor/boş/hata durumları, `Link`, "{n} Görev" rozeti, gecikmiş vurgusu, "Tüm görevleri gör" bağlantısı), `web/src/features/dashboard/DashboardPage.tsx` (`useUpcomingTasks`), `web/src/data/dashboard.fixtures.ts` ve `web/src/types/index.ts` (`upcomingTasks` alanı kaldırıldı).

- `useUpcomingTasks` eşlemeyi (`toUpcomingTask`) zaten kendi içinde yaptığı için sayfa görünüm modelini doğrudan panele geçirir.
- `npm run typecheck` ve `npm run build` başarılı; CSS ham renk grep'i boş; `grep -rn upcomingTasks web/src` yalnızca bir yorum satırı döndürür; `http://localhost:5173/` 200.
- Tarayıcıda görsel/konsol kontrolü elle doğrulanmadı.

## Koordinatör doğrulaması (2026-10-14)

- `npm run typecheck` ve `npm run build` temiz. CSS'te ham renk yok, kullanılan bütün token'lar `styles/` altında tanımlı. `upcomingTasks` kullanımı kalmadı. `http://localhost:5173/` → 200.
- Düzeltme: prettier varsayılan ayarlarla çift tırnağa çevirmişti; dosya projenin stiline (tek tırnak, 120 sütun) geri alındı. Aynı değeri hesaplayan `showList` ve `showCount` tek değişkende birleştirildi.
- Tarayıcıda görsel kontrol yapılmadı.
