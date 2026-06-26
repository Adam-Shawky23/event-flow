EventFlow
Live Demo: [https://6a3e5f46e33e3309179ead47--eventflowfg.netlify.app](https://eventflowfg.netlify.app)

What is EventFlow?
EventFlow is a full-stack event management and online ticket booking platform. Users can create and publish events, browse and book tickets, communicate with organizers, and receive personalized event recommendations — all through a clean, responsive web interface.
Built as a university coursework project for the Web Application Technologies course (6th semester, Department of Informatics & Telecommunications), it implements all 13 specification requirements including a custom Biased Matrix Factorization recommendation algorithm written from scratch.

Tech Stack
Backend

NestJS 11 + TypeScript
Prisma 7.8 ORM with PostgreSQL adapter
PostgreSQL (Supabase)
JWT authentication + bcrypt password hashing
Multer for photo uploads
Custom BMF recommendation engine (no ML libraries)

Frontend

React 18 + Vite + TypeScript
React Router DOM v6
Axios with JWT interceptor
Leaflet.js + OpenStreetMap (with auto-geocoding)
Fully responsive — mobile, tablet, desktop

Infrastructure

Backend hosted on Render (free tier)
Database hosted on Supabase (free tier, PostgreSQL)
Frontend hosted on Netlify (free tier)
CI/CD via GitHub Actions


Features
Four User Roles

Admin — manages users (approve/reject/change role), exports all data as XML or JSON
Organizer — creates, edits, publishes, and cancels events; views bookings; messages attendees
Participant — browses events, makes bookings, sends/receives messages
Guest — browses and searches events without registering

Event Management

Create events with all DTD-compliant fields (title, categories, type, venue, address, city, country, geo-coordinates, dates, capacity, ticket types, description, photos)
Lifecycle: DRAFT → PUBLISHED → COMPLETED / CANCELLED
Delete only before publication or first booking
Cancellation preserves booking history for traceability
Capacity validation at both frontend (real-time indicator) and backend (hard check)

Booking System

Multiple ticket types per event with individual availability tracking
Real-time availability updates after each booking
Confirmation modal with warning that bookings are non-refundable
Backend enforces capacity and availability constraints

OpenStreetMap Integration

Every event detail page shows an interactive map
If geo-coordinates are provided, the map pins the exact location
If not, the app auto-geocodes using the Nominatim API from venue name, city, and country as fallback chain

Messaging System

Inbox and sent folders with soft-delete (each party deletes independently)
Unread message badge in the navbar polling every 30 seconds
Reply, delete, and compose from any page
Bulk notification to all bookers when an event is cancelled

Recommendation System (BMF)
Implemented entirely from scratch in TypeScript without any external ML library:

Biased Matrix Factorization with 10 latent factors
Per-user and per-event bias terms plus global bias
SGD optimization (learning rate 0.01, regularization 0.02, 20 epochs)
Trains on 4,273 ratings from the provided dataset on server startup (~2 seconds)
Cold start: falls back to event view history if no booking history, then to global popularity
Top-6 recommendations displayed on the home page

Admin Data Export

XML export fully compliant with the DTD specification from the assignment
JSON export with all events, bookings, ticket types, and organizer info


Testing
39 unit tests across 3 suites with ~95%+ coverage on critical services:
bashcd backend
npm test           # run all tests
npm run test:cov   # run with coverage report
Test suites:

bookings.service.spec.ts — capacity validation, availability checks, booking creation
auth.service.spec.ts — registration, duplicate detection, login, JWT signing, password hashing
bmf.spec.ts — model training, prediction accuracy, cold start, top-N ranking


Local Development
Prerequisites

Node.js v20+
PostgreSQL 15+
npm v10+

Step 1 — Clone the repo
bashgit clone https://github.com/Adam-Shawky23/event-flow.git
cd event-flow
Step 2 — Configure the backend
Create backend/.env:
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/eventflow"
JWT_SECRET="eventflow-secret-2026"
JWT_EXPIRES_IN="7d"
PORT=3000
FRONTEND_URL="http://localhost:5173"
Update backend/prisma.config.ts:
typescriptimport 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL ?? 'postgresql://postgres:@localhost:5432/eventflow',
  },
});
Step 3 — Set up the database
bashpsql -U postgres -c "CREATE DATABASE eventflow;"
cd backend
npm install
npx prisma migrate dev --name init
npx prisma generate
npx tsx src/prisma/seed.ts
Step 4 — Add the recommendation dataset
Copy event_interest.csv (from the university e-class) to the backend/ folder.
Step 5 — Start the backend
bashcd backend
npm run start:dev
Backend runs on: http://localhost:3000
Step 6 — Start the frontend
bashcd frontend
npm install
npm run dev
Frontend runs on: http://localhost:5173

