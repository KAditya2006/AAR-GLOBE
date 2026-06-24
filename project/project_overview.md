# AAR GLOBE - Complete Project Overview

> **Current status:** A single-shop AAR GLOBE business management system. This is not SaaS and not multi-tenant. Online payment is removed. All customer-facing products, services, brands, requests, and business settings are controlled from the admin dashboard.
>
> **Customer site:** `http://localhost:5000`
>
> **Admin dashboard:** `http://localhost:5000/admin/`
>
> **Workspace:** `E:\AARGLOBE\project`
>
> **Updated:** June 23, 2026

---

## 1. Final Business Flow

```text
Admin logs in
  -> manages companies/brands
  -> manages products under companies
  -> manages repair and online services
  -> manages shop settings and website content
  -> customer browses API-driven website
  -> customer sends request/enquiry
  -> request saves in MongoDB
  -> admin updates status and notes
```

There is one business only: AAR GLOBE.

Removed from active architecture:

- Multi-tenant shops
- Shop owner registration
- Subscription plans
- `shopId` routing
- `userId` tenant ownership logic
- Razorpay / online payment flow

---

## 2. Folder Structure

```text
E:\AARGLOBE
|-- Start Server.bat
`-- project
    |-- README.md
    |-- project_overview.md
    |-- backend
    |   |-- server.js
    |   |-- package.json
    |   |-- package-lock.json
    |   |-- .env
    |   |-- config
    |   |   |-- cloudinary.js
    |   |   `-- db.js
    |   |-- controllers
    |   |   |-- adminController.js
    |   |   |-- analyticsController.js
    |   |   |-- bannerController.js
    |   |   |-- companyController.js
    |   |   |-- orderController.js
    |   |   |-- productController.js
    |   |   |-- serviceController.js
    |   |   |-- settingsController.js
    |   |   `-- uploadController.js
    |   |-- middleware
    |   |   |-- auth.js
    |   |   |-- errorHandler.js
    |   |   |-- upload.js
    |   |   `-- validate.js
    |   |-- models
    |   |   |-- Admin.js
    |   |   |-- Banner.js
    |   |   |-- Company.js
    |   |   |-- Notification.js
    |   |   |-- Order.js
    |   |   |-- Product.js
    |   |   |-- Service.js
    |   |   `-- Settings.js
    |   |-- routes
    |       |-- adminRoutes.js
    |       |-- analyticsRoutes.js
    |       |-- bannerRoutes.js
    |       |-- companyRoutes.js
    |       |-- orderRoutes.js
    |       |-- productRoutes.js
    |       |-- serviceRoutes.js
    |       |-- settingsRoutes.js
    |       `-- uploadRoutes.js
    |   |-- uploads
    |   |   `-- .gitkeep
    |   |-- scripts
    |   |   `-- seedDemo.js
    |   `-- __tests__
    |       `-- api.test.js
    |-- frontend
    |   |-- index.html
    |   |-- style.css
    |   |-- script.js
    |   `-- admin
    |       |-- index.html
    |       |-- style.css
    |       `-- script.js
    `-- node-env
        `-- node-v20.11.0-win-x64
|-- .github
|   `-- workflows
|       `-- tests.yml
```

---

## 3. Tech Stack

| Area | Technology |
|---|---|
| Frontend | HTML, CSS, Vanilla JavaScript |
| Backend | Node.js, Express |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcryptjs |
| Security | Helmet, Express Rate Limit, Mongo Sanitize |
| Validation | express-validator |
| Uploads | multer, Cloudinary |
| Admin UI | Vanilla JavaScript dashboard |
| Tests | Jest, Supertest, mongodb-memory-server |
| Runtime | Portable Node.js v20.11.0 |

---

## 4. Database Collections

Current intended collections:

- `Admin`
- `Banner`
- `Company`
- `Product`
- `Service`
- `Order`
- `Notification`
- `Settings`

### Admin

File: `backend/models/Admin.js`

Fields:

