# ☕ Z Coffee POS System

Sistem Point of Sale (POS) modern untuk Z Coffee — dibangun dengan stack TypeScript + React fullstack production-ready.

![Z Coffee POS](https://img.shields.io/badge/Z%20Coffee-POS%20System-coffee?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|---|---|
| 🔐 **Autentikasi** | Login JWT dengan 3 role: Admin, Kasir, Owner |
| 📊 **Dashboard** | Penjualan, laba, transaksi & antrian aktif hari ini |
| 🛒 **Kasir / POS** | Pilih produk, cart realtime, bayar (Tunai/QRIS/Transfer) |
| 🎫 **Antrian Realtime** | Socket.IO — nomor antrian otomatis, status barista |
| 📺 **Monitor Antrian** | Fullscreen display untuk layar antrian |
| 📦 **Manajemen Produk** | CRUD produk, upload foto, kategori, HPP |
| 📋 **Stok Opname** | Pantau stok, penyesuaian, riwayat perubahan |
| 📈 **Laporan** | Penjualan, laba, produk terlaris, filter tanggal |
| 👥 **Manajemen User** | Tambah/edit/hapus akun kasir/admin/owner |

---

## 🏗️ Tech Stack

### Backend
- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Auth:** JWT + bcrypt
- **Realtime:** Socket.IO
- **Upload:** Multer

### Frontend
- **Framework:** React 18 + Vite
- **Styling:** TailwindCSS + shadcn/ui
- **State:** Zustand
- **HTTP:** Axios
- **Realtime:** Socket.IO Client
- **Router:** React Router DOM v6

---

## 🚀 Cara Menjalankan

### Prasyarat
- Node.js v18+
- PostgreSQL v14+
- npm atau yarn

---

### 1. Clone & Setup

```bash
git clone <repo-url>
cd zcoffee
```

---

### 2. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Copy env
cp .env.example .env
```

Edit `.env` (Pilih salah satu tipe database yang Anda gunakan):
*   **Jika menggunakan PostgreSQL:**
    ```env
    DATABASE_URL="postgresql://postgres:password@localhost:5432/zcoffee_db"
    ```
*   **Jika menggunakan MySQL:**
    ```env
    DATABASE_URL="mysql://root:password@localhost:3306/zcoffee_db"
    ```

Sistem akan secara otomatis mendeteksi tipe database Anda dari protokol `DATABASE_URL` di atas dan menyesuaikan konfigurasi ORM.

```env
JWT_SECRET="ganti-dengan-secret-yang-kuat"
JWT_EXPIRES_IN="7d"
PORT=5000
FRONTEND_URL="http://localhost:5172"
```

```bash
# Generate Prisma client & Setup Database Provider
npm run prisma:generate

# Jalankan sinkronisasi database:
# Pilihan A: Jika menggunakan PostgreSQL (menjalankan migrasi bawaan)
npm run prisma:migrate

# Pilihan B: Jika menggunakan MySQL (sinkronisasi skema langsung)
npm run prisma:push

# Seed data awal (users + produk contoh)
npm run prisma:seed

# Jalankan server development
npm run dev
```

Backend berjalan di: `http://localhost:5000`

---

### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy env
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
VITE_UPLOAD_URL=http://localhost:5000/uploads
```

```bash
# Jalankan development server
npm run dev
```

Frontend berjalan di: `http://localhost:5172`

---

## 👤 Akun Demo (setelah seed)

| Email | Password | Role |
|---|---|---|
| admin@zcoffee.id | password123 | Admin |
| owner@zcoffee.id | password123 | Owner |
| kasir@zcoffee.id | password123 | Kasir |

---

## 📡 REST API Endpoints

### Auth
```
POST   /api/v1/auth/login       Login
GET    /api/v1/auth/profile     Get profil (auth)
```

### Produk
```
GET    /api/v1/products         List produk (paginated, filter)
GET    /api/v1/products/:id     Detail produk
POST   /api/v1/products         Tambah produk (admin, multipart)
PUT    /api/v1/products/:id     Edit produk (admin, multipart)
DELETE /api/v1/products/:id     Hapus produk (admin)
```

### Kategori
```
GET    /api/v1/categories       List kategori
POST   /api/v1/categories       Tambah kategori (admin)
PUT    /api/v1/categories/:id   Edit kategori (admin)
DELETE /api/v1/categories/:id   Hapus kategori (admin)
```

### Transaksi
```
GET    /api/v1/transactions     List transaksi (paginated)
GET    /api/v1/transactions/:id Detail transaksi
POST   /api/v1/transactions     Buat transaksi baru
```

### Antrian
```
GET    /api/v1/queues           List antrian hari ini
PATCH  /api/v1/queues/:id/status Update status antrian
```

### Stok
```
GET    /api/v1/stock/logs       Riwayat log stok
POST   /api/v1/stock/adjust     Sesuaikan stok (admin)
```

### Laporan
```
GET    /api/v1/reports/dashboard     Dashboard summary
GET    /api/v1/reports/sales         Laporan penjualan
GET    /api/v1/reports/top-products  Produk terlaris
```

### Users
```
GET    /api/v1/users            List users (admin)
POST   /api/v1/users            Tambah user (admin)
PUT    /api/v1/users/:id        Edit user (admin)
DELETE /api/v1/users/:id        Hapus user (admin)
```

---

## 🔌 Socket.IO Events

| Event | Arah | Deskripsi |
|---|---|---|
| `join:queue-monitor` | Client → Server | Join room monitor antrian |
| `join:cashier` | Client → Server | Join room kasir |
| `queue:new` | Server → Client | Antrian baru setelah transaksi |
| `queue:updated` | Server → Client | Update status antrian |

---

## 🗂️ Struktur Folder

```
zcoffee/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── config/          # database, jwt
│   │   ├── modules/         # auth, products, transactions, queues, stock, reports, users
│   │   ├── middlewares/     # auth, errorHandler, upload
│   │   ├── utils/           # response, asyncHandler, invoice
│   │   ├── sockets/         # Socket.IO handlers
│   │   ├── routes/          # index router
│   │   ├── types/           # TypeScript types
│   │   ├── app.ts
│   │   └── server.ts
│   └── uploads/             # Foto produk
│
└── frontend/
    └── src/
        ├── api/             # Axios instance
        ├── components/      # UI, layouts, reusable
        ├── pages/           # Login, Dashboard, Kasir, dll
        ├── routes/          # ProtectedRoute
        ├── services/        # Socket.IO client
        ├── store/           # Zustand stores (auth, cart, toast)
        └── lib/             # utils (formatCurrency, cn, dll)
```

---

## 🚂 Deploy ke Railway

### Backend
1. Push ke GitHub
2. New Project → Deploy from GitHub Repo → pilih folder `backend`
3. Add PostgreSQL service (Railway managed)
4. Set environment variables:
   - `DATABASE_URL` (dari Railway PostgreSQL)
   - `JWT_SECRET`
   - `FRONTEND_URL` (URL frontend setelah deploy)
5. Add build command: `npm install && npm run prisma:generate && npm run prisma:migrate && npm run build`
6. Add start command: `npm start`

### Frontend
1. New Service → Deploy from GitHub Repo → pilih folder `frontend`
2. Set environment variables:
   - `VITE_API_URL` = URL backend Railway + `/api/v1`
   - `VITE_SOCKET_URL` = URL backend Railway
   - `VITE_UPLOAD_URL` = URL backend Railway + `/uploads`
3. Build command: `npm run build`
4. Publish directory: `dist`

---

## 🔒 Keamanan

- JWT disimpan di localStorage (untuk simplisitas; di production pertimbangkan httpOnly cookie)
- Password di-hash dengan bcrypt (salt rounds: 10)
- Route dilindungi middleware `authenticate` + `authorize` per role
- File upload divalidasi tipe & ukuran (max 5MB, hanya image)
- Error message production-safe (tidak expose stack trace)

---

## 📝 Lisensi

MIT — bebas digunakan dan dimodifikasi untuk kebutuhan internal Z Coffee.
