# Karar kaydı

Bu belge kabul edilmiş ürün kararlarını ve henüz çözülmemiş konuları tek yerde tutar. Kabul edilmiş karar değişirse ilgili tüm belgeler aynı değişiklikte güncellenmelidir.

## Kabul edilmiş kararlar

| Kimlik | Karar | Durum |
| --- | --- | --- |
| D-001 | Proje adı MWT-MClient’tır; açık kaynak ve MIT lisanslıdır. | Kabul edildi |
| D-002 | Hedefler Windows x64, Linux x64 ve Raspberry Pi OS ARM64’tür. | Kabul edildi |
| D-003 | Uygulama ayrı, düşük yetkili kullanıcıyla sistem servisi olarak çalışır; botların başlangıçta çalışması isteğe bağlıdır. | Kabul edildi |
| D-004 | İlk kurulum yalnızca localhost’tadır. Yönetici oluşturulmadan LAN erişimi açılmaz. | Kabul edildi |
| D-005 | LAN erişimi HTTPS kullanır; uygulama dış internete otomatik port açmaz. | Kabul edildi |
| D-006 | İlk sürüm tek panel yöneticisi kullanır. | Kabul edildi |
| D-007 | Panel React + TypeScript; backend Node.js + TypeScript; veritabanı SQLite’tır. | Kabul edildi |
| D-008 | Panel modern, sade, mobil uyumlu, açık/koyu temalıdır; teknik ayrıntılar “Gelişmiş görünüm” altındadır. | Kabul edildi |
| D-009 | Başlangıç dili Türkçedir; UI baştan i18n uyumludur. Script dili yalnızca İngilizcedir. | Kabul edildi |
| D-010 | Her bot ayrı worker sürecinde çalışır. İlk sürümün tek motoru Mineflayer’dır. | Kabul edildi |
| D-011 | HeadlessMC için motor soyutlaması korunur; uygulama ve panel seçeneği ilk sürümde yoktur. | Kabul edildi |
| D-012 | Microsoft ve offline hesaplar desteklenir. Microsoft parolası saklanmaz; cihaz giriş akışı kullanılır. | Kabul edildi |
| D-013 | Tokenlar ve script sırları işletim sistemine uygun güvenli kasa katmanında saklanır. | Kabul edildi |
| D-014 | Hesaplar, sunucular ve bot profilleri ayrıdır. Aynı hesabın eşzamanlı kullanımına yapay sınır konmaz. | Kabul edildi |
| D-015 | Minecraft sürümü otomatik algılanabilir veya elle seçilebilir. | Kabul edildi |
| D-016 | Otomatik yeniden bağlanma ve kontrollü çökme kurtarma bulunur. | Kabul edildi |
| D-017 | Loglar varsayılan olarak 14 gün veya 250 MB saklanır; ilk aşılan sınır temizliği tetikler. | Kabul edildi |
| D-018 | Varsayılan telemetri yoktur. Yedekler token veya parola içermez. | Kabul edildi |
| D-019 | `.mwtsk`, girinti tabanlı ve doğal İngilizce okunan DSL’dir; görsel ve metin editörü aynı modeli kullanır. | Kabul edildi |
| D-020 | Scriptin dosya sistemi, işletim sistemi komutu veya sınırsız ağ erişimi yoktur. İçe aktarım doğrulama ve kullanıcı onayı olmadan çalışmaz. | Kabul edildi |
| D-021 | Özel domain, Crowdin bağlantısı, TPM, gelişmiş görsel editör ve imzalı otomatik güncelleme sonraki sürümlerdedir. | Kabul edildi |
| D-022 | Kaldırıcı varsayılan olarak kullanıcı verisini korur ve ayrıca tüm verileri kaldırma seçeneği sunar. | Kabul edildi |

## Açık kararlar

Bu maddeler gereksinim değildir; uygulama başlamadan veya ilgili aşamaya gelmeden önce karar verilmesi gereken konulardır.

### O-001 — Dağıtım ve servis paketleme

Her hedef platformdaki paket biçimi, kurucu/kaldırıcı teknolojisi, servis yöneticisi entegrasyonu ve desteklenen işletim sistemi alt sürümleri seçilmeli.

### O-002 — Yerel API ve süreçler arası iletişim

Node.js HTTP çatısı, panel API biçimi, canlı olay aktarımı ve kontrol düzlemi-worker IPC taşıması/şeması seçilmeli.

### O-003 — LAN HTTPS sertifika deneyimi

