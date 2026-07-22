# 🌌 Chatsphere - Real-Time Chat Application

Chatsphere is a premium, real-time messaging application designed with modern aesthetics and packed with rich interactive features. It supports secure authentication, private and group messaging, rich media uploads, live typing indicators, online status tracking, reactions, and a dedicated admin dashboard.

---

## 🔑 Admin Testing Credentials

To test the **Admin Module** and explore analytics, user management, group administration, and content moderation:

* **Role:** Administrator
* **Email:** `admin@gmail.com`
* **Password:** `Admin123`

*Note: The admin account is automatically seeded into the database on backend startup if it doesn't already exist.*

---

## 🚀 Key Features

* **Real-time Messaging:** Enabled by Socket.io for instantaneous message delivery and state synchronization.
* **Group Chats:** Create public or private group chats, manage members, and appoint admins.
* **File Uploads & Downloads:** 
  * Cloudinary-powered media storage.
  * Strict file size limit (max **50MB**).
  * Strict type restrictions (allows `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.mp4`, `.mov`, `.pdf`, `.doc`, `.docx`, `.txt`, and `.zip`).
  * Direct file downloading featureAdmin123 directly in message bubbles.
* **Real-time Notifications:** In-app toast alerts and unread message counters work consistently across all pages.
* **Interactive UI:** High-quality UX with auto-resizing textareas, message reactions, typing indicators, and sleek dark-mode glassmorphic aesthetics.
* **Admin Module:** Analytics visualization, user status toggling (ban/unban), group deletion, and flagged message moderation.

---

## 🛠️ Tech Stack

* **Frontend:** React, Redux Toolkit, Tailwind CSS, Vite, Socket.io-client.
* **Backend:** Node.js, Express.js, MongoDB (Mongoose), Socket.io, Multer, Cloudinary SDK.

---

## ⚙️ Project Setup

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file (refer to `.env.example`):
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   CLIENT_URL=http://localhost:5173
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
   ```
4. Run the application:
   ```bash
   npm run dev
   ```

---

## 🔒 Security Best Practices
* **Environment Files:** `.env` files are excluded from git tracking using `.gitignore` in both the backend and frontend modules to protect sensitive keys, database credentials, and APIs.
