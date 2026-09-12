# Kavramsal veri modeli

Bu belge ilk sürümde korunması gereken varlık sınırlarını ve şema kurallarını tanımlar. İlk migration'ın SQL adları aşağıda kaydedilmiştir; sonraki varlıklar ilgili özellik uygulanırken yeni ileri migration'larla eklenecektir.

## İlkeler

- Hesaplar, sunucular ve bot profilleri ayrı varlıklardır.
- Bir hesap birçok bot profiline bağlanabilir; eşzamanlı kullanım için benzersizlik kilidi yoktur.
- Bir sunucu birçok bot profili tarafından kullanılabilir.
- Account, Server ve BotProfile için sabit adet kotası veya kurulum sihirbazına bağlı minimum kayıt sayısı yoktur.
- Gizli değerlerin kendisi SQLite’ta tutulmaz; yalnızca güvenli kasa için opak referanslar tutulabilir.
- Worker süreçleri SQLite’a doğrudan yazmaz; kalıcı değişiklikler kontrol düzleminden geçer.
- Kimlikler, kullanıcı tarafından değiştirilebilen adlardan bağımsız ve kararlı olmalıdır.
- Foreign keys ve WAL açılır; kontrol düzlemi tek yazardır.
- Her şema değişikliği sıralı kimlik ve checksum taşıyan açık SQL migration'dır. Uygulanan kayıtlar `schema_migrations` içinde tutulur; migration transaction içinde yürür ve downgrade reddedilir.

## Uygulanan ilk şema

`0001_initial_entities` migration'ı aşağıdaki `STRICT` tabloları oluşturur:

- `schema_migrations`: migration kimliği, adı, SHA-256 checksum'ı ve uygulanma zamanı.
- `accounts`: Microsoft/offline hesap kimliği, gizli olmayan profil verisi ve isteğe bağlı opak `credential_reference`. Parola, token veya sır değeri alanı yoktur.
- `servers`: sunucu adresi/portu ile `auto` veya `manual` sürüm seçimi.
- `bot_profiles`: hesap ile sunucuyu Mineflayer profili olarak bağlar; `account_id` veya `(account_id, server_id)` üzerinde tekillik yoktur.

`bot_profiles.account_id` ve `bot_profiles.server_id` yabancı anahtarları `ON DELETE RESTRICT` kullanır. İlişki indeksleri performans içindir ve benzersiz değildir. İlk migration henüz Admin, script, audit veya çalışma geçmişi tablolarını oluşturmaz; bunlar kendi özellikleri ve açık kararları tamamlandığında yalnız ileri migration ile eklenecektir.

## Varlıklar

### Admin

İlk sürümde en fazla bir kayıt bulunur.

- Kararlı kimlik
- Görünen kullanıcı adı
- Parola doğrulama özeti ve parametreleri; parola değil
- Oluşturulma ve son güncellenme zamanı
- Gerekli güvenlik sürüm bilgileri

### AppSettings

Tekil kurulum ayarlarını taşır.

- Kurulum tamamlandı durumu
- LAN erişimi etkin mi
- LAN bağlama tercihleri ve HTTPS yapılandırma referansları
- Arayüz dili ve tema tercihi
- Log saklama: varsayılan 14 gün ve 250 MB
- Şema/uygulama ayar sürümü

LAN erişimi `Admin` oluşmadan etkin duruma getirilemez.

LAN yapılandırması yalnız seçilen özel ağ adreslerini tutar; wildcard bind varsayılanı saklanmaz. Sertifika özel anahtarı veya CA özel anahtarı bu varlıkta bulunmaz.

### Account

- Kararlı kimlik ve kullanıcı tarafından verilen ad
- Tür: `microsoft` veya `offline`
- Minecraft görünen adı/kimlik bilgileri
- Microsoft için güvenli kasadaki token kaydına opak referans
- Bağlantı durumu ve son doğrulama zamanı
- Gizli olmayan sağlayıcı meta verisi

