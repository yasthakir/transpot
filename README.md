# SinghRJ Transport Frontend

Static multi-page frontend for SinghRJ Transport. The Express/MongoDB API is maintained separately in [yasthakir/transpot-backend](https://github.com/yasthakir/transpot-backend).

## Run locally

1. Install frontend dependencies with `npm ci`.
2. Clone and configure [the backend repository](https://github.com/yasthakir/transpot-backend) separately; start it on port 3000.
3. Start the frontend with `npm run dev`. Vite proxies `/api` requests to the local backend.

## Deploy frontend to Vercel and API to Render

The frontend deployment file is `vercel.json`; the backend repository contains the Render Blueprint. The browser continues to call same-origin `/api` URLs; Vercel proxies those requests to Render. This also keeps the admin session cookie same-origin.

1. Import `yasthakir/transpot` into Vercel. Use the repository root, `npm run build`, and `dist` as the output directory; these are set in `vercel.json`.
2. Create a Render Blueprint from `yasthakir/transpot-backend`. Configure its `MONGODB_URI`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, and `JWT_SECRET` secrets as described in that repository's README.
3. Confirm Render's service URL is `https://singhrj-transport-api.onrender.com`. If Render assigns a different URL, update the destination in `vercel.json`.
4. In MongoDB Atlas, allow the Render service's outbound IP ranges and grant its database user access to the application database. Avoid allowing all IP addresses unless you have deliberately accepted that risk.
5. After both services deploy, check `https://singhrj-transport-api.onrender.com/api/health`, then test quote/contact submissions and `/admin.html` on the Vercel domain.

## Security

- Keep Vercel's `/api` rewrite pointed at the Render service so admin cookies remain same-origin.
