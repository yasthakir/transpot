# SinghRJ Transport

Static multi-page frontend, Express API, MongoDB Atlas storage, and admin dashboard.

## Run locally

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env` and set `MONGODB_URI`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, and `JWT_SECRET`. Keep `.env` private.
3. Start the API with `npm run api`.
4. In another terminal, start the frontend with `npm run dev`. Vite proxies `/api` requests to the local API on port 3000.

To generate an admin password hash locally, run:

```powershell
$securePassword = Read-Host "Admin password" -AsSecureString
$env:ADMIN_PASSWORD = [System.Net.NetworkCredential]::new('', $securePassword).Password
node --input-type=module -e "import bcrypt from 'bcryptjs'; console.log(await bcrypt.hash(process.env.ADMIN_PASSWORD, 12))"
Remove-Item Env:ADMIN_PASSWORD
Remove-Variable securePassword
```

Use the printed hash as `ADMIN_PASSWORD_HASH`; never commit the password or hash.

## Deploy frontend to Vercel and API to Render

The deployment files are `vercel.json` and `render.yaml`. The browser continues to call same-origin `/api` URLs; Vercel proxies those requests to Render. This also keeps the admin session cookie same-origin.

1. Push the repository to GitHub and connect the same repository and `main` branch to both Vercel and Render.
2. In Render, create a Blueprint from the repository. It creates the `singhrj-transport-api` web service with `npm ci`, `npm start`, and `/api/health` as its health check. Set the Blueprint's `MONGODB_URI`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, and `JWT_SECRET` secrets when prompted. Use a URL-encoded Atlas database password and a random `JWT_SECRET` of at least 32 characters.
3. In MongoDB Atlas, allow the Render service's outbound IP ranges in Network Access and grant its database user access to the application database. Do not expose the database to all IP addresses unless you have deliberately accepted that risk.
4. Confirm Render's service URL is `https://singhrj-transport-api.onrender.com`. If Render assigns a different URL, update the destination in `vercel.json` to that service's `/api/$1` URL and push the change.
5. Import the same GitHub repository into Vercel. Use the repository root, `npm run build`, and `dist` as the output directory; these are also set in `vercel.json`. No frontend API URL or CORS environment variable is needed.
6. After both services deploy, check `https://singhrj-transport-api.onrender.com/api/health`, then test quote/contact submissions and `/admin.html` on the Vercel domain.

The Render Blueprint uses the free plan, which may spin down while idle and cause a cold start on the next request. Choose a paid Render plan if the API must remain continuously warm. The backend reads its port from Render's `PORT` environment variable.

## Security

- Never commit `.env`, MongoDB credentials, admin passwords, password hashes, or `JWT_SECRET`.
- Use a dedicated MongoDB database user with only the permissions the app needs.
- Keep Vercel's `/api` rewrite pointed at the Render service so admin cookies remain same-origin.
