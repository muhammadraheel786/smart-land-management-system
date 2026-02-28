#!/bin/bash

# Smart Land Management System - Quick Setup Script
# This script helps you set up the development environment

set -e

echo "🌾 Smart Land Management System - Setup"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed. Please install Python 3.11 or higher.${NC}"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 20 or higher.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Python and Node.js are installed${NC}"
echo ""

# Backend setup
echo "📦 Setting up Backend..."
cd backend

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Creating backend/.env from .env.example${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please edit backend/.env with your MongoDB Atlas connection string${NC}"
    echo -e "${YELLOW}⚠️  See MONGODB_ATLAS_SETUP.md for instructions${NC}"
else
    echo -e "${GREEN}✅ backend/.env already exists${NC}"
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo -e "${GREEN}✅ Backend setup complete${NC}"
echo ""

# Frontend setup
cd ../land-management
echo "📦 Setting up Frontend..."

if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  Creating land-management/.env.local from .env.local.example${NC}"
    cp .env.local.example .env.local
    echo -e "${YELLOW}⚠️  Please edit land-management/.env.local if needed${NC}"
else
    echo -e "${GREEN}✅ land-management/.env.local already exists${NC}"
fi

# Install Node dependencies
echo "Installing Node.js dependencies..."
npm install

echo -e "${GREEN}✅ Frontend setup complete${NC}"
echo ""

# Final instructions
echo "========================================"
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1. Set up MongoDB Atlas:"
echo "   - Follow instructions in MONGODB_ATLAS_SETUP.md"
echo "   - Update backend/.env with your connection string"
echo ""
echo "2. Start the backend:"
echo "   cd backend"
echo "   source venv/bin/activate  # On Windows: venv\\Scripts\\activate"
echo "   python manage.py runserver"
echo ""
echo "3. Start the frontend (in a new terminal):"
echo "   cd land-management"
echo "   npm run dev"
echo ""
echo "4. Open your browser:"
echo "   http://localhost:3000"
echo ""
echo "5. Login with default credentials:"
echo "   Email: smartland0990@admin.login.com"
echo "   Password: smartlandbyme@21"
echo "   ⚠️  CHANGE THESE IN PRODUCTION!"
echo ""
echo "For deployment, see DEPLOYMENT_GUIDE.md"
echo "For security, see SECURITY.md"
echo ""
