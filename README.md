# NUK RentServe — Frontend + Backend Integration

This archive contains `NUKFrontend-main` (plain HTML/CSS/JavaScript) and `NUKBackend-main` (Node.js, Express, MongoDB/Mongoose).

## Features in this revision
- Customer registration includes a visible supported-city dropdown and customer/property-owner account type.
- Property-owner accounts log in to Owner Dashboard; customer accounts can also open Owner Dashboard to list a house, room, shop, or PG.
- Rental detail pages let signed-in customers send booking requests. Owners can accept or reject requests from Owner Dashboard. This is a request workflow only; no payment is taken.
- Service-provider registration accepts one Aadhaar document file only (JPG, PNG, or PDF, max 5 MB). The form does not ask for an Aadhaar number and does not perform automated Aadhaar/e-KYC verification.
- Aadhaar uploads use authenticated/private Cloudinary storage; only a private asset reference is saved in MongoDB. Admin sees whether a document was uploaded, not a public file URL.

## Run locally
1. Extract this ZIP.
2. Open `NUKBackend-main` in VS Code.
3. Copy `.env.example` to `.env` and configure `MONGODB_URI`, strong JWT secrets, and `CLIENT_ORIGIN`.
4. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` to enable private Aadhaar uploads and listing image uploads. Provider registration file upload returns an error until these are configured.
5. Run `npm install`, then `npm run dev` in the backend directory.
6. Check `http://localhost:5000/api/v1/health`.
7. Open `NUKFrontend-main` with VS Code Live Server. The default API base is `http://localhost:5000/api/v1`.

## Important notes
- Do not commit `.env`, Aadhaar files, API secrets, or passwords to GitHub.
- Use HTTPS in production and configure `CLIENT_ORIGIN` to your actual deployed frontend origin.
- An Aadhaar document upload is sensitive personal information. Collect it only with clear consent, restrict access, define a deletion/retention policy, and never expose its URL on public listings. This implementation stores it as an authenticated Cloudinary asset but does not implement UIDAI-based verification.
- Booking requests are not confirmed bookings until the owner accepts them, and no payment processing is included.
- JavaScript syntax checks passed for the frontend and backend files. MongoDB/Cloudinary live integration has not been tested in this environment.

## Local integration and provider access rules

- Frontend folder: `NUKFrontend-react`; backend folder: `NUKBackend-main`.
- Backend local API: `http://localhost:5000/api/v1`.
- Frontend local development URL is normally `http://localhost:5173`; if Vite selects `5174`, that origin is also allowed by backend CORS configuration.
- Copy `NUKBackend-main/.env.example` to `NUKBackend-main/.env` and fill in a MongoDB connection URI for a dedicated `nuk_rentserve` database, strong separate JWT secrets, and Cloudinary credentials. Do not commit `.env`.
- Copy `NUKFrontend-react/.env.example` to `NUKFrontend-react/.env` for local API configuration.
- Start the backend from `NUKBackend-main` with `npm install` and `npm run dev`.
- Start the frontend from `NUKFrontend-react` with `npm install` and `npm run dev`.
- Providers have exactly two frontend destinations: **Provider Dashboard** and **Contact Support**. Public/customer pages redirect provider accounts to the provider dashboard. Admin/customer routes remain protected by role-aware route guards.
- Provider support tickets persist through `/api/v1/support`; authorized admins can review and update them. Transport requests persist through `/api/v1/transport-bookings`; matching approved providers see requests in their dashboard, which refreshes every 30 seconds.
- Transport and support integration added in this update must be tested against your actual MongoDB and Cloudinary configuration before production use. No live database credentials are included in this archive.