Microsoft parolası için alan bulunmaz. Offline hesap için token referansı gerekmez.

### Server

- Kararlı kimlik ve kullanıcı tarafından verilen ad
- Ana makine ve port
- Minecraft sürüm modu: `auto` veya `manual`
- Elle modda seçilen sürüm
- Gizli olmayan bağlantı tercihleri

### BotProfile

- Kararlı kimlik ve kullanıcı tarafından verilen ad
- `Account` yabancı anahtarı
- `Server` yabancı anahtarı
- Motor türü: ilk sürümde yalnızca `mineflayer`
- Cihaz başlangıcında otomatik başlatma tercihi
- Yeniden bağlanma/kurtarma politika referansı veya ayarları
- Etkin script bağları

`account_id` üzerinde tekillik kısıtı yoktur. `(account_id, server_id)` birleşimi de tekil değildir.

### Script

- Kararlı kimlik, ad ve açıklama
- `.mwtsk` kaynak metni
- Dil/AST şema sürümü
- Kaynak: yerel oluşturma veya içe aktarma
- Doğrulama durumu ve tanı özeti
- İçerik özeti/hash’i
- Oluşturulma ve güncellenme zamanı

Script metninde gerçek sır değeri bulunmaz; yalnızca isimlendirilmiş sır referansı kullanılabilir.
Kaynağın ilk anlamlı satırındaki `language <major>` değeri ayrı indekslenebilir fakat kaynakla uyuşmazsa doğrulama başarısız olur; veritabanı metadata’sı kaynak sürümünü geçersiz kılamaz.

### ScriptApproval

Onayın tam olarak doğrulanan içeriğe bağlı olmasını sağlar.

- Script kimliği
- Onaylanan içerik özeti/hash’i
- Gösterilen yetenek/etki özeti
- Onay zamanı ve yönetici kimliği

Script içeriği değişince eski onay geçersiz olur. İçe aktarılan script geçerli doğrulama ve eşleşen onay olmadan etkinleştirilemez.

### BotProfileScript

- Bot profili ve script ilişkisi
- Profil içinde benzersiz ve kararlı bağlama sırası
- Etkinlik durumu

Olaylar bu bağlama sırasıyla script kuyruklarına fan-out edilir. Aynı olay için host eylem sırası olay sıra numarası, bağlama sırası ve script içi eylem sıra numarasından türetilir.

### SecretReference

- Kararlı kimlik
- Kullanıcıya gösterilen ad
- Sırın amacı/türü
- Güvenli kasadaki opak anahtar
- Oluşturulma ve son değiştirilme zamanı

Sır değeri, önizlemesi veya geri getirilebilir kopyası bulunmaz.

### BotRun

Geçmiş ve mevcut çalıştırmanın gizli olmayan durum özetidir.

- Bot profili kimliği
- Worker örneği kimliği
- Başlangıç/bitiş zamanı
- Son durum ve güvenli hata sınıfı
- Yeniden bağlanma/yeniden başlatma sayaçları
- İstenen durdurma ile çökme ayrımı

### AuditEvent

Yerel yönetim açısından önemli olayların sır içermeyen kaydıdır.

- Zaman, olay türü ve sonuç
- İlgili varlık kimlikleri
- Sır temizlenmiş bağlam

Bu kayıt dış telemetri değildir ve cihazdan gönderilmez.

## Türetilmiş çalışma durumu

Anlık worker PID’si, canlı bağlantı nesneleri ve çözümlenmiş tokenlar kalıcı ürün varlığı değildir. Çökme sonrası SQLite’taki istenen durum ile süreç gözlemi uzlaştırılır.

Geçici yeniden bağlanma sayaçları bellekte olabilir; worker crash-loop bütçesi servis yeniden başlatmasında sıfırlanmaması için son olay zamanlarıyla kalıcılaştırılır. Kalıcı kimlik/yapılandırma hatası `attention_required` olarak saklanır.

## Migration ve kurtarma snapshot'ı