Project Structure
event-flow/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema
│   │   └── migrations/          # SQL migrations
│   ├── src/
│   │   ├── auth/                # JWT auth, register, login
│   │   ├── users/               # User management
│   │   ├── events/              # Events + photo upload
│   │   ├── bookings/            # Booking creation + validation
│   │   ├── messages/            # Inbox/sent messaging
│   │   ├── export/              # XML + JSON export
│   │   ├── recommendations/     # BMF algorithm + service
│   │   └── prisma/              # PrismaService + seed
│   ├── uploads/                 # Uploaded event photos
│   └── prisma.config.ts
├── frontend/
│   └── src/
│       ├── pages/               # All 11 pages
│       ├── components/          # Navbar
│       ├── context/             # AuthContext (JWT)
│       ├── hooks/               # useIsMobile
│       ├── api/                 # Axios instance
│       └── types/               # TypeScript interfaces
└── .github/
    └── workflows/
        └── backend-tests.yml    # CI pipeline

API Endpoints
MethodPathAuthDescriptionPOST/api/auth/registerPublicRegister new userPOST/api/auth/loginPublicLogin, returns JWTGET/api/usersAdminList all usersPATCH/api/users/:id/approveAdminApprove userPATCH/api/users/:id/rejectAdminReject userPATCH/api/users/:id/roleAdminChange user roleGET/api/eventsPublicBrowse events with filtersGET/api/events/myOrganizerMy eventsPOST/api/eventsOrganizerCreate eventPATCH/api/events/:id/publishOrganizerPublish eventPATCH/api/events/:id/cancelOrganizerCancel eventPOST/api/bookingsAuthenticatedCreate bookingGET/api/bookings/event/:idOrganizerEvent bookingsGET/api/messages/inboxAuthenticatedInboxGET/api/messages/sentAuthenticatedSent messagesPOST/api/messages/notify-cancellation/:idOrganizerNotify all bookersGET/api/export/jsonAdminExport JSONGET/api/export/xmlAdminExport XMLGET/api/recommendationsAuthenticatedBMF recommendations

Deployment
ServicePlatformURLFrontendNetlifyhttps://6a3e5f46e33e3309179ead47--eventflowfg.netlify.appBackendRenderhttps://event-flow-lq63.onrender.comDatabaseSupabasePostgreSQL (eu-west-1)
Notes:

SSL/TLS is handled by Netlify and Render in production
The free Render tier spins down after 15 minutes of inactivity — the first request after idle may take ~30 seconds to wake up
Event photos are stored on Render's ephemeral filesystem and will not persist across deploys; a CDN like Cloudinary is recommended for production


Known Limitations

Photo uploads do not persist on Render's free tier (ephemeral filesystem)
The BMF recommendation dataset (event_interest.csv) is not included in the repository due to GitHub's 100MB file size limit — recommendations fall back to popularity-based ranking on the deployed version
JWT is stored in localStorage; httpOnly cookies would be more secure in a production environment


Adam Ahmed — 1115202400225 | Web Application Technologies — June 2026
