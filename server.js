// server.js
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const session = require('express-session');
const flash = require('connect-flash');
require('dotenv').config();

// Import routes
const uploadRoutes = require('./routes/uploadRoutes');
const caseRoutes = require('./routes/caseRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Initialize express app
const app = express();

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'marondera-court-super-secret-key-2026',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 3600000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' // true in production (HTTPS)
    }
}));

app.use(flash());

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Make user available to all views
app.use((req, res, next) => {
    res.locals.currentUser = req.session.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

// ===========================================
// DEBUGGING MIDDLEWARE - ADD THIS
// ===========================================
app.use((req, res, next) => {
    console.log(`📌 REQUEST: ${req.method} ${req.url}`);
    next();
});

// ===========================================
// TEST ROUTE TO CHECK IF SERVER IS WORKING
// ===========================================
app.get('/test', (req, res) => {
    res.send('✅ Server is working!');
});

// ===========================================
// ROUTES
// ===========================================
app.use('/api/upload', uploadRoutes);
app.use('/api/cases', caseRoutes);
app.use('/admin', adminRoutes);

// Home route - Dashboard
app.get('/', (req, res) => {
    res.render('dashboard', { 
        title: 'Marondera Magistrate Court - Dashboard',
        user: req.session.user 
    });
});

// Evidence upload page
app.get('/upload', (req, res) => {
    res.render('upload', { 
        title: 'Upload Evidence - Marondera Court' 
    });
});

// Case lookup page
app.get('/lookup', (req, res) => {
    res.render('lookup', { 
        title: 'Case Lookup - Marondera Court' 
    });
});

// ===========================================
// DEBUG ROUTES - CHECK ALL REGISTERED ROUTES
// ===========================================
app.get('/debug-routes', (req, res) => {
    const routes = [];
    
    app._router.stack.forEach(middleware => {
        if (middleware.route) {
            routes.push({
                path: middleware.route.path,
                methods: Object.keys(middleware.route.methods)
            });
        } else if (middleware.name === 'router') {
            middleware.handle.stack.forEach(handler => {
                if (handler.route) {
                    const basePath = middleware.regexp.source
                        .replace('\\/?(?=\\/|$)', '')
                        .replace(/\\\//g, '/')
                        .replace(/\^/g, '');
                    
                    routes.push({
                        path: basePath + (handler.route.path === '/' ? '' : handler.route.path),
                        methods: Object.keys(handler.route.methods)
                    });
                }
            });
        }
    });
    
    res.json({
        totalRoutes: routes.length,
        routes: routes.sort((a, b) => a.path.localeCompare(b.path))
    });
});

// ===========================================
// ERROR HANDLING
// ===========================================
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ ERROR:', err.stack);
    res.status(500).render('error', { 
        title: 'Error',
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// 404 handler
app.use((req, res) => {
    console.log(`❌ 404 - Route not found: ${req.method} ${req.url}`);
    res.status(404).render('error', { 
        title: '404 Not Found',
        message: 'Page not found' 
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📁 Project folder: ${__dirname}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📝 Test routes:`);
    console.log(`   - http://localhost:${PORT}/test`);
    console.log(`   - http://localhost:${PORT}/debug-routes`);
    console.log(`   - http://localhost:${PORT}/admin/login`);
});