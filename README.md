# 🌾 Smart Land Management System

A comprehensive, AI-powered land management platform for farmers and landowners. Track fields, manage finances, monitor environmental data, and get intelligent insights—all in one place.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Python](https://img.shields.io/badge/python-3.11+-blue)
![Node](https://img.shields.io/badge/node-20+-green)

## ✨ Features

### 🗺️ Interactive Mapping
- **Professional geofencing** with Mapbox integration
- **High-resolution satellite imagery** (zoom up to level 22)
- **Draw and edit field boundaries** with precision
- **AI-powered auto-detection** of land boundaries
- **Multiple map styles**: Satellite, Street, Hybrid

### 💰 Financial Management
- Track expenses and income per field
- Real-time profit/loss calculations
- Comprehensive financial reports
- Export data for accounting

### 🌱 Field Management
- Monitor multiple fields with different statuses
- Track cultivation, available, and leased land
- Thaka (lease) management system
- Field-specific analytics

### 🌡️ Environmental Monitoring
- Temperature tracking
- Water/irrigation management
- Weather data integration
- Historical trend analysis

### 🤖 AI-Powered Insights
- Intelligent recommendations based on your data
- Natural language chatbot for queries
- Voice command support
- Predictive analytics

### 📊 Analytics & Reports
- Beautiful dashboards with real-time data
- Field performance metrics
- Financial summaries
- Export capabilities

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ and **npm**
- **Python** 3.11+
- **MongoDB Atlas** account (free tier available)
- **Mapbox** account (optional, free tier: 50k loads/month)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd smart-land-management
   ```

2. **Set up MongoDB Atlas**
   - Follow the detailed guide in [MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md)
   - Get your connection string

3. **Configure Backend**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your MongoDB Atlas connection string and credentials
   pip install -r requirements.txt
   python manage.py runserver
   ```

4. **Configure Frontend**
   ```bash
   cd land-management
   cp .env.local.example .env.local
   # Edit .env.local with your backend URL and Mapbox token
   npm install
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api
   - Default login: `smartland0990@admin.login.com` / `smartlandbyme@21`

## 📚 Documentation

- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Complete deployment instructions
- [MongoDB Atlas Setup](./MONGODB_ATLAS_SETUP.md) - Database configuration
- [Security Guide](./SECURITY.md) - Security best practices
- [API Documentation](./backend/api/README.md) - API endpoints reference

## 🏗️ Architecture

### Backend (Django + MongoDB)
```
backend/
├── api/              # API endpoints and business logic
├── config/           # Django settings and configuration
├── security.py       # Security utilities
└── requirements.txt  # Python dependencies
```

### Frontend (Next.js + React)
```
land-management/
├── src/
│   ├── app/          # Next.js pages and routes
│   ├── components/   # React components
│   ├── contexts/     # React contexts (Auth, Locale, etc.)
│   ├── lib/          # Utilities and helpers
│   └── types/        # TypeScript type definitions
└── public/           # Static assets
```

## 🔒 Security

This application implements multiple security layers:

- ✅ Token-based authentication with expiration
- ✅ Rate limiting on sensitive endpoints
- ✅ CORS and CSRF protection
- ✅ Secure password handling
- ✅ HTTPS enforcement in production
- ✅ Security headers (HSTS, XSS protection, etc.)
- ✅ Input validation and sanitization
- ✅ MongoDB Atlas with TLS/SSL

**Important**: 
- Change default credentials immediately
- Never commit `.env` files
- Use strong passwords (12+ characters)
- See [SECURITY.md](./SECURITY.md) for complete guidelines

## 🌍 Deployment

### Recommended Platforms

**Backend:**
- Railway (recommended) - Auto-deploy from Git
- Render - Free tier available
- Heroku - Easy deployment
- Docker - Self-hosted

**Frontend:**
- Vercel (recommended) - Optimized for Next.js
- Netlify - Great performance
- Docker - Self-hosted

**Database:**
- MongoDB Atlas (required) - Free tier: 512MB

### Quick Deploy

1. **Deploy Backend to Railway**
   ```bash
   # Install Railway CLI
   npm i -g @railway/cli
   
   # Login and deploy
   railway login
   cd backend
   railway up
   ```

2. **Deploy Frontend to Vercel**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   cd land-management
   vercel
   ```

3. **Configure Environment Variables**
   - Set all required variables in your platform dashboards
   - See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for details

## 🛠️ Development

### Backend Development

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run development server
python manage.py runserver

# Run tests
python manage.py test

# Check for issues
python manage.py check
```

### Frontend Development

```bash
cd land-management

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Lint code
npm run lint
```

## 📦 Tech Stack

### Backend
- **Django 5.0** - Web framework
- **Django REST Framework** - API development
- **MongoDB** - Database (via PyMongo)
- **Gunicorn** - WSGI server
- **Python 3.11** - Programming language

### Frontend
- **Next.js 16** - React framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Leaflet** - Map rendering
- **Mapbox** - Map tiles and geocoding
- **Zustand** - State management
- **Recharts** - Data visualization

### AI & ML
- **Hugging Face** - AI models (Kimi K2)
- **Google Gemini** - AI insights
- **OpenAI** - Optional AI integration
- **GPT4All** - Local AI models

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- **Backend**: Follow PEP 8 guidelines
- **Frontend**: Use ESLint and Prettier
- **Commits**: Use conventional commit messages

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Mapbox** for excellent mapping services
- **MongoDB Atlas** for reliable database hosting
- **Leaflet** for the mapping library
- **Next.js** team for the amazing framework
- **Django** community for the robust backend framework

## 📞 Support

- **Documentation**: Check the `/docs` folder
- **Issues**: Open an issue on GitHub
- **Security**: See [SECURITY.md](./SECURITY.md) for reporting vulnerabilities

## 🗺️ Roadmap

- [ ] Multi-user support with role-based access
- [ ] Mobile app (React Native)
- [ ] Advanced AI predictions
- [ ] Integration with weather APIs
- [ ] Soil analysis features
- [ ] Crop recommendation system
- [ ] Marketplace for equipment rental
- [ ] Community features for farmers

## 📊 Project Status

- ✅ Core features complete
- ✅ Production-ready
- ✅ Security hardened
- ✅ Documentation complete
- 🚧 Mobile app in planning
- 🚧 Advanced AI features in development

---

**Made with ❤️ for farmers and landowners worldwide**

For detailed deployment instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