- Kontrol servisi hazır kabul edilmeden ve herhangi bir ağ dinleyicisi açılmadan önce veritabanı açma, uyumluluk denetimi ve bekleyen migration'lar tamamlanır.
- Başlatma sırasında daha yeni şema, bozuk migration defteri veya migration hatası görülürse servis fail-closed davranır ve dinlemeye geçmez.
- Başarıyla açılan veritabanının şema sürümü salt okunur sistem durumu yanıtında gösterilebilir; veritabanı yolu ve migration hata ayrıntıları bu yanıta girmez.
- Uygulama daha yeni bir şema görürse veritabanını yazmadan açmayı reddeder.
- Bu uyumluluk kontrolü WAL gibi veritabanında kalıcı olabilen PRAGMA değişikliklerinden önce yapılır.
- Migration öncesinde SQLite online backup mekanizmasıyla yerel recovery snapshot’ı alınır; kaynak dosyayı işletim sistemi kopyasıyla almak yeterli değildir.
- Recovery snapshot, veri dizini ACL’si içinde tutulur, kullanıcıya taşınabilir yedek olarak sunulmaz ve başarılı migration sonrası kontrollü temizlenir.
- Snapshot adı migration kimliği ve rastgele UUID taşır. Başlangıç uzlaştırması yalnız uygulamaya ait ad biçimini karşılayan ve migration defterinde uygulanmış görünen snapshot’ları yeniden temizler; uygulanmamış/başarısız migration snapshot’ını korur.
- Migration başarısızsa transaction rollback edilir; otomatik down-migration uygulanmaz.
- Migration dosyaları `BEGIN`, `COMMIT`, `ROLLBACK`, `SAVEPOINT`, `RELEASE` veya transaction anlamındaki `END` ifadelerini çalıştıramaz; transaction sınırı yalnız runner tarafından yönetilir.

## Silme ve başvuru bütünlüğü

- Hesaplar, sunucular ve bot profilleri kurulum sonrasında panelden eklenebilir, değiştirilebilir ve kaldırılabilir.
- Kullanılan bir hesap veya sunucu silinmeden önce bağlı bot profilleri açıkça ele alınır; sessiz zincirleme silme yapılmaz.
- Script silme, bot profili bağlarını kontrollü biçimde kaldırır fakat audit kaydına sır yazmaz.
- Kasa kaydı, referans veren ürün verisiyle koordineli ve başarısızlıkta kurtarılabilir biçimde silinir.

## Yedek sınırı

Kullanıcı yedeği tam SQLite snapshot’ı değildir. Sürümlü manifest, checksum ve yalnız izinli varlık/alanlardan üretilmiş sanitize veri veritabanı içeren `.mwtbackup` ZIP’tir.

- Hesapların gizli olmayan kimliği, sunucular, bot profilleri, `.mwtsk` kaynakları ve kullanıcı tercihleri taşınabilir.
- Admin kaydı/parola doğrulayıcısı, oturumlar, güvenlik audit olayları, kasa referansları ve değerleri, Microsoft/Xbox/Minecraft tokenları, cihaz kodları, script sırları ve TLS özel anahtarları taşınmaz.
- Secret gerektiren hesap ve script bağları restore sonrasında `reauth_required`/`secret_required` durumuna dönüştürülür.
- Restore staging alanında manifest, checksum ve desteklenen şema sürümünü doğrular; sonra atomik uygulanır.
- Restore edilen kurulum admin yok, kurulum tamamlanmamış ve LAN kapalı durumda açılır. Yeni yönetici yalnız localhost üzerinden oluşturulur.

## Açık kararlar

Henüz uygulanmamış tabloların kesin SQL adları/indeksleri, audit olay kataloğu ve `.mwtbackup` passphrase şifreleme deneyimi `docs/DECISIONS.md` sınırları içinde ilgili görevlerde netleştirilir. Yedek şifreleme tercihi O-104 olarak kullanıcı kararına açıktır.
