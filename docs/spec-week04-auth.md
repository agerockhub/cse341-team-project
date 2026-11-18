# Spec: Feature Set 1 - Core Authentication

## Description
Add session-based authentication: users can register, log in and log out, and the signed-in user and role are stored in the session. Middleware protects EJS pages and API routes. An Admin Dashboard page requires the admin role.

## Data model
roles collection (Mongoose model Role): name (String, required, unique, enum: customer, admin).
users collection (Mongoose model User): displayName (String, required), username (String, required, unique, lowercase), email (String, required, unique, lowercase), passwordHash (String, required), role (ObjectId reference to Role, required). Timestamps added by Mongoose.
Passwords are hashed with bcrypt and never stored, logged or returned in plain text.

## Session data
req.session.user = { id, name, role } where role is the role name ("customer" or "admin").
loadSessionUser copies it to req.user and res.locals.user for templates.
Session cookie lasts 1 hour of inactivity. SESSION_SECRET comes from the environment.

## Page routes
GET /register: register form. Signed-out users only.
POST /register: creates a customer user (the role is always set by the server). Success: redirect to /login. Invalid input: re-render the form with a message (400). Duplicate email or username: re-render with a friendly message (409).
GET /login: login form.
POST /login: checks the password. Success: store the user in the session, redirect to /admin-dashboard for admins and to / for others. (Feature Set 2 will change this to /dashboard). Wrong email or password: re-render with the same generic message (401).
POST /logout: destroys the session, redirects to /.
GET /admin-dashboard: requirePageRole("admin"). Page says "Welcome to the Admin Dashboard".

## Middleware (src/middleware/auth.js)
loadSessionUser: sets req.user and res.locals.user.
requireApiLogin: 401 JSON { "message": "Authentication required" } if not signed in.
requirePageLogin: redirect to /login if not signed in.
requireApiRole(role): 401 if not signed in, 403 JSON { "message": "Forbidden" } if the role does not match.
requirePageRole(role): redirect to /login if not signed in, 403 error page (src/views/errors/403.ejs) if the role does not match.

## Database import
src/db/initialize.js adds the roles "customer" and "admin" by name (no delete and re-insert), so existing users keep a valid role reference.
npm run db:roles adds the roles safely, and npm run db:make-admin -- email promotes a test account.

## Environment
SESSION_SECRET in .env locally and in the Render environment variables.

## Test plan
1. npm run db:import is not needed for the shared database if roles already exist; the roles customer and admin exist afterwards.
2. Register a new user: redirected to /login, and the user exists in MongoDB with a hashed password and the customer role.
3. Register with an existing email: friendly error, no crash.
4. Log in with a wrong password: generic error message and status 401.
5. Log in with the right password: signed in, redirected to /dashboard (customer) or /admin-dashboard (admin).
6. Signed out, open /admin-dashboard: redirected to /login.
7. Signed in as a customer, open /admin-dashboard: 403 page.
8. Signed in as an admin, open /admin-dashboard: "Welcome to the Admin Dashboard".
9. Log out: the session is gone, and /admin-dashboard redirects to /login again.
10. A route using requireApiLogin returns 401 JSON when signed out; requireApiRole("admin") returns 403 JSON for a customer.
11. npm run lint and npm test report no errors.