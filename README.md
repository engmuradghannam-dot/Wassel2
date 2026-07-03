# MuradERP

**MuradERP** هو نظام تخطيط موارد المؤسسات (ERP) احتكاري ومملوك بالكامل لـ Murad Ghannam.

## 🏢 نظرة عامة

MuradERP هو نظام متكامل لإدارة الشركات يشمل:
- **المحاسبة**: شجرة حسابات، قيود يومية، فواتير
- **المخزون**: إدارة المنتجات، المستودعات، حركات المخزون
- **المبيعات والمشتريات**: عملاء، موردين، أوامر بيع/شراء
- **الموارد البشرية**: موظفين، حضور، إجازات، رواتب
- **المشاريع**: إدارة المشاريع والمهام
- **التقارير**: لوحة تحكم، تقارير مالية

## 🛠️ التقنية

### Backend
- **Node.js** + **Express** + **TypeScript**
- **PostgreSQL** + **Prisma ORM**
- **Redis** (Cache & Queue)
- **JWT** Authentication
- **Socket.io** Real-time

### Frontend
- **React** + **TypeScript**
- **Tailwind CSS**
- **Zustand** State Management
- **TanStack Query** Data Fetching
- **ApexCharts** Charts

### Infrastructure
- **Docker** + **Docker Compose**
- **Nginx** Reverse Proxy
- **GitHub Actions** CI/CD

## 🚀 التشغيل

### المتطلبات
- Docker + Docker Compose
- Node.js 20+ (للتطوير)

### الإنتاج
```bash
# 1. Clone
git clone https://github.com/engmuradghannam-dot/murad-erp.git
cd murad-erp

# 2. Environment
cp .env.example .env
# Edit .env with your settings

# 3. Run
docker compose up -d

# 4. Database migration
docker compose exec backend npx prisma migrate deploy

# 5. Seed data (optional)
docker compose exec backend npm run db:seed
```

### التطوير
```bash
# Backend
cd backend
npm install
npx prisma generate
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

## 📁 الهيكل

```
murad-erp/
├── backend/          # Node.js API
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── utils/
│   └── prisma/
│       └── schema.prisma
├── frontend/         # React SPA
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       └── services/
├── docker/           # Docker configs
└── docker-compose.yml
```

## 🔐 الأمان

- JWT Authentication
- Role-based Access Control (RBAC)
- Rate Limiting
- Helmet Security Headers
- Input Validation (Zod)
- SQL Injection Protection (Prisma)

## 📜 الترخيص

**Proprietary - All Rights Reserved**

© 2026 Murad Ghannam. جميع الحقوق محفوظة.

هذا البرنامج هو ملكية خاصة وسرية. لا يجوز نسخه أو توزيعه أو استخدامه بدون إذن كتابي صريح.

## 📧 التواصل

**المؤلف**: Murad Ghannam

---

<p align="center">
  <strong>MuradERP</strong> - نظام إدارة المؤسسات المتكامل
</p>
