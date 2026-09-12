# MWT Script (`.mwtsk`) taslak belirtimi

## Durum ve amaç

Bu belge ilk sürüm dili için güvenlik ve uyumluluk sınırlarını tanımlar. Olay ve eylem kataloğu henüz kesinleşmediği için örneklerdeki adlar bağlayıcı API taahhüdü değildir.

MWT Script; Spigot Skript’ten esinlenen, girintiyle blok oluşturan ve doğal İngilizce okunan bir DSL’dir. Dil anahtar kelimeleri yalnızca İngilizcedir. Wiki, hata açıklamaları ve panel çevrilebilir.

## Dosya ve metin kuralları

- Uzantı `.mwtsk` olur.
- Metin UTF-8’dir ve satır sonları ayrıştırma sırasında normalize edilir.
- Girinti yalnızca boşluklarla yapılır; önerilen genişlik 2 boşluktur. Tab karakteri doğrulama hatasıdır.
- Aynı blokta girinti genişliği tutarlı olmalıdır.
- Boş satırlar anlam taşımaz.
- `#` işaretinden satır sonuna kadar yorumdur; string içindeki `#` yorum başlatmaz.
- Anahtar kelimeler İngilizce ve küçük harftir. Tanımlayıcıların büyük/küçük harf duyarlılığı kesinleştirilmemiştir.

## Kaynak ile ortak model

`.mwtsk` metni sürümlü bir AST’ye ayrıştırılır. Metin editörü ve görsel editör aynı AST şemasını kullanır:

- Metin → parse → AST → validate
- AST → format → `.mwtsk`
- Görsel düzenleme → aynı AST → format → `.mwtsk`

Biçimleyici anlamsal olarak eşdeğer, kararlı çıktı üretmelidir. Bilinmeyen veya daha yeni AST düğümleri sessizce atılmaz.

## Önerilen çekirdek biçim

Aşağıdaki örnek söz dizimi yönünü gösterir; olay/eylem adları katalog kararı verilene kadar taslaktır:

```text
# Example only; event and action names are provisional.
on bot joined:
  wait 2 seconds
  send chat "Hello from MWT-MClient"

on chat received:
  if message equals "ping":
    send chat "pong"
```

Çekirdek yapı kategorileri:

- `on <event>:` ile olay işleyici
- `if <condition>:` ve isteğe bağlı `else:` ile koşul
- İzin verilen, isimlendirilmiş host eylemleri
- Sınırlandırılmış bekleme/zamanlama ifadesi
- Yerel değişkenler ve temel değerler

Döngüler, kullanıcı tanımlı fonksiyonlar, modüller ve eşzamanlılık ilk sürüm için henüz kabul edilmiş özellikler değildir.

## Değerler ve ifadeler

Hedeflenen temel değer sınıfları string, number, boolean, duration ve null-benzeri “değer yok” durumudur. Kesin sözcüksel gösterim, dönüşüm kuralları ve işlemci listesi açık karardır.

String kaçışları ve kullanıcı girdisi bir komut/eylem bağlamına yerleştirilmeden önce türlenmiş API üzerinden aktarılır; metin birleştirme işletim sistemi veya Node.js kodu üretemez.

## Host yetenekleri

Script yalnızca yorumlayıcının izin listesine aldığı, türlenmiş bot yeteneklerini çağırabilir. Her yetenek:

- kararlı bir ad ve sürüme,
- doğrulanmış girdi/çıktı şemasına,
- etki sınıfına,
- hız ve kaynak sınırına

sahip olur.

İlk sürümde aşağıdakiler kesin olarak yoktur:

- dosya sistemi okuma/yazma,
- işletim sistemi veya kabuk komutu çalıştırma,
- süreç oluşturma,
- ortam değişkeni ya da Node.js modül erişimi,
- `eval` veya dinamik kod çalıştırma,
- ham soketler veya sınırsız HTTP/ağ erişimi.

Gizli değerler kaynak metne yazılmaz. Bir script sırrı gerekiyorsa isimlendirilmiş bir güvenli kasa referansı, yalnızca yetkili host eylemi çağrısı sırasında ve değeri scripte geri döndürmeden çözülür.

## Doğrulama ve onay yaşam döngüsü

Bir script şu durumlardan geçer:

1. **Taslak:** Henüz doğrulanmamış kaynak.
2. **Geçerli/Geçersiz:** Parse ve statik doğrulama sonucu.
3. **Onay bekliyor:** Özellikle içe aktarılan, geçerli fakat çalıştırma onayı olmayan içerik.
4. **Onaylı:** Kullanıcı, içerik özetiyle bağlı yetenek/etki özetini onaylamıştır.
5. **Etkin:** Bir bot profiline bağlanmış ve çalışmasına izin verilmiştir.

İçe aktarılan script, geçerli olsa bile onaysız çalışmaz. Kaynak veya AST değişirse içerik özeti değişir ve onay geçersizleşir. Doğrulayıcı uyarıları ile engelleyici hatalar panelde ayrılır.

## Çalışma zamanı güvenliği

- Yorumlayıcı worker sürecinin içinde ve genel JavaScript yürütmeden ayrı çalışır.
- Her olay işleyicisi adım, süre, bellek, kuyruk ve eylem hızı kotalarına tabidir.
- Kota aşımı ilgili çalıştırmayı kontrollü hata durumuna geçirir; kontrol düzlemini veya diğer worker’ları düşürmez.
- Olay girdileri güvenilmez kabul edilir, boyut/tür bakımından doğrulanır.
- Hatalar kaynak konumu verir fakat sır değerlerini veya hassas oturum verisini içermez.
- Aynı girdi ve aynı izinli durum için dil davranışı mümkün olduğunca belirlenimlidir.

## Sürümleme ve uyumluluk

Dil ve AST ayrı sürüm bilgileri taşır. Desteklenmeyen daha yeni bir sürüm çalıştırılmaz; anlaşılır hata üretilir. Göç, kayıplı dönüşüm yapacaksa otomatik uygulanmaz ve kullanıcı onayı ister.

## Açık kararlar

Tam gramer, olay/eylem kataloğu, tip ve dönüşüm kuralları, hata modeli, yorumlayıcı kotası, scriptler arası etkileşim ve görsel editörün ilk kullanılabilir kapsamı `docs/DECISIONS.md` içinde izlenir.
