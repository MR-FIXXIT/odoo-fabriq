# Manufacturing React Frontend (Frontend-only)

This archive contains a production-oriented React frontend scaffold for a Manufacturing Management App.
It is backend-agnostic and includes a small in-memory mock server so you can iterate UI flows without a backend.
When you're ready to plug in Django, replace the mock APIs (src/lib/mockServer.js) with real Axios calls to your Django REST endpoints.

Quick start:

1. Install Node 18+ and npm.
2. Extract the zip and `cd` into the folder.
3. Run `npm install`.
4. Start dev server with `npm run dev`.
5. Open http://localhost:5173 (or the port Vite reports).

Next steps to connect a backend:
- Replace functions in `src/api/*.js` to call your real endpoints (use `src/lib/api.js` axios instance).
- Update `src/contexts/AuthContext.jsx` to call your authentication endpoint and store tokens securely (httpOnly cookies recommended).

