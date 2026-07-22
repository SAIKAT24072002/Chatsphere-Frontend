# 🌌 Chatsphere - Frontend Application

This directory contains the React 19 single-page frontend application for **Chatsphere**, powered by Vite, Redux Toolkit, Tailwind CSS, and Socket.io-client.

---

## 🔑 Admin Testing Credentials

To test the **Admin Module** and explore analytics, user management, and moderation:

* **Role:** Administrator
* **Email:** `admin@chatsphere.com`
* **Password:** `AdminPassword123`

---

## 🚀 Frontend Highlights

* **Responsive Real-Time Chat:** Modern dark-mode layout with anchored, auto-resizing message input.
* **File Upload & Direct Download:** Supports images, videos, documents, and archives with 25MB maximum size restriction and MIME filtering.
* **Instant Notifications:** Real-time socket notification dispatching and in-app toast alerts.
* **Admin Dashboard:** Moderation tools, analytics charts, user management, and group control.

---

## 🛠️ Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env` (refer to `.env.example`):
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
   ```

3. Start development server:
   ```bash
   npm run dev
   ```
