# Hypertube Backend API

Video streaming web uygulaması için NestJS backend API.

## 🚀 Kurulum

### 1. API Keys Alın
```bash
# TMDB API Key:
# 1. https://www.themoviedb.org/ adresine git
# 2. Hesap oluştur -> Settings -> API -> Create -> Developer
# 3. API Key (v3 auth) kopyala

# OMDB API Key:
# 1. http://www.omdbapi.com/apikey.aspx adresine git  
# 2. FREE plan seç -> Email gir -> API key'i kopyala
```

### 2. Environment Dosyası
```bash
cp .env.example .env
# .env dosyasındaki API key'leri kendi key'lerinle değiştir
```

### 3. Çalıştır
```bash
docker-compose up --build
```

## 📡 API Endpoints

### Movies
- `GET /movies/search?query=avengers&page=1` - Film ara
- `GET /movies/popular` - Popüler filmler
- `GET /movies/:id` - Film detayları
- `GET /movies/imdb/:imdbId` - IMDB ID ile film bilgisi

### Torrents  
- `GET /torrents/search?q=avengers` - Torrent ara
- `GET /torrents/imdb/:imdbId` - IMDB ID ile torrent ara
- `GET /torrents/best/:imdbId` - En iyi torrent bulma (1080p öncelikli, en çok seed)

### Downloads (Torrent Download Management)
- `POST /downloads/start/:imdbId` - Film indirmeyi başlat
- `GET /downloads` - Tüm indirmeleri listele
- `GET /downloads/:id` - İndirme durumunu kontrol et
- `GET /downloads/movie/:movieId` - Film ID'sine göre indirme
- `PATCH /downloads/:id/pause` - İndirmeyi duraklat
- `PATCH /downloads/:id/resume` - İndirmeyi devam ettir
- `DELETE /downloads/:id` - İndirmeyi sil

### 🎬 Watch (Subject Compliant Flow)
- `GET /watch/:imdbId` - **Subject'e uygun izleme akışı**
- `POST /watch/:imdbId/stream` - Streaming session başlat
- `POST /watch/:imdbId/stop` - Streaming session bitir

### User Watch Status
- `POST /movies/:id/watch` - Film izlendi olarak işaretle
- `PATCH /movies/:id/progress` - İzleme ilerlemesini güncelle
- `GET /movies/:id/watch-status` - İzleme durumunu getir

### Transmission
- `GET /downloads/transmission/stats` - Transmission istatistikleri
- `GET /downloads/transmission/torrents` - Aktif torrent'lar

### Test Endpoints
```bash
# Torrent araması (API key gerekmez - ✅ Çalışıyor)
curl "http://localhost:3000/torrents/search?q=avengers"

# En iyi torrent (Avengers Endgame - ✅ Çalışıyor)
curl "http://localhost:3000/torrents/best/tt4154796"

# Film araması (API key gerekir)
curl "http://localhost:3000/movies/search?query=avengers"

# Transmission istatistikleri (✅ Çalışıyor)
curl "http://localhost:3000/downloads/transmission/stats"

# Film indirme başlat (✅ Çalışıyor)
curl -X POST "http://localhost:3000/downloads/start/tt4154796"

# İndirme durumunu kontrol et (✅ Çalışıyor)
curl "http://localhost:3000/downloads"

# 🎬 Subject-compliant watch flow (✅ Çalışıyor)
curl "http://localhost:3000/watch/tt4154796"

# Film thumbnail search (✅ Çalışıyor - API key ile)
curl "http://localhost:3000/movies/search?query=avengers&sortBy=rating&sortOrder=desc"
```

## 🎯 Tamamlanan Özellikler

✅ NestJS backend yapısı
✅ Docker containerization  
✅ PostgreSQL veritabanı
✅ Swagger API dökümantasyonu
✅ TMDB & OMDB film API entegrasyonu
✅ YTS & TorrentAPI torrent sağlayıcıları
✅ Film arama ve torrent bulma
✅ **Transmission Daemon** torrent download sistemi
✅ **Download Management** - start, pause, resume, delete
✅ **Progress Tracking** - gerçek zamanlı indirme takibi
✅ **Auto Cleanup** - 30 gün sonra dosya temizleme
✅ **Download Database** - indirme geçmişi ve durumu
✅ **🎬 Subject-Compliant Watch Flow** - otomatik download trigger
✅ **Thumbnail Search** - watched/unwatched status ile
✅ **User Watch Tracking** - progress ve status takibi
✅ **Pagination & Sorting** - name, year, rating, popularity
✅ **Background Processing** - non-blocking download
✅ **🖥️ NextJS 14 Frontend** - Modern UI/UX
✅ **📱 Responsive Design** - Mobile ve desktop uyumlu
✅ **🔄 Real-time Updates** - React Query ile state management
✅ **🎨 Tailwind CSS** - Modern styling
✅ **🔗 API Integration** - Frontend-backend communication

## 📋 Sonraki Adımlar

- [ ] Kullanıcı authentication sistemi (OAuth2 + JWT)
- [ ] Video streaming ve conversion (FFmpeg)
- [ ] Subtitle download sistemi
- [ ] Video player frontend (React/Vue)
- [ ] File serving ve streaming endpoints

## 🌐 Erişim

- **🎬 Frontend**: http://localhost:3001 (NextJS 14)
- **🔧 Backend API**: http://localhost:3000 (NestJS)
- **📖 Swagger UI**: http://localhost:3000/api
- **⚡ Transmission Web UI**: http://localhost:9091 (admin/admin123)
- **🗄️ Database**: localhost:5432 (PostgreSQL)

## 🔧 Sistem Özellikleri

### 📖 Subject Compliance
- **✅ Search Engine**: 2+ external API (TMDB + OMDB) 
- **✅ Thumbnails**: Title, year, IMDB rating, poster, watched status
- **✅ Popular Movies**: Default görüntüleme seeders'a göre sıralı
- **✅ Auto Download**: Video click'te otomatik torrent download
- **✅ Background Processing**: Non-blocking torrent işlemleri
- **✅ Streaming**: Partial download ile streaming başlama
- **✅ Auto Cleanup**: 30 gün unwatched file silme
- **✅ Pagination**: Asenkron scroll loading
- **✅ Sorting/Filtering**: Name, genre, rating, year

### 🔧 Technical Features  
- **Transmission Daemon**: Server-side torrent (WebTorrent yasak!)
- **PostgreSQL**: Movie, UserWatch, Download entities
- **Cron Jobs**: Progress update + auto cleanup
- **Docker Compose**: Full containerization
- **TypeORM**: Database ORM ve migrations
- **Swagger**: API documentation

### 📁 Proje Yapısı
```
hypertube/
├── backend/              # NestJS API
│   ├── src/
│   │   ├── movies/       # Film modülü
│   │   ├── torrents/     # Torrent modülü
│   │   └── auth/         # Auth modülü (gelecek)
│   ├── Dockerfile
│   └── package.json
├── frontend/             # NextJS 14 UI
│   ├── src/
│   │   ├── app/          # App Router
│   │   ├── components/   # UI bileşenleri
│   │   ├── api/          # API client
│   │   └── types/        # TypeScript tanımları
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml    # Ortak container yönetimi
└── subject.md           # Proje gereksinimleri
```