Yerel sertifikanın üretimi, yenilenmesi, güven kurulumu, adres değişikliği ve tarayıcı uyarılarının kullanıcı deneyimi belirlenmeli. Özel domain kapsam dışı kalmalı.

### O-004 — Yönetici güvenliği ve kurtarma

Parola türetme algoritması/parametreleri, oturum süreleri, yeniden doğrulama gerektiren işlemler ve tek yöneticinin güvenli parola sıfırlama/kurtarma yolu belirlenmeli.

### O-005 — Platform güvenli kasa uygulamaları

Windows, Linux ve Raspberry Pi OS üzerinde kullanılacak kasa sağlayıcıları, başsız servis oturumundaki kilit açma modeli ve kasa erişilemediğinde kullanıcıya sunulan kurtarma adımları seçilmeli. Düz metin geri dönüşü yasak kalmalı.

### O-006 — Microsoft kimlik kitaplığı ve token yaşam döngüsü

Cihaz girişini uygulayacak kitaplık, istemci kaydı, token yenileme/iptal davranışı ve yeniden bağlantı kullanıcı deneyimi belirlenmeli.

### O-007 — Minecraft sürüm desteği

İlk halka açık sürümün test edilmiş Minecraft sürüm matrisi, otomatik algılama başarısızlığı davranışı ve uyumsuz Mineflayer sürümlerinin sunumu kararlaştırılmalı.

### O-008 — Yeniden bağlanma ve çökme kurtarma eşikleri

Üstel gecikme değerleri, rastgele sapma, deneme penceresi, kararlı hata eşiği ve başlangıçta otomatik çalışan profilin sürekli hata durumundaki davranışı belirlenmeli.

### O-009 — Log ayrıntıları

14 gün/250 MB kuralı kabul edilmiştir; dosya/SQLite yerleşimi, döndürme atomikliği, olay önem seviyeleri, kullanıcıya dışa aktarma ve disk doluluğu davranışı seçilmeli.

### O-010 — Yedek biçimi ve geri yükleme

Yedek kapsayıcı biçimi, isteğe bağlı şifreleme, bütünlük doğrulaması, sürümler arası geri yükleme ve kasa referanslarının sır değeri olmadan nasıl ele alınacağı belirlenmeli.

### O-011 — Kesin veri şeması ve migration aracı

SQL tabloları/indeksleri, audit kapsamı, silme politikaları ve migration/geri alma stratejisi tasarlanmalı.

### O-012 — `.mwtsk` grameri ve yetenek kataloğu

Tam sözcüksel gramer, tipler, olaylar, eylemler, hata modeli, yorumlayıcı davranışı ve dil/AST sürümleme kuralı ayrı bir dil kararıyla sabitlenmeli.

### O-013 — Script kaynak kotaları

Adım, süre, bellek, olay kuyruğu ve eylem hızı limitleri ile limit aşımı sonrası profil davranışı ölçülerek belirlenmeli.

### O-014 — Script bağlama ve yürütme sırası

Bir profile birden çok script bağlandığında olay sırası, hata yalıtımı, paylaşılan durum olup olmadığı ve çakışan eylemlerin sonucu kararlaştırılmalı.

### O-015 — Motor soyutlamasının kesin sözleşmesi

Mineflayer’a göre gereksiz genelleme yapmadan gelecekteki HeadlessMC uygulamasına engel olmayacak minimum motor yaşam döngüsü, olay ve yetenek yüzeyi belirlenmeli.

### O-016 — İlk sürüm güncelleme yöntemi

İmzalı otomatik güncelleme kapsam dışıdır. İlk sürümde güvenlik sürümlerinin nasıl duyurulacağı ve elle güncellemenin veri/servis sürekliliğini nasıl koruyacağı belirlenmeli.

### O-017 — Görsel editörün ilk sınırı

Gelişmiş görsel editör sonraki sürümdedir. İlk sürümde ortak AST’nin yalnızca altyapı sözleşmesi mi yoksa sınırlı bir görsel görüntüleme yüzeyi mi sunacağı netleştirilmeli; ürün kapsamı sessizce genişletilmemeli.

## Karar verme ölçütleri

- Güvenli varsayılan ve en az yetki
- Windows x64, Linux x64 ve Raspberry Pi OS ARM64 üzerinde doğrulanabilirlik
- Çevrimdışı/yerel-öncelikli çalışma ve telemetrisizlik
- Bakım maliyeti ve açık kaynak lisans uyumu
- Kullanıcı deneyiminin sade kalması; teknik ayrıntıların gelişmiş görünümde yer alması
- Kabul edilmiş ilk sürüm kapsamını büyütmeme
