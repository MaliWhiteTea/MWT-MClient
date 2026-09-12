# MWT Script (`.mwtsk`) taslak belirtimi

## Durum ve amaç

Bu belge ilk sürüm dili için güvenlik ve uyumluluk sınırlarını tanımlar. Olay ve eylem kataloğu henüz kesinleşmediği için örneklerdeki adlar bağlayıcı API taahhüdü değildir.

MWT Script; Spigot Skript’ten esinlenen, girintiyle blok oluşturan ve doğal İngilizce okunan bir DSL’dir. Dil anahtar kelimeleri yalnızca İngilizcedir. Wiki, hata açıklamaları ve panel çevrilebilir.

Spigot Skript bir tasarım esinidir; `.mwtsk` dosyalarının Spigot Skript tarafından çalıştırılacağı, mevcut Skript eklentileriyle uyumlu olduğu veya sözdizimi/davranışının birebir eşleştiği iddia edilmez. Uyumluluk katmanı ilk sürüm kapsamına dahil değildir.

## Dosya ve metin kuralları

- Uzantı `.mwtsk` olur.
- Metin UTF-8’dir ve satır sonları ayrıştırma sırasında normalize edilir.
- İlk yorum veya boş satır olmayan satır tam olarak `language <major>` biçimindedir; ilk sürüm `language 1` kullanır. Eksik veya desteklenmeyen major sürüm doğrulama hatasıdır.
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

İlk sürüm yalnız metin editörü sağlar. AST/formatter sözleşmesi ilk sürümde kararlılaştırılır; sonraki görsel editör desteklemediği düğümleri salt-okunur göstermeli ve kayıplı kaydetmeyi reddetmelidir.

## Önerilen çekirdek biçim

Aşağıdaki örnek söz dizimi yönünü gösterir; olay/eylem adları katalog kararı verilene kadar taslaktır:

```text
language 1

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

### Olay, kuyruk ve eylem sırası

- Worker her motor olayına artan bir `eventSequence` verir ve olayı etkin scriptlere bot profilindeki kararlı bağlama sırasıyla fan-out eder.
- Her script aynı anda en fazla bir handler çalıştırır ve kendi sınırlı FIFO kuyruğunu kullanır. Kuyruk doluyken gelen yeni olay çalıştırılmadan reddedilir; sır içermeyen, hız sınırlı uyarı üretilir.
- Scriptler ortak değiştirilebilir bellek paylaşmaz. Bir script hatası diğer scriptin kuyruğunu durdurmaz.
- Host eylemleri tek broker’da `(eventSequence, bindingOrder, actionSequence)` sırasıyla işlenir. Kullanıcının stop/durdurma eylemi önceliklidir ve bekleyen script eylemlerini iptal edebilir.
- Kesin FIFO derinliği, handler adım/süre/bellek limitleri ve eylem hızları en yavaş Raspberry Pi ARM64 hedefindeki ölçümlerden sonra sabitlenir.

## Sürümleme ve uyumluluk

Kaynak dosya major dil sürümünü, iç model ayrı tamsayı AST şema sürümünü taşır. Kırıcı sözdizimi veya anlam değişikliği `language` major’ını artırır. Aynı major içindeki eklemeler daha eski geçerli dosyaların anlamını değiştiremez.

Desteklenmeyen major sürüm çalıştırılmaz; anlaşılır hata üretilir. AST yalnız parser çıktısından üretilir ve metadata kaynak başlığını geçersiz kılamaz. Göç kayıplı dönüşüm yapacaksa otomatik kaydetmez, kullanıcı onayı ister ve içeriğe bağlı eski çalıştırma onayını geçersiz kılar.

## Açık kararlar

Tam gramerde tanımlayıcı duyarlılığı/tip/dönüşüm/hata ayrıntıları ile ilk tetikleyici-eylem kataloğu O-105’te; sayısal kotalar O-106’da açıktır. Sonraki görsel editörün kapsamı O-107’de ürün sahibi kararına bırakılmıştır.
