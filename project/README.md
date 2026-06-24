# AAR GLOBE Business Management System

AAR GLOBE is a single-shop business management system for a mobile repairing center, mobile accessories store, and online/digital services center. It is not SaaS and it does not use online payment. The customer website is fully controlled from the admin dashboard.

## Features

- Admin login and password change
- Company/brand management
- Product management grouped by company
- Repair and online service management
- Customer request/enquiry system
- Settings-driven website content
- Image upload for company logos and product images
- Analytics dashboard with date filters
- Demo seed script
- API test suite

## Tech Stack

- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: Node.js, Express
- Database: MongoDB, Mongoose
- Auth: JWT, bcryptjs
- Uploads: multer with local development storage and Cloudinary production storage
- Tests: Jest, Supertest, mongodb-memory-server
- Security: Helmet, rate limiting, mongo sanitize, express-validator

## Folder Structure

```text
project
|-- backend
|   |-- config
|   |-- controllers
|   |-- middleware
|   |-- models
|   |-- routes
|   |-- scripts
|   |-- uploads
|   |-- __tests__
|   |-- server.js
|   `-- package.json
|-- frontend
|   |-- admin
|   |-- index.html
|   |-- style.css
|   `-- script.js
|-- project_overview.md
`-- README.md
```

## Environment Variables

Create `backend/.env`:

```env
PORT=5000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret
JWT_EXPIRES_IN=8h
ADMIN_EMAIL=infoaarglobe@gmail.com
ADMIN_PASSWORD=Aarglobe@2026
UPLOAD_STORAGE=local
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
EMAIL_USER=
EMAIL_PASS=
```

Use `UPLOAD_STORAGE=local` for development. Use `UPLOAD_STORAGE=cloudinary` in production with valid Cloudinary credentials. MongoDB stores the public image path in local mode and the Cloudinary `secure_url` in production mode.

## Start Locally

Recommended:

```text
Double-click E:\AARGLOBE\Start Server.bat
```

Manual:

```powershell
cd E:\AARGLOBE\project\backend
npm install
npm run dev
```

Open:

```text
http://localhost:5000
http://localhost:5000/admin/
```

## Admin Login

On first login, a bootstrap admin is created if no admin exists and the credentials match:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Fallback credentials if env values are not set:

- Email: `infoaarglobe@gmail.com`
- Password: `Aarglobe@2026`

Change the password from the admin dashboard after first login.

## Seed Demo Data

Run once on an empty database:

```powershell
cd E:\AARGLOBE\project\backend
npm run seed
```

The seed script creates default companies, sample products, repair services, online services, settings, and a bootstrap admin when missing.

## Image Uploads

Admin can upload and preview:

- Company logo
- Product image

Rules:

- Allowed: jpg, jpeg, png, webp
- Max size: 5 MB
- Development mode stores files in `backend/uploads` and serves them from `/uploads/...`
- Production mode uploads to Cloudinary and stores the returned `secure_url`
- Replacing an image deletes the old local upload or old Cloudinary asset when it is managed by the app

Default placeholders or external URLs are not deleted.

## API Summary

Base URL:

```text
http://localhost:5000/api
```

Auth:

- `POST /admin/login`
- `PUT /admin/change-password`

Companies:

- `GET /companies`
- `POST /companies`
- `PUT /companies/:id`
- `DELETE /companies/:id`

Products:

- `GET /products/public`
- `GET /products`
- `POST /products`
- `PUT /products/:id`
- `DELETE /products/:id`

Services:

- `GET /services/public`
- `GET /services`
- `POST /services`
- `PUT /services/:id`
- `DELETE /services/:id`

Requests:

- `POST /orders/request-order`
- `GET /orders`
- `PATCH /orders/:id/status`

Settings:

- `GET /settings`
- `PUT /settings`

Analytics:

- `GET /analytics?range=today`
- `GET /analytics?range=7d`
- `GET /analytics?range=30d`
- `GET /analytics?range=all`

Uploads:

- `POST /upload/company-logo`
- `POST /upload/product-image`

## Tests

```powershell
cd E:\AARGLOBE\project\backend
npm test
```

The test suite uses `mongodb-memory-server`, which needs access to a MongoDB binary. In CI or locked-down networks, allow access to `fastdl.mongodb.org` or provide a cached binary.

## Deployment Notes

- Set `NODE_ENV=production`.
- Use a strong `JWT_SECRET`.
- Use MongoDB Atlas or another production MongoDB connection string.
- Keep `backend/.env` private.
- Set `UPLOAD_STORAGE=cloudinary` for Render, Railway, VPS, or custom-domain deployments.
- Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`.
- Local uploads are for development only; they are not reliable across redeployments or scaling.
- Run tests in CI before deployment.
- Use HTTPS and configure `ALLOWED_ORIGINS` for the deployed domain, such as `https://aarglobe.in` or `https://aarglobe.com`.