- `email`
- `password`
- `name`
- `createdAt`

Admin login endpoint auto-creates a bootstrap admin only when no admin exists and credentials match:

- `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`, or
- fallback `admin@aarglobe.local` / `admin123`

Current local bootstrap credentials:

- Email: `infoaarglobe@gmail.com`
- Password: `Aarglobe@2026`

### Banner

File: `backend/models/Banner.js`

Fields:

- `image`
- `title`
- `subtitle`
- `isActive`
- `createdAt`

Rules:

- Banners are managed from the admin dashboard.
- Banner images use the existing upload validation and storage system.
- Public website loads only active banners.
- Replacing or deleting a banner removes the old stored image through the upload storage cleanup utility.

### Company

File: `backend/models/Company.js`

Fields:

- `name`
- `nameKey`
- `logo`
- `isActive`
- `createdAt`

Rules:

- Companies are parent categories for products.
- Company names are required, trimmed, and unique.
- `nameKey` stores the normalized lowercase name for duplicate protection.
- Companies are not physically deleted by the API.
- `DELETE /api/companies/:id` disables the company by setting `isActive: false`.
- Company list includes:
  - `productCount`
  - `totalProducts`
  - `availableProducts`
  - `bestSellers`
- Companies with zero products still remain visible in the admin company list.

### Product

File: `backend/models/Product.js`

Fields:

- `companyId`
- `name`
- `category`
- `price`
- `image`
- `description`
- `isAvailable`
- `isBestSeller`
- `createdAt`

Rules:

- Products reference `companyId`.
- Product does not store company name directly.
- Public products only show when product is available and company is active.
- Product APIs populate `companyId` for display, but the product document stores only the company reference.
- Product listings sort companies alphabetically and products alphabetically inside each company.

### Service

File: `backend/models/Service.js`

Fields:

- `name`
- `type`: `repair` or `online`
- `price`
- `description`
- `isAvailable`
- `createdAt`

### Order / Request

File: `backend/models/Order.js`

Fields:

- `customerName`
- `customerPhone`
- `type`: `product`, `repair`, or `service`
- `item`
- `amount`
- `message`
- `status`: `New`, `Contacted`, `Confirmed`, `Completed`, `Cancelled`
- `leadStatus`: `New`, `Contacted`, `Qualified`, `Converted`, `Closed`
- `notes`
- `lastContactDate`
- `nextFollowUpDate`
- `followUpNotes`
- `createdAt`

### Notification

File: `backend/models/Notification.js`

Fields:

- `requestId`
- `notificationType`
- `type`
- `message`
- `sentAt`
- `createdAt`

Rules:

- A `Request Received` notification is created automatically when a customer submits a request.
- WhatsApp-ready notification messages are generated from request status templates.
- Admin WhatsApp actions create notification history records before opening WhatsApp.
- Notification history is returned with admin request records.

### Settings

File: `backend/models/Settings.js`

Fields:

- `shopName`
- `phoneNumber`
- `whatsappNumber`
- `address`
- `heroTitle`
- `heroSubtitle`
- `offerBanner`
- `themeColor`
- `footerInformation`
- `metaTitle`
- `metaDescription`
- `keywords`
- `googleSiteVerification`
- `updatedAt`

---

## 5. API Inventory

Base URL:

```text
http://localhost:5000/api
```

### Auth

| Method | Route | Access | Purpose |
|---|---|---|---|
| `POST` | `/admin/login` | Public | Admin login with email/password |
| `PUT` | `/admin/change-password` | Protected | Change admin password after verifying current password |

### Companies

| Method | Route | Access | Purpose |
|---|---|---|---|
| `GET` | `/companies` | Public | List companies with logo, status, and product stats |
| `POST` | `/companies` | Protected | Add company with required unique name |
| `PUT` | `/companies/:id` | Protected | Edit company with duplicate-name validation |
| `DELETE` | `/companies/:id` | Protected | Disable company without physical deletion |

### Banners

