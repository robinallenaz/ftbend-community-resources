# 🌈 Fort Bend County LGBTQIA+ Community Resources

A community-maintained website connecting people with **LGBTQIA+ resources, events, and support** in Fort Bend County and surrounding areas.

## 🚀 Live Site

**🌐 [ftbend-lgbtqia-community.org](https://ftbend-lgbtqia-community.org)**

---

## What This Project Does

- **Find Resources** - Healthcare providers, legal services, support groups, and more
- **Discover Events** - Community meetups, support groups, social gatherings  
- **Submit Content** - Community members can add new resources on the Submit A Resource page, or submit blog posts for review and publishing through the Share Your Story button on the Blog page
- **Admin Dashboard** - Manage and moderate all content

---

## Architecture

This is a **monorepo** with two main applications:

```
📁 client/     # Frontend (React + Vite) → Deployed to Netlify
📁 server/     # Backend (Express + MongoDB) → Deployed to Render
```

### 🌐 Live URLs
- **Frontend:** https://ftbend-lgbtqia-community.org
- **Backend API:** https://ftbend-lgbtqia-community-api.onrender.com
- **Admin Panel:** https://ftbend-lgbtqia-community.org/admin

---

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **React Router** for navigation
- **Tailwind CSS** for styling

### Backend  
- **Node.js + Express**
- **MongoDB** (Atlas)
- **JWT** authentication
- **Mongoose** ODM

### Deployment
- **Netlify** (frontend)
- **Render** (backend API)
- **MongoDB Atlas** (database)

---

## 🗺️ Automatic Sitemap Generation

The sitemap automatically updates `lastmod` dates based on file modification times - no manual updates needed!

### **Generate Sitemap**
```bash
cd client
npm run sitemap
```

### **What It Does**
- Tracks file changes in `src/pages/*.tsx`
- Updates `lastmod` with actual modification dates
- Generates SEO-friendly sitemap in `public/sitemap.xml`

### **When to Run**
- After updating page content
- Before deploying to production
- Anytime you want fresh timestamps

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Node.js** (LTS version)
- **MongoDB** connection string (Atlas recommended)

### Setup Process

1. **Clone and install:**
```bash
git clone <your-repo-url>
cd ftbend-community-resources
npm install
```

2. **Environment setup:**
```bash
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

3. **Start development:**
```bash
npm run dev
```

**🌐 Development URLs:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8080
- Admin: http://localhost:5173/admin

---

## ⚙️ Environment Variables

Create a `.env` file in the root:

### Required Variables
```env
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/ftbend?retryWrites=true&w=majority
JWT_SECRET=<your-long-random-string>
```

### Optional Variables
```env
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=your-secure-password
```

---

## 🎛️ Common Commands

```bash
# Development
npm run dev           # Start both frontend and backend
npm run dev:client    # Frontend only
npm run dev:server    # Backend only

# Production
npm run build         # Build frontend for deployment
npm run start         # Start production server

# Database
npm run seed --workspace server          # Create admin account
npm run migrate:resources --workspace server  # Import resources
npm run migrate:events --workspace server     # Import events
```

---

## 🔐 Admin Dashboard

### Access
- **Login:** `/admin/login`
- **Resources:** `/admin/resources`
- **Events:** `/admin/events`
- **Submissions:** `/admin/submissions`

### User Roles
- **👑 Admin:** Full access (can archive/unarchive)
- **✏️ Editor:** Basic access (cannot archive)

### Create Admin Account
```bash
SEED_ADMIN_EMAIL="your-email@example.com" \
SEED_ADMIN_PASSWORD="secure-password" \
npm run seed --workspace server
```

---

## 🚀 Deployment Guide

### Frontend (Netlify)
```bash
# Build command
npm run build --workspace client

# Publish directory  
client/dist
```

### Backend (Render)
- **Build Command:** `npm run build --workspace server`
- **Start Command:** `npm run start`
- **Environment:** Add `MONGODB_URI` and `JWT_SECRET`

### Important Notes
- Netlify proxies `/api/*` to Render backend
- SSL certificates are automatic
- Environment variables must match between services

---

## 📧 Email Configuration

### Newsletter
The newsletter system uses **Brevo (Sendinblue)** for transactional emails:

### How It Works
1. **User subscribes** via frontend form → `/api/newsletter/subscribe`
2. **Backend validates** email and checks for duplicates
3. **Brevo API call** adds subscriber to mailing list
4. **Welcome email** sent automatically via Brevo (welcome email can be customized in `server/src/services/emailService.js`)
5. **Unsubscribe** handled via `/api/auth/unsubscribe/:email`

---

## 🔧 Troubleshooting

### Common Issues

**❌ "401 Unauthorized" on admin login**
- Check that `MONGODB_URI` matches between local and production

**❌ "400 Bad Request" when submitting**
- Resource name must be 2-140 characters
- URL will be auto-formatted with `https://`

**❌ API not responding**
- Check backend is running on Render
- Verify API proxy in `netlify.toml`

---

## 🤝 Contributing

### For Community Members
- **Submit resources** and events through the website
- **Report broken links** or outdated information
- **Share feedback** and suggestions

### For Developers
- **Fork the repository**
- **Create a feature branch**
- **Submit a pull request**
- **Follow existing code style**

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🌟 Acknowledgments

- Built for the Fort Bend County LGBTQIA+ community. The idea for the website was first conceived by Ryan Freund. 
- Community-maintained and volunteer-run
- All resources are verified by admins before publishing

---

**There is no community without unity 🏳️‍⚧️🏳️‍🌈**
