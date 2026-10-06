# Natours — Full-Stack Node.js Project

A complete Natours application based on the backend you built while following Jonas Schmedtmann's Node.js / Express / MongoDB course, with a simple vanilla HTML/CSS/JavaScript frontend.

## Included

- Express + MongoDB + Mongoose backend
- JWT authentication
- Signup and login
- Bearer-token protected routes
- Role-based authorization (`user`, `guide`, `lead-guide`, `admin`)
- Forgot/reset password flow with Nodemailer
- Update profile
- Update password
- Deactivate account
- Tour CRUD routes currently implemented in the project
- Filtering, sorting, field limiting and pagination
- Top 5 cheap tours
- Tour statistics aggregation
- Monthly tour plan aggregation
- Security middleware: Helmet, rate limiting, Mongo sanitization, XSS protection and HPP
- Responsive Natours-style frontend
- Local tour artwork/assets
- Admin/lead-guide management UI

## Setup

1. Open this folder in VS Code.
2. Run `npm install`.
3. Copy `config.env.example` to `config.env`.
4. Put your own MongoDB and email credentials in `config.env`.
5. Run `npm run dev`.
6. Open `http://localhost:3000`.

## Scripts

- `npm run dev` — development server with nodemon
- `npm start` — production-style Node server

## Authentication

Login/signup returns a JWT. The frontend stores the token locally and sends it as:

`Authorization: Bearer <token>`

Protected backend routes use `authController.protect`, and role-protected operations use `authController.restrictTo(...)`.

## Password reset

The forgot-password endpoint sends a reset URL through your configured email provider. Open the URL from the email to use the reset form.

## Important

Never commit `config.env`, database passwords, SMTP passwords, or JWT secrets to GitHub. Only commit `config.env.example`.

## API base

`/api/v1`

### Users

- `POST /users/signup`
- `POST /users/login`
- `GET /users/me` — protected
- `POST /users/forgotPassword`
- `PATCH /users/resetPassword/:token`
- `PATCH /users/updateMe` — protected
- `PATCH /users/updateMyPassword` — protected
- `DELETE /users/deleteMe` — protected

### Tours

- `GET /tours` — protected in the current backend
- `GET /tours/:id`
- `POST /tours`
- `PATCH /tours/:id`
- `DELETE /tours/:id` — admin/lead-guide
- `GET /tours/top-5-cheap`
- `GET /tours/tour-stats`
- `GET /tours/monthly-plan/:year`

## Scope

This package intentionally stops at the functionality you have implemented so far. Booking, reviews, maps, image uploads, advanced Mongoose sections and other later-course functionality are not fabricated into this project.


## Tour photographs

The frontend uses the real Natours tour photographs from the public Natours demo at `https://natours.dev/` so the cards render with photographic covers rather than placeholder illustrations. The image files are referenced by URL and are not copied into this repository. If you want self-hosted images, replace the URLs in `public/js/app.js` and `public/css/style.css` with locally licensed images.


## Tour photographs
The project is configured to use local photographs from `public/img/tours/`. Because the ZIP is created in an offline build environment, run this once on your Windows PC from the project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\download-tour-images.ps1
```

This downloads 11 free-to-use Unsplash photographs into the project. After that, the website uses only the local `/img/tours/tour-N.jpg` files.