| Method | Route | Access | Purpose |
|---|---|---|---|
| `GET` | `/banners?active=true` | Public | List active homepage banners |
| `GET` | `/banners` | Public | List all banners for admin rendering |
| `POST` | `/banners` | Protected | Add homepage banner |
| `PUT` | `/banners/:id` | Protected | Edit homepage banner |
| `DELETE` | `/banners/:id` | Protected | Delete banner and clean stored image |

### Products

| Method | Route | Access | Purpose |
|---|---|---|---|
| `GET` | `/products/public` | Public | List available products grouped by active companies on frontend |
| `GET` | `/products` | Protected | Admin product list |
| `POST` | `/products` | Protected | Add product |
| `PUT` | `/products/:id` | Protected | Edit product |
| `DELETE` | `/products/:id` | Protected | Delete product |

### Services

| Method | Route | Access | Purpose |
|---|---|---|---|
| `GET` | `/services/public` | Public | List available services |
| `GET` | `/services` | Protected | Admin service list |
| `POST` | `/services` | Protected | Add service |
| `PUT` | `/services/:id` | Protected | Edit service |
| `DELETE` | `/services/:id` | Protected | Delete service |

### Requests

| Method | Route | Access | Purpose |
|---|---|---|---|
| `POST` | `/orders/request-order` | Public | Customer sends request |
| `GET` | `/orders` | Protected | Admin request list |
| `PATCH` | `/orders/:id/status` | Protected | Update status and notes |
| `PATCH` | `/orders/:id/contacted` | Protected | Mark request as contacted and set last contact date |
| `PATCH` | `/orders/:id/follow-up` | Protected | Schedule next follow-up and save follow-up notes |
| `POST` | `/orders/:id/notifications/whatsapp` | Protected | Create notification history and return WhatsApp URL |

### Settings

| Method | Route | Access | Purpose |
|---|---|---|---|
| `GET` | `/settings` | Public | Frontend loads business content |
| `PUT` | `/settings` | Protected | Admin updates business content |

### SEO Files

| Method | Route | Access | Purpose |
|---|---|---|---|
| `GET` | `/robots.txt` | Public | Generate robots file with sitemap link |
| `GET` | `/sitemap.xml` | Public | Generate XML sitemap for the website root |

### Analytics

| Method | Route | Access | Purpose |
|---|---|---|---|
| `GET` | `/analytics?range=today` | Protected | Dashboard cards and request breakdowns for today |
| `GET` | `/analytics?range=7d` | Protected | Dashboard cards and request breakdowns for last 7 days |
| `GET` | `/analytics?range=30d` | Protected | Dashboard cards and request breakdowns for last 30 days |
| `GET` | `/analytics?range=all` | Protected | Dashboard cards and request breakdowns for all time |
| `GET` | `/analytics/export/requests?format=csv&range=all` | Protected | Export request contact list as CSV |
| `GET` | `/analytics/export/requests?format=excel&range=all` | Protected | Export request contact list as Excel-compatible file |

### Uploads

| Method | Route | Access | Purpose |
|---|---|---|---|
| `POST` | `/upload/company-logo` | Protected | Upload company logo image |
| `POST` | `/upload/product-image` | Protected | Upload product image |
| `POST` | `/upload/banner-image` | Protected | Upload homepage banner image |

---

## 6. Customer Website Behavior

Files:

- `frontend/index.html`
- `frontend/style.css`
- `frontend/script.js`

Customer website sections:

- Hero
- Dynamic homepage banners
- Brands
- Products
- Repair Services
- Online Services
- Contact
- Request Modal

Data sources:

- Settings: `GET /api/settings`
- Banners: `GET /api/banners?active=true`
- Companies: `GET /api/companies?active=true`
- Products: `GET /api/products/public`
- Services: `GET /api/services/public`
- Requests: `POST /api/orders/request-order`

Rules:

- No hardcoded product data.
- No hardcoded service data.
- No hardcoded company list.
- Products are grouped by company.
- Company name appears once per product group.
- Companies sort alphabetically.
- Products sort alphabetically within each company.
- Customer product filters are available:
  - search by product name, category, description, or company
  - filter by company
  - filter by category
  - clear filters
