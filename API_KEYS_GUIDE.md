# 🔑 API Keys Alma Rehberi

## 1. TMDB (The Movie Database) API Key

### Adımlar:
1. **Hesap Oluştur**: https://www.themoviedb.org/ 
2. **Email Doğrula**: Email'deki linke tıkla
3. **Settings**: Profil > Settings
4. **API Bölümü**: Sol menüden "API" seç
5. **Create API Key**: "Create" butonuna tıkla
6. **Developer Seç**: "Developer" option'ını seç
7. **Terms Kabul Et**: Terms of use'u kabul et
8. **Application Details**:
   - Application Name: `Hypertube`
   - Application URL: `http://localhost:3001`
   - Application Summary: `Movie streaming platform for educational purposes`
9. **API Key Kopyala**: API Key (v3 auth) kopyala

### Test:
```bash
curl "https://api.themoviedb.org/3/movie/popular?api_key=YOUR_API_KEY"
```

---

## 2. OMDB (Open Movie Database) API Key

### Adımlar:
1. **API Key Al**: http://www.omdbapi.com/apikey.aspx
2. **FREE Plan Seç**: "FREE!" (1,000 requests/day)
3. **Email Gir**: Email adresini gir
4. **Email Kontrol Et**: API key email'de gelecek
5. **Email Doğrula**: Email'deki "Activate" linkine tıkla

### Test:
```bash
curl "http://www.omdbapi.com/?apikey=YOUR_API_KEY&t=Inception"
```

---

## 3. .env Dosyasını Güncelle

Backend klasöründe .env dosyasını aç ve API key'leri ekle:

```bash
# Movie APIs
TMDB_API_KEY=YOUR_TMDB_API_KEY_HERE
OMDB_API_KEY=YOUR_OMDB_API_KEY_HERE
```

---

## 4. Test Et

Container'ları restart et:
```bash
docker-compose restart backend
```

API'leri test et:
```bash
# Backend popular movies
curl "http://localhost:3000/movies/popular"

# Frontend
http://localhost:3001
```

---

## 🎬 Test Scenarios

### 1. Popular Movies
- Frontend ana sayfasında popüler filmler görünmeli
- Film kartlarında poster, title, year, rating olmalı

### 2. Search
- Search bar'dan "Inception" ara
- Sonuçlar thumbnail formatında gelmeli
- Watched/unwatched status görünmeli

### 3. Movie Detail
- Bir film kartına tıkla
- Movie detail sayfası açılmalı
- "Watch Now" butonu görünmeli
- Eğer film indirilmemişse otomatik download başlamalı

### 4. Download Flow
- Watch butonuna bas
- Backend'de torrent download başlamalı
- Progress bar güncellenmeyi görmeli
- %5+ indirildikten sonra "Stream (Partial)" seçeneği çıkmalı