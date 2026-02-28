# Smart Land & Farm Management System

AI-enabled geo-fencing and farm analytics platform for landowners, farmers, and agricultural investors.

## Features

- **Digital Land Mapping & Geo-Fencing** – Draw field boundaries on satellite maps, color-coded by status (cultivated, available, Thaka, not usable)
- **Expense & Income Tracking** – Record seeds, fertilizer, labor, water, fencing; automatic profit/loss per field
- **Thaka (Lease) Management** – Track leased land, tenants, lease dates, and amounts
- **Water Management** – Log irrigation sessions (date, duration)
- **Statistics & Reports** – Charts for land distribution, expenses by category, monthly trends, profit by field
- **Satellite Monitoring** – High-resolution satellite imagery with field overlays; simulated NDVI/crop health
- **AI Insights** – Recommendations for unused land, loss-making fields, fencing priorities
- **AI Chatbot** – Ask questions about your land (total area, profit, Thaka, water) and get data-based answers
- **Voice Commands** – Navigate and control the app via voice (Web Speech API)
- **AI/ML Models** – API for crop health prediction, yield forecasting, water scheduling (extensible)

## Tech Stack

- **Next.js 16** (App Router)
- **React 19**
- **Tailwind CSS 4**
- **Leaflet / React-Leaflet** – Maps & satellite imagery
- **Zustand** – State management with persistence
- **Recharts** – Statistics charts

## Getting Started

```bash
cd land-management
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- **Login**: Click "Sign In" (demo – no auth required)
- **Map**: Draw fields by clicking "Draw New Field", then click on the map to create a polygon
- **Chatbot**: Click the green bubble (bottom-right) to ask about your land
- **Voice**: Click the microphone in the header to use voice commands

## Project Structure

```
src/
├── app/
│   ├── (app)/           # Main app routes (dashboard, map, expenses, etc.)
│   ├── api/predict/     # ML prediction API
│   └── page.tsx         # Login/landing
├── components/
│   ├── LandMap.tsx      # Map wrapper
│   ├── MapComponent.tsx # Geo-fencing map
│   ├── SatelliteMap.tsx # Satellite view
│   ├── AIChatbot.tsx    # Data Q&A chatbot
│   ├── VoiceCommand.tsx # Voice control
│   └── ...
├── lib/
│   ├── store.ts         # Zustand store
│   └── ml-service.ts    # ML API client
└── types/
    └── index.ts         # TypeScript types
```

## Future Enhancements

- Real satellite NDVI integration (Sentinel, Planet)
- Weather-based suggestions
- Mobile app
- Government data integration
- Multi-user auth & roles