- Brands section loads companies dynamically and displays:
  - logo
  - company name
- Repair and online services are grouped separately.
- Customer service filters are available:
  - search repair services
  - search digital services
  - clear service filters
- Customer action labels:
  - Product: `Request Order`
  - Repair: `Book Service`
  - Online: `Send Enquiry`
- Clicking a product, repair service, or digital service card opens a details modal.
- Details modal shows name, description, price, status, product category/company when available, image/icon, and a request CTA.
- Details cards are keyboard accessible with `Enter` and `Space`.
- SEO metadata is loaded from Settings:
  - meta title
  - meta description
  - keywords
  - Google Search Console verification

Request form fields:

- Customer Name
- Customer Phone
- Message

### Customer UI and Responsive Design

Completed frontend design state:

- Premium Liquid Glass visual style applied to the customer website.
- Official AAR GLOBE brand palette is applied:
  - Primary Orange: `#ff1e00`
  - Background Blue: `#e8f9fd`
  - Success Green: `#59ce8f`
  - Dark Text: `#0f172a`
  - Secondary Text: `#475569`
  - White: `#ffffff`
- Dark cyberpunk styling has been removed from the active customer design.
- Customer background has been replaced with a clean modern business gradient:
  - `linear-gradient(135deg, #e8f9fd, #ffffff, #dff7ff)`
- Customer background uses:
  - floating blurred orange glow
  - soft blue glow
  - subtle glass depth layers
  - subtle animated gradient movement
  - reduced-motion fallback for accessibility
- Header, hero content, cards, request modal, mobile menu, contact panels, and footer use frosted glass styling:
  - `rgba(255,255,255,0.65)` style translucent panels
  - `backdrop-filter: blur(20px)`
  - subtle white borders
  - soft depth shadows and glow accents
- Primary buttons use `#ff1e00` with `#e01900` hover.
- Product cards use white glass cards, orange CTA buttons, and green availability/success styling.
- Hover lift effects and smooth transitions are applied to interactive cards and buttons.
- Customer website remains responsive across mobile, tablet, laptop, and desktop breakpoints.
- No backend logic was changed for the UI redesign.
- Current active UI style is skeuomorphism:
  - raised tactile cards and panels
  - inset form fields and filter controls
  - beveled orange buttons with pressed states
  - soft physical shadows and highlight edges
  - skeuomorphic product/service cards, details modal, filters, navbar, and footer
- Earlier Liquid Glass/brand redesign work remains documented, but the latest active visual layer is skeuomorphic.

---

## 7. Admin Dashboard Behavior

Files:

- `frontend/admin/index.html`
- `frontend/admin/style.css`
- `frontend/admin/script.js`

Sections:

1. Dashboard
2. Companies
3. Banners
4. Products
5. Services
6. Requests
7. Settings
8. Analytics
9. Password

Dashboard shortcuts:

- Dashboard analytics cards are full clickable buttons.
- Total Companies opens Companies.
- Total Products opens Products.
- Total Services opens Services.
- Request, lead, contact, follow-up, and completed cards open Requests.
- Conversion Rate opens Analytics.

### Companies Module

Admin can:

- Add company
- Edit company
- Upload, preview, and replace company logo
- Enable/disable company
- View status: Active or Inactive
- View company stats:
  - Total Products
  - Available Products
  - Best Sellers
- Companies with zero products remain visible.

### Products Module

Admin can:

- Add product
- Edit product
- Delete product
- Choose company from a searchable database-backed dropdown
- Change category
- Change price
- Upload, preview, and replace product image
- Add description
- Enable/disable availability
- Mark as best seller
- Product list groups rows by company.
- Company groups and product rows sort alphabetically.
- Product payload stores only `companyId`, never duplicate company name.
- Product create/update validates that `companyId` is a valid active company.
- If product availability is missing during create, backend defaults `isAvailable` to `true`.
- Public product API returns only products where:
  - `isAvailable = true`
  - linked company has `isActive = true`

