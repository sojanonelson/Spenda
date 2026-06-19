# Spenda — Shared Expense & Savings Tracker

A full-stack mobile application for two partners to track daily expenses, monitor spending habits, and measure savings together.

---

## 📁 Project Structure

```
Spenda/
├── backend/    Node.js + Express + MongoDB + Socket.IO
└── app/        React Native (Expo) + Zustand
```

---

## 🚀 Getting Started

### Backend

```bash
cd backend
npm install
npm run dev
```

Server runs at `http://localhost:5000`

### Mobile App

```bash
cd app
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your phone.

> ⚠️ Update `src/utils/constants.js` → `API_BASE_URL` with your computer's local IP address (e.g. `http://192.168.1.100:5000/api`)

---

## 🔑 Environment Variables (backend/.env)

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret |
| `RESEND_API_KEY` | Resend email service key |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `FIREBASE_PROJECT_ID` | Firebase project for FCM |

---

## 📱 App Screens

| Screen | Description |
|--------|-------------|
| Login / Register | Email authentication |
| Forgot Password | Reset via email |
| Dashboard | Personal + Partner + Combined summary |
| Expenses | Mine / Partner tabs with CRUD |
| Add/Edit Expense | Form with category grid |
| Budget | Set daily spending limit |
| Reports | Daily / Weekly / Monthly |
| Notifications | Real-time push alerts |
| Profile | User info, partner management |
| Invite Partner | Connect by email |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native + Expo |
| State | Zustand |
| Navigation | React Navigation |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| Email | Resend |
| Real-time | Socket.IO |
| Notifications | Firebase Cloud Messaging |

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register |
| POST | /api/auth/login | Login |
| POST | /api/auth/google | Google OAuth |
| GET | /api/expenses | Get expenses |
| POST | /api/expenses | Add expense |
| PUT | /api/expenses/:id | Update expense |
| DELETE | /api/expenses/:id | Delete expense |
| GET | /api/budget/summary | Dashboard data |
| POST | /api/budget | Set daily budget |
| POST | /api/invitations/send | Invite partner |
| POST | /api/invitations/accept | Accept invite |
| GET | /api/reports/daily | Daily report |
| GET | /api/reports/weekly | Weekly report |
| GET | /api/reports/monthly | Monthly report |

---

## 💡 Savings Formula

```
Savings = Daily Limit − Total Spent
Combined Savings = User Savings + Partner Savings
```