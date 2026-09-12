# Mimari

## Mimari hedefler

Mimari; en az yetki, botlar arası süreç yalıtımı, yerel-öncelikli çalışma, üç hedef platformda taşınabilirlik ve daha sonra eklenecek motorlara hazırlanmış dar bir genişleme sınırı üzerine kuruludur.

## Mantıksal bileşenler

```text
Yerel/LAN tarayıcı
        |
     HTTPS/UI
        |
Kontrol düzlemi (Node.js + TypeScript)
  |        |          |             |
React UI  SQLite   Güvenli kasa   Worker yöneticisi
                                      |
                         ayrı süreç: Mineflayer worker
                         ayrı süreç: Mineflayer worker
```

### Kontrol düzlemi

- İlk kurulum, panel oturumu, yapılandırma, varlık yönetimi ve yaşam döngüsünü yönetir.
- Panelin derlenmiş React içeriğini ve yerel API sınırını sunar.
- SQLite’a yalnızca gizli olmayan yapılandırma, durum ve kasa referansları yazar.
- Worker süreçlerini başlatır, izler ve kontrollü biçimde durdurur.

### Panel

- React + TypeScript kullanır.
- Varsayılan dili Türkçedir; görünür metinler kaynak koda gömülü sabitler yerine i18n anahtarlarından gelir.
- Açık/koyu tema ve mobil düzen ilk sürüm gereksinimidir.
- Teknik tanılama ayrıntılarını “Gelişmiş görünüm” altında tutar.
- HeadlessMC’yi ilk sürümde seçenek olarak göstermez.

### Veri katmanı

- SQLite, ilişkisel ürün verisinin tek yerel kaynağıdır.
- Şema sürümlenir ve ileri yönlü göçler atomik yürütülür.
- Token, parola veya script sırrının kendisi SQLite’a yazılmaz; yalnızca güvenli kasa kaydı için opak bir referans tutulabilir.
- Tek bir kontrol düzlemi yazarı tercih edilir; worker’lar veritabanına doğrudan yazmaz.

### Güvenli kasa katmanı

- Platforma uygun sır saklama uygulamalarını ortak bir arayüz arkasında toplar.
- `put`, `get`, `delete` ve erişilebilirlik denetimi gibi asgari işlemler sunar.
- Veritabanı, log, hata mesajı ve yedeklere sır değerini döndürmeyen opak tanıtıcılarla çalışır.
- Kasa kullanılamadığında sessizce düz metne düşmez; güvenli biçimde hata verir.

### Worker yöneticisi ve worker’lar

- Her çalışan bot için ayrı işletim sistemi süreci oluşturulur.
- Worker yalnızca kendisine verilen kısa ömürlü çalışma yapılandırmasına ve daraltılmış motor/script yeteneklerine erişir.
- Worker çökmesi kontrol düzleminden ve diğer botlardan yalıtılır.
- Worker yöneticisi yeniden bağlanma ile süreç yeniden başlatmayı ayrı durumlar olarak ele alır.
- Art arda hatalarda üstel gecikme, deneme sınırı ve kararlı hata durumu uygulanacaktır; kesin değerler açık karardır.

## Motor soyutlaması

Kontrol düzlemi doğrudan Mineflayer API’lerine bağlanmaz. Dar bir `BotEngine` sözleşmesi; başlatma, durdurma, durum/olay aktarımı ve izin verilmiş komutları kapsar. İlk ve tek uygulama Mineflayer’dır.

HeadlessMC için bu sınırın genişleyebilmesi korunur; HeadlessMC paketi, çalıştırma kodu, yapılandırması veya panel seçeneği ilk sürüme eklenmez.

## Script mimarisi

```text
.mwtsk metni <-> ayrıştırıcı/biçimleyici <-> ortak AST/model
                                             |
                                      statik doğrulama
                                             |
                                    onay + etkinleştirme
                                             |
                                 sınırlandırılmış yorumlayıcı
                                             |
                                  izinli bot yetenekleri
```

- Metin ve görsel editör aynı sürümlü AST/model sözleşmesini kullanır.
- Script motoru worker içinde çalışır; genel Node.js modül yükleme veya sistem API’si sunmaz.
- Dışarıdan gelen script, kaynak ve doğrulama özeti kaydedilse bile onay verilmeden etkin duruma geçemez.

## Ağ ve ilk kurulum durumları

1. **Kurulmamış:** Yalnızca loopback adresinde ilk kurulum uç noktası dinler.
2. **Yerel yönetici hazır:** Normal panel oturumu kullanılabilir; LAN hâlâ varsayılan olarak kapalıdır.
3. **LAN etkin:** Açık yönetici seçimiyle seçilen yerel arayüzlerde HTTPS dinlenir.

Kontrol düzlemi UPnP, NAT-PMP, yönlendirici yönetimi veya bulut tüneliyle dış port açmaz. Özel domain desteği ilk sürüm dışındadır.

## Servis ve başlangıç modeli

- Uygulama işletim sisteminin servis yöneticisine kaydedilen, ayrı ve düşük yetkili bir kullanıcı altında çalışacak biçimde paketlenir.
- Bot profillerinin cihaz başlangıcında çalışması kullanıcı tercihi ve profil ayarıdır; tüm botlar kendiliğinden etkinleştirilmez.
- Servis kullanıcısına etkileşimli oturum, yönetici/root veya gereksiz cihaz erişimi verilmez.

## Log ve yedekleme

- Yapılandırılmış loglar sır temizleme katmanından geçer.
- Varsayılan saklama sınırı 14 gün veya 250 MB’tır; hangisi önce aşılırsa en eski kayıtlar temizlenir.
- Kullanıcı verisi yedeği ilişkisel veriyi ve uygun kullanıcı dosyalarını içerebilir fakat token, parola ve script sırrı içermez.

## Açık kararlar

Kullanılacak HTTP çatısı, süreçler arası iletişim biçimi, sertifika deneyimi, platform kasa uygulamaları, paketleme ve kesin kurtarma eşikleri `docs/DECISIONS.md` içinde açık karar olarak izlenir.