### Banners Module

Admin can:

- Add banner
- Edit banner
- Delete banner
- Upload banner image
- Preview banner image
- Activate/deactivate banner

Public website:

- Loads active banners dynamically.
- Renders banners as a homepage slider/carousel.

### Admin UI and Responsive Design

Completed admin design state:

- Premium Liquid Glass admin dashboard styling is applied.
- Admin dashboard uses the official AAR GLOBE brand palette.
- Dark cyberpunk dashboard styling has been removed from the active admin design.
- Admin dashboard background uses:
  - `linear-gradient(135deg, #e8f9fd, #ffffff)`
  - white glass panels
  - orange active navigation state
  - green success indicators
  - floating blurred glass depth layers
  - subtle animated gradient movement
  - reduced-motion fallback for accessibility
- Login page has a full-screen premium bright animated gradient background.
- Login page includes floating glass shapes, glow effects, and a centered frosted glass login card.
- Sidebar, topbar, dashboard cards, forms, tables, company cards, chart panels, and toast notifications use frosted glass styling.
- Glass cards use `rgba(255,255,255,0.65)`, `backdrop-filter: blur(20px)`, `1px solid rgba(255,255,255,0.4)`, and `0 8px 30px rgba(0,0,0,0.08)`.
- Admin tables support responsive mobile card-style labels where needed.
- Admin dashboard keeps existing backend behavior unchanged.
- Current active admin UI style is skeuomorphism:
  - raised dashboard cards
  - inset form fields
  - beveled buttons with pressed states
  - tactile sidebar active states
  - skeuomorphic tables, company cards, analytics cards, login card, and toast notifications

### Services Module

Admin can:

- Add service
- Edit service
- Delete service
- Choose type: repair or online
- Change price
- Add description
- Enable/disable availability

### Requests Module

Table columns:

- Customer Name
- Phone
- Item
- Status
- Last Contact
- Next Follow Up
- Actions

Features:

- Search by customer name or phone
- Filter by request type
- Filter by status
- Update status
- Edit status notes
- Add follow-up notes
- Mark contacted, which updates status and last contact date
- Schedule next follow-up date
- Contact customer on WhatsApp with a prefilled AAR GLOBE message
- Send WhatsApp-ready notification using the current request status template
- View notification history for each request
- Update lead status:
  - New
  - Contacted
  - Qualified
  - Converted
  - Closed

### Settings Module

Admin can update:

- Shop Name
- Phone Number
- WhatsApp Number
- Address
- Hero Title
- Hero Subtitle
- Offer Banner
- Theme Color
- Footer Information
- Meta Title
- Meta Description
- Keywords
- Google Search Console Verification

### Password Module

Admin can:

- Change password from the dashboard.
- Enter current password.
- Enter new password.
- Confirm new password.

Rules:

- Current password must be verified.
- New password and confirm password must match.
- New password must be at least 8 characters.
- New password must include lowercase, uppercase, and number characters.

### Analytics Module

Dashboard cards:

- Total Companies
- Total Products
- Total Services
- Total Requests
- New Requests
- Total Follow-ups
- Total Contacted
- Total Confirmed
- Completed Requests
- Total Leads
- Converted Leads
- Conversion Rate

Breakdowns:

- Requests by type
- Requests by status
- Most requested items

Responsive canvas charts:

- Requests by Status
- Requests by Type
- Most Requested Products
- Most Requested Services

Date filters:

- Today
- Last 7 Days
- Last 30 Days
- All Time

Exports:

- Export Requests CSV
- Export Requests Excel
- Export columns: Customer, Phone, Item, Status, Date

Notification templates:

- Request Received: `Thank you for contacting AAR GLOBE. Your request has been received.`
- Contacted: `Our team has reviewed your request and will contact you shortly.`
- Confirmed: `Your request has been confirmed.`
- Completed: `Your request/service has been completed.`

---

## 8. Image Upload System

Implemented for:

- Company logo
- Product image

Admin behavior:

- Upload image from dashboard.
- Preview selected image before saving.
- Replace existing image by selecting a new file.
- Store uploaded image path or Cloudinary `secure_url` in MongoDB.
- Development mode serves uploaded files from `/uploads/...`.
- Production mode uploads images to Cloudinary and displays Cloudinary URLs.
- Delete old local uploaded image or old Cloudinary asset when replacing a company logo or product image.
- Only delete files inside `/uploads` or Cloudinary assets recognized as app-managed image URLs.
- Missing old files are ignored safely.
- External URLs and placeholders are not deleted.

Validation:

- Allowed file types: `jpg`, `jpeg`, `png`, `webp`
- MIME type and file extension are checked.
- Maximum file size: 5 MB

Storage plan:

- Development mode: local filesystem storage in `backend/uploads`.
- Production mode: Cloudinary storage with permanent `secure_url` values.
- Config flags: `UPLOAD_STORAGE=local` or `UPLOAD_STORAGE=cloudinary`.
- Cloudinary credentials: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- In Cloudinary mode, multer stages the validated file locally, the backend uploads it to Cloudinary, then the temporary local file is removed.
- If Cloudinary upload fails, the API returns an upload error and existing MongoDB image values are not overwritten.

Backend files:

- `backend/config/cloudinary.js`
- `backend/middleware/upload.js`
- `backend/utils/uploadStorage.js`
- `backend/controllers/uploadController.js`
- `backend/routes/uploadRoutes.js`
- `backend/uploads/.gitkeep`

---

## 9. Demo Seed System

Seed script:

```powershell
cd E:\AARGLOBE\project\backend
npm run seed
```

File:

- `backend/scripts/seedDemo.js`

Seeds only when business data collections are empty.

Default data:

- Companies: Samsung, boAt, JBL, Realme
- Sample products
- Repair services
- Online services
- Default AAR GLOBE settings
- Bootstrap admin when missing

---

## 10. API Testing

Test file:

- `backend/__tests__/api.test.js`

Run:

```powershell
cd E:\AARGLOBE\project\backend
npm test
```

Covers:

- Admin login
- Company create/list/duplicate validation
- Product create/list
- Service create/list
- Customer request create and status update

Uses:

- Jest
- Supertest
- mongodb-memory-server

CI workflow:

- `.github/workflows/tests.yml`
- Runs `npm install`
- Runs `npm test`
- Notes that `mongodb-memory-server` needs access to a MongoDB binary download or cache.

---

## 11. Security

Implemented:

- JWT authentication for protected admin APIs
- bcrypt password hashing
- Helmet security headers
- Express rate limiter
- Mongo sanitize
- express-validator
- Central error handler
- Request body size limits
- CORS allowlist

---

## 12. Startup

Recommended:

```text
Double-click E:\AARGLOBE\Start Server.bat
```

Behavior:

- Adds portable Node.js to PATH for that terminal session.
- Starts the backend dev server.
- Automatically opens `http://localhost:5000` in the default browser after a short delay.

Manual:

```powershell
cd E:\AARGLOBE\project\backend
npm run dev
```

Open:

```text
http://localhost:5000
http://localhost:5000/admin/
```

---

## 13. Environment Variables

Backend file:

```text
backend/.env
```

Expected:

```env
PORT=5000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=...
JWT_EXPIRES_IN=8h
ADMIN_EMAIL=infoaarglobe@gmail.com
ADMIN_PASSWORD=Aarglobe@2026
UPLOAD_STORAGE=local
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
EMAIL_USER=...
EMAIL_PASS=...
```

Do not expose real secrets.

---

## 14. Production Deployment Plan

Target deployment:

- Custom domain such as `aarglobe.in` or `aarglobe.com`
- Node/Express backend on Render, Railway, VPS, or similar hosting
- MongoDB Atlas for production database
- Cloudinary for production company logo and product image storage
- HTTPS enabled at the hosting/domain layer

