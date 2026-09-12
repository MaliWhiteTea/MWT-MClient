# Kavramsal veri modeli

Bu belge uygulama şemasını değil, ilk sürümde korunması gereken varlık sınırlarını tanımlar. Kesin tablo/kolon adları ve migration aracı henüz seçilmemiştir.

## İlkeler

- Hesaplar, sunucular ve bot profilleri ayrı varlıklardır.
- Bir hesap birçok bot profiline bağlanabilir; eşzamanlı kullanım için benzersizlik kilidi yoktur.
- Bir sunucu birçok bot profili tarafından kullanılabilir.
- Gizli değerlerin kendisi SQLite’ta tutulmaz; yalnızca güvenli kasa için opak referanslar tutulabilir.
- Worker süreçleri SQLite’a doğrudan yazmaz; kalıcı değişiklikler kontrol düzleminden geçer.
- Kimlikler, kullanıcı tarafından değiştirilebilen adlardan bağımsız ve kararlı olmalıdır.

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

### ScriptApproval

Onayın tam olarak doğrulanan içeriğe bağlı olmasını sağlar.

- Script kimliği
- Onaylanan içerik özeti/hash’i
- Gösterilen yetenek/etki özeti
- Onay zamanı ve yönetici kimliği

Script içeriği değişince eski onay geçersiz olur. İçe aktarılan script geçerli doğrulama ve eşleşen onay olmadan etkinleştirilemez.

### BotProfileScript

- Bot profili ve script ilişkisi
- Çalıştırma sırası/önceliği için geleceğe dayanıklı alan
- Etkinlik durumu

Kesin sıralama davranışı açık karardır; alanın varlığı bir yürütme sırası taahhüdü değildir.

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

## Silme ve başvuru bütünlüğü

- Kullanılan bir hesap veya sunucu silinmeden önce bağlı bot profilleri açıkça ele alınır; sessiz zincirleme silme yapılmaz.
- Script silme, bot profili bağlarını kontrollü biçimde kaldırır fakat audit kaydına sır yazmaz.
- Kasa kaydı, referans veren ürün verisiyle koordineli ve başarısızlıkta kurtarılabilir biçimde silinir.

## Yedek sınırı

Yedek; SQLite’ın tutarlı anlık görüntüsünü ve uygun kullanıcı içeriklerini kapsayabilir. Kasa değerleri, Microsoft tokenları, parolalar ve script sırları kapsam dışıdır. Geri yükleme sonrasında bu sırları kullanan özellikler yeniden bağlantı/yeniden giriş isteyebilir.

## Açık kararlar

Kesin SQL şeması, migration aracı, silme politikaları, audit kapsamı, yedek biçimi ve şifreleme seçimi `docs/DECISIONS.md` içinde izlenir.
