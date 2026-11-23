import express from 'express';
import session from 'express-session';
import Path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import pkg from './package.json' with { type: 'json' };
import swaggerSpec from './src/swagger.js';
import globalMiddleware from './src/middleware/global.js';
import { loadSessionUser } from './src/middleware/auth.js';
import routes from './src/routes/router.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = Path.dirname(__filename);

// The tests do not load .env, so they get a throwaway secret.
const SESSION_SECRET =
    process.env.SESSION_SECRET || (process.env.NODE_ENV === 'test' ? 'test-only-secret' : '');

if (!SESSION_SECRET) {
    throw new Error('SESSION_SECRET is required. Add it to your .env file.');
}

const isProduction = process.env.NODE_ENV?.toLowerCase() === 'production';

const app = express();

// Render sits behind a proxy. Without this, secure cookies are never sent back.
if (isProduction) {
    app.set('trust proxy', 1);
}

// Add version info to res.locals for access in templates.
app.use((req, res, next) => {
    res.locals.appVersion = pkg.version;
    next();
});

// Configure static files and EJS templates.
app.use(express.static(Path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', Path.join(__dirname, 'src/views'));

// Parse JSON and URL-encoded request bodies.
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sessions must be registered before any route that uses req.session.
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
        maxAge: 60 * 60 * 1000, // 1 hour of inactivity
        httpOnly: true,         // JavaScript in the browser cannot read the cookie
        sameSite: 'lax',
        secure: isProduction    // HTTPS only when deployed
    }
}));
app.use(loadSessionUser);

// API documentation.
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(globalMiddleware);
app.use('/', routes);

// Catch requests that did not match a route.
app.use((req, res, next) => {
    const err = new Error('Page Not Found');
    err.status = 404;
    next(err);
});

// Render the appropriate error page.
app.use((err, req, res, next) => {
    const status = err.status || 500;
    const template = status === 404 ? '404' : '500';
    const context = {
        title: status === 404 ? 'Page Not Found' : 'Server Error',
        error: err.message,
        stack: err.stack
    };

    return res.status(status).render(`errors/${template}`, context);
});

export default app;