Production environment configuration:

```env
NODE_ENV=production
ALLOWED_ORIGINS=https://aarglobe.in,https://www.aarglobe.in
MONGO_URI=mongodb+srv://...
JWT_SECRET=replace_with_strong_random_secret
JWT_EXPIRES_IN=8h
UPLOAD_STORAGE=cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

Upload behavior by environment:

- Development: `UPLOAD_STORAGE=local`, files are stored in `backend/uploads`.
- Production: `UPLOAD_STORAGE=cloudinary`, validated files are uploaded to Cloudinary and MongoDB stores the returned `secure_url`.
- Local filesystem uploads are not used as permanent production storage because they may be lost during redeployment, restart, scaling, or restore workflows.
- If Cloudinary is unavailable or credentials are missing, upload APIs return an error and existing company/product image values remain unchanged.

Deployment checks before launch:

- Confirm `.env` is private and not committed.
- Confirm `ALLOWED_ORIGINS` includes the live custom domain.
- Confirm MongoDB Atlas network access allows the deployed backend.
- Confirm Cloudinary credentials are valid on the production host.
- Run `npm install` and `npm test` in CI or deployment pipeline.
- Confirm `mongodb-memory-server` can access or cache the MongoDB test binary in CI.

---

## 15. Verification Completed

Syntax checks passed with bundled Node for:

- backend models
- backend controllers
- backend routes
- backend middleware
- `backend/server.js`
- `frontend/script.js`
- `frontend/admin/script.js`
- `backend/scripts/seedDemo.js`
- `backend/__tests__/api.test.js`

Search confirmed active source no longer contains:

- `shopId`
- tenant `userId`
- subscription plan logic
- Razorpay/payment checkout references
- old `/api/auth` usage

Company Master verification:

- Company name validation is required/trimmed/unique.
- Duplicate company names return a clear API error.
- Company delete disables records with `isActive = false`.
- Admin company cards show logo, name, status, total products, available products, and best sellers.
- Product company picker is searchable and database-backed.
- Public brand cards load dynamically from MongoDB.

Phase 2 verification:

- Upload middleware validates image MIME type, extension, and 5 MB size limit.
- Upload APIs are protected by JWT.
- Admin dashboard has preview/replace flows for company logos and product images.
- Admin password change API and dashboard form are implemented.
- Analytics dashboard uses responsive canvas charts.
- Demo seed script is implemented.
- API test suite is implemented.

Final production cleanup verification:

- README is updated for the final single-shop production architecture.
- Old local upload cleanup is implemented for replaced company logos and product images.
- Upload storage supports local development mode and Cloudinary production mode.
- Cloudinary replacement cleanup removes old app-managed Cloudinary assets when company logos or product images are replaced.
- GitHub Actions test workflow is added.
- Analytics supports today, last 7 days, last 30 days, and all-time filters.
- Customer request modal source no longer uses checkout naming.
- Final active-source scan is clean for `shopId`, tenant `userId`, subscription logic, Razorpay usage, checkout usage, and old `/api/auth` routes.

Customer contact management verification:

- Request records store last contact date, next follow-up date, and follow-up notes.
- Admin Requests table shows customer name, phone, item, status, last contact, next follow-up, and action controls.
- Admin can mark a request contacted, save follow-up notes, schedule follow-up, and open WhatsApp with a prefilled message.
- Analytics supports CSV and Excel-compatible request exports.

Customer notification system verification:

- Request submission creates a `Request Received` notification record.
- Notification history stores request ID, type, message, sent date, and created date.
- Admin can prepare WhatsApp notifications from status-based templates.
- Analytics cards include total follow-ups, contacted requests, confirmed requests, and completed requests.

Phase 3 business growth verification:

- Settings supports SEO fields: meta title, meta description, keywords, and Google Search Console verification.
- `robots.txt` and `sitemap.xml` are generated by the backend.
- Banner management supports add, edit, delete, image upload, preview, and active/inactive status.
- Public homepage loads active banners as a dynamic slider.
- Requests support lead status: New, Contacted, Qualified, Converted, and Closed.
- Analytics includes total leads, converted leads, and conversion rate.

Responsive frontend verification:

- Customer website and admin dashboard have mobile-first responsive styles.
- Tested viewport widths: 320, 375, 425, 480, 768, 1024, 1280, 1440, and 1920 px.
- Customer website shell had no page-level horizontal overflow at tested widths.
- Admin dashboard shell had no page-level horizontal overflow at tested widths.
- Admin dashboard uses a mobile sidebar overlay and horizontal table containers where needed.

Liquid Glass UI and brand background redesign verification:

- Customer website has the completed premium Liquid Glass UI refresh.
- Official brand colors are active across the UI: `#ff1e00`, `#e8f9fd`, `#59ce8f`, `#0f172a`, `#475569`, and `#ffffff`.
- Customer website background now uses a bright business gradient, floating orange glow, soft blue glow, subtle glass layers, and gentle animated movement.
- Admin dashboard has the completed bright professional Liquid Glass theme.
- Admin dashboard background now uses `linear-gradient(135deg, #e8f9fd, #ffffff)`, white glass panels, soft glow layers, and orange active states.
- Login page has a full-screen bright animated gradient, floating glass shapes, glow effects, and centered glass login card.
- Cards and panels use translucent white glass backgrounds, `backdrop-filter: blur(20px)`, subtle white borders, and soft business-grade shadows.
- Motion-sensitive users are supported through `prefers-reduced-motion`.
- Backend functionality was not modified during the UI/background redesign.

