# Mimari

## Mimari hedefler

Mimari; en az yetki, botlar arası süreç yalıtımı, yerel-öncelikli çalışma, üç hedef platformda taşınabilirlik ve daha sonra eklenecek motorlara hazırlanmış dar bir genişleme sınırı üzerine kuruludur.

## Mantıksal bileşenler

```text
Yerel/LAN tarayıcı
        |
loopback HTTP / LAN HTTPS
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
- Panelin derlenmiş React içeriğini, Fastify tabanlı `/api/v1` REST/JSON API’sini ve tek yönlü SSE durum/log akışını aynı origin’den sunar.
- İlk sürümde WebSocket kullanılmaz; durum değiştiren işlemler REST komutlarıdır.
- İstek, yanıt ve SSE olayları uygulamanın sahip olduğu sabit şemalarla doğrulanır; kullanıcı girdisi şema olarak derlenmez.
- SQLite’a yalnızca gizli olmayan yapılandırma, durum ve kasa referansları yazar.
- Worker süreçlerini başlatır, izler ve kontrollü biçimde durdurur.
- Yönetici parolasını asenkron scrypt ile, kaynak başına deneme hızı ve süreç-geneli tek pahalı iş sınırı altında doğrular. Tek yönetici ve oturum kayıtları veri katmanındaki dar repository sınırından yönetilir; ham oturum belirteci kalıcılaştırılmaz. Oturum doğrulama ve idle yenileme bölünemez tek repository işlemidir.

### Panel

- React + TypeScript kullanır.
- Varsayılan dili Türkçedir; görünür metinler kaynak koda gömülü sabitler yerine i18n anahtarlarından gelir.
- Açık/koyu tema ve mobil düzen ilk sürüm gereksinimidir.
- Teknik tanılama ayrıntılarını “Gelişmiş görünüm” altında tutar.
- HeadlessMC’yi ilk sürümde seçenek olarak göstermez.

### Veri katmanı

- SQLite, ilişkisel ürün verisinin tek yerel kaynağıdır.
- Kontrol servisi, ağ dinleyicisi açılmadan önce veritabanını açar ve migration/bütünlük denetimini tamamlar. Başlatma başarısızsa servis dinlemeye geçmez; kapanış yaşam döngüsü veritabanı bağlantısını kapatır.
- Veritabanı dosya yolu servis/paketleme katmanından açıkça verilir. Böylece platforma özgü veri dizini seçimi kontrol servisinin içine gömülmez ve testler geçici dizin kullanabilir.
- `/api/v1/system/status`, hazır bir süreçte yalnız veritabanı hazır olma işaretini ve geçerli şema sürümünü tanılama amacıyla bildirir; dosya yolu, hata ayrıntısı veya başka veritabanı iç bilgisi yayımlamaz.
- Veritabanı erişimi yalnız kontrol servisinin bağımlılığı olan `@mwt-mclient/database` paketinde tutulur; worker paketleri bu pakete bağımlı olamaz. Yazılabilir ham bağlantı paket dışına açılmaz; dar ve türlenmiş repository işlemleri kullanılır.
- Sabitlenmiş Node.js çalışma zamanıyla gelen `node:sqlite` kullanılır. SQLite extension yükleme etkinleştirilmez ve ORM tabanlı otomatik şema senkronizasyonu yapılmaz.
- `foreign_keys`, WAL ve sınırlı `busy_timeout` açılır.
- Mevcut migration defteri ve desteklenen şema sürümü, WAL gibi kalıcı PRAGMA değişikliklerinden önce yalnız okunarak doğrulanır. Daha yeni veya bütünlüğü bozulmuş veritabanı değiştirilmeden reddedilir.
- Sıralı kimlik, checksum ve uygulanma zamanı taşıyan `schema_migrations` kaydı kullanılır. Her ileri migration transaction içinde yürür; eski binary daha yeni şemayı açmayı reddeder.
- Migration SQL'i runner'ın transaction sınırını yönetemez; transaction-control ifadeleri doğrulama sırasında reddedilir.
- Migration öncesi, yalnız yerel veri dizini ACL’si altında geçici bir recovery snapshot’ı alınır. Bu snapshot kullanıcı yedeği değildir ve başarılı migration sonrası kontrollü temizlenir.
- Token, parola veya script sırrının kendisi SQLite’a yazılmaz; yalnızca güvenli kasa kaydı için opak bir referans tutulabilir.
- Kontrol düzlemi tek yazardır; worker'lar veritabanını açmaz.

### Güvenli kasa katmanı

- Platforma uygun sır saklama uygulamalarını ortak bir arayüz arkasında toplar: Windows’ta servis kimliğine bağlı user-scope DPAPI; Linux ve Raspberry Pi OS’ta AES-256-GCM şifreli kasa ile systemd credential olarak verilen root-only ana anahtar.
- `put`, `get`, `delete` ve erişilebilirlik denetimi gibi asgari işlemler sunar.
- Veritabanı, log, hata mesajı ve yedeklere sır değerini döndürmeyen opak tanıtıcılarla çalışır.
- Kasa kullanılamadığında sessizce düz metne düşmez; güvenli biçimde hata verir.
- Microsoft refresh zinciri yalnız kontrol düzleminde çözülür. Worker’a kasa anahtarı veya refresh token verilmez.

### Worker yöneticisi ve worker’lar

- Her çalışan bot, Node.js `child_process.fork()` ile ayrı işletim sistemi süreci olarak oluşturulur.
- Yerleşik IPC kanalı yalnız boyut sınırlı, JSON-uyumlu ve `protocolVersion/type/requestId/sequence/payload` alanlı mesaj zarfları taşır. Kontrol→worker komutları ile worker→kontrol olayları farklı şemalarla doğrulanır; yanlış yöndeki mesaj reddedilir. Sıra numarası `Number.MAX_SAFE_INTEGER` ile sınırlıdır; sınıra ulaşan worker kanalı kontrollü kapatılır ve yeni worker süreci sıfırdan başlar.
- Worker yalnızca kendisine verilen kısa ömürlü çalışma yapılandırmasına ve daraltılmış motor/script yeteneklerine erişir.
- Worker çökmesi kontrol düzleminden ve diğer botlardan yalıtılır.
- Worker yöneticisi yeniden bağlanma ile süreç yeniden başlatmayı ayrı durumlar olarak ele alır.
- Geçici ağ kopmaları 1, 2, 4, 8, 16, 30 ve en çok 60 saniyelik ±%20 jitter’lı geri çekilme kullanır; 15 dakikada 10 başarısız deneme `attention_required` durumuna geçirir.
- Worker çökmesi 10 dakikada en çok üç kez, 2/5/15 saniye gecikmeyle yeniden başlatılır. On dakikalık kararlı çalışma bütçeyi sıfırlar. Kimlik ve yapılandırma hataları otomatik denenmez; kullanıcı durdurması bütün retry’ları iptal eder.

## Motor soyutlaması

`BotEngine` yalnız worker içinde uygulanır. Kontrol düzlemi Mineflayer tiplerini değil, sürümlü ve normalize `start/stop/status/event/action` zarflarını görür. Motor adapter’ı desteklediği yetenekleri capability kümesiyle bildirir; motor-özel ayar sürümlü opak yapılandırma sınırında kalır.

İlk sürüm doğrulaması `engineId=mineflayer` dışındaki değerleri reddeder. HeadlessMC için bu sınırın genişleyebilmesi korunur; HeadlessMC paketi, çalıştırma kodu, yapılandırması veya panel seçeneği ilk sürüme eklenmez.

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
- İlk sürümde yalnız metin editörü vardır. Ortak AST ve kararlı formatter, sonraki görsel editörün kayıplı yazma yapmadan eklenebilmesi için ilk sürümde hazırlanır.

## Ağ ve ilk kurulum durumları

1. **Kurulmamış:** HTTP dinleyicisi yalnız `127.0.0.1` ve varsa `::1` üzerinde ilk kurulum uç noktasını sunar.
2. **Yerel yönetici hazır:** Aynı loopback dinleyicisinde normal panel kullanılabilir; LAN hâlâ varsayılan olarak kapalıdır.
3. **LAN etkin:** Açık yönetici seçimiyle seçilen özel ağ adreslerinde ayrı HTTPS dinleyicisi açılır. Wildcard bind varsayılan değildir.

Loopback ve LAN farklı origin ve oturum audience’larıdır. Loopback cookie’si LAN’da, LAN cookie’si loopback’te kabul edilmez. LAN cookie’si `Secure`, `HttpOnly`, host-only ve `SameSite=Strict` olur. Her iki yüzeyde kesin Host/Origin allowlist uygulanır ve proxy başlıkları istemci adresi kanıtı sayılmaz.

LAN TLS, kurulum başına offline yerel CA ile sağlanır. CA anahtarı güvenli kasadadır. Etkin LAN IP/isimlerini SAN olarak taşıyan 90 günlük ECDSA P-256 leaf sertifika ömrünün üçte ikisinde veya SAN değişince atomik yenilenir. CA sertifikası ve parmak izi localhost panelinden alınabilir; istemci trust store’una otomatik yazılmaz.

Kontrol düzlemi UPnP, NAT-PMP, yönlendirici yönetimi veya bulut tüneliyle dış port açmaz. Özel domain desteği ilk sürüm dışındadır.

## Servis ve başlangıç modeli

- İlk sürüm yalnız sistem servisi kurulum modelini destekler. Kullanıcı oturumuna özel taşınabilir/portable çalıştırma yolu paketlenmez veya desteklenmiş gibi belgelenmez.
- Windows x64 paketi, özel Node.js runtime içeren MSI’dır ve SCM yaşam döngüsünü WinSW ile köprüler. Servis, özel düşük yetkili yerel hesap/servis SID’i ve yalnız gerekli veri ACL’leriyle çalışır.
- Systemd kullanan Linux x64 ve Raspberry Pi OS ARM64 paketleri özel Node.js runtime içeren mimariye özel `tar.gz`, kur/kaldır betiği ve unit dosyasıdır. Unit; login shell’i olmayan özel kullanıcı, `StateDirectory`/`LogsDirectory`, `NoNewPrivileges`, `PrivateTmp`, `ProtectSystem=strict` ve `ProtectHome=true` temellerini kullanır.
- Kurulum, kaldırma, kurtarma ve yükseltme yönetici/root yetkisi ister; normal runtime istemez. Sertleştirme seçenekleri her hedefte Node.js ve Mineflayer ile test edilir.
- Bot profillerinin cihaz başlangıcında çalışması kullanıcı tercihi ve profil ayarıdır; tüm botlar kendiliğinden etkinleştirilmez.
- Servis kullanıcısına etkileşimli oturum, yönetici/root veya gereksiz cihaz erişimi verilmez.

Yönetici kurtarma yalnız cihazdaki yükseltilmiş etkileşimli araçla yapılır. Admin doğrulayıcısı ve oturumlar silinir, LAN kapatılır, ürün verisi/kasa korunur ve uygulama localhost bootstrap durumuna döner.

## Log ve yedekleme

- Worker’lar allowlist alanlı yapılandırılmış olayları IPC ile kontrol düzlemine gönderir. Merkezi katman hassas anahtarları kaldırır, savunma amaçlı pattern maskelemesi ve boyut kırpması uygular, sonra 10 MiB JSONL segmentlerine yazar.
- Varsayılan saklama sınırı 14 gün veya 250 MB’tır; başlangıçta, her döndürmede ve saatte bir iki sınır da uygulanır. Dışa aktarım yeniden sanitize edilir; disk doluluğu botları/kontrol düzlemini düşürmek yerine yerel uyarı üretir.
- Kullanıcı yedeği ham SQLite kopyası değildir. Sürümlü manifest, checksum ve seçmeli/sanitize edilmiş veri veritabanı içeren `.mwtbackup` ZIP’tir.
- Admin doğrulayıcısı, oturumlar, güvenlik audit olayları, tokenlar, kasa referans/değerleri ve TLS özel anahtarları yedeğe girmez. Restore staging’de doğrulanır ve atomik uygulanır; LAN kapalı/admin yok bootstrap durumunda açılır, sır kullanan bağlar yeniden bağlantı ister.

## Güncelleme

İlk sürüm arka planda sürüm kontrolü veya otomatik kurulum yapmaz. Kullanıcı tarafından başlatılan kontrol, kesin depo adresi belirlendikten sonra GitHub Releases metadata adresine kimliksiz istek yapabilir. Elle yükseltme servisi durdurur, yerel migration recovery snapshot’ı alır, platform paketini değiştirir ve yalnız ileri şema migration’ına izin verir.

## Açık kararlar

Desteklenen Linux/systemd alt sürümleri, Microsoft public-client kaydının sahibi, kesin Minecraft destek matrisi, yedek şifreleme deneyimi ve kesin GitHub hesap/organizasyon/depo adresi `docs/DECISIONS.md` içinde açık kalır.