Latest customer storefront verification:

- `GET /api/products/public` returned a live available product under an active company.
- Public product API now validates the expected visibility flow:
  - product has `companyId`
  - product has `isAvailable = true`
  - company has `isActive = true`
  - frontend renders product under the company heading
- Customer product details modal is implemented.
- Customer repair and digital service details modal is implemented.
- Customer product filters are implemented for search, company, and category.
- Customer service filters are implemented for repair and digital service search.
- Existing request CTA flow remains active from cards and details modal.

Skeuomorphism UI verification:

- Customer website active visual layer is skeuomorphic.
- Admin dashboard active visual layer is skeuomorphic.
- Raised cards, inset inputs, beveled buttons, pressed button states, soft shadows, and tactile panels are implemented.
- Brand colors remain active inside the skeuomorphic UI.
- Backend functionality was not changed during the skeuomorphic UI conversion.

Admin dashboard interaction verification:

- Dashboard cards are clickable full-card buttons.
- Dashboard card shortcuts navigate to Companies, Products, Services, Requests, or Analytics.
- Decorative CSS overlays are configured not to block button or card clicks.
- Admin dashboard JavaScript syntax check passed after clickable card changes.

Live smoke test on June 23, 2026:

- `GET /api/settings` returned success from the running local server.
- `GET /api/banners?active=true` returned success.
- `GET /robots.txt` returned generated robots content.
- `GET /sitemap.xml` returned generated XML sitemap content.
- `POST /api/admin/login` succeeded with the configured admin credentials.
- `GET /api/analytics?range=all` succeeded with a valid admin JWT.

Test execution note:

- `npm test` was attempted.
- In this environment, `mongodb-memory-server` could not download the MongoDB binary from `fastdl.mongodb.org`, so the test suite could not execute here.
- The test code and scripts are present and ready for an environment with the MongoDB test binary available.
- Full backend JavaScript syntax check passed for all active backend source and test files.
- Frontend JavaScript syntax checks passed for `frontend/script.js` and `frontend/admin/script.js`.

---

## 16. Remaining Future Work

- Add CI binary caching for `mongodb-memory-server` if GitHub Actions download speed becomes slow.
- If permanent delete is introduced later, delete the Cloudinary asset first, clear the MongoDB image reference, and only then remove the company/product document to prevent orphan image assets.
