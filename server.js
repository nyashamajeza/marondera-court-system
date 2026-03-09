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
        secure: false // Set to true only in production with HTTPS
    }
}));

// After session configuration, add:
app.use((req, res, next) => {
    console.log('📋 Session Debug:');
    console.log('  Path:', req.path);
    console.log('  Session ID:', req.sessionID);
    console.log('  Session User:', req.session.user ? 'Logged in' : 'Not logged in');
    if (req.session.user) {
        console.log('  User:', req.session.user.username);
    }
    console.log('  Cookies:', req.headers.cookie);
    console.log('---');
    next();
});

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

// Routes
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

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { 
        title: 'Error',
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('error', { 
        title: '404 Not Found',
        message: 'Page not found' 
    });
});

// Start server - DECLARE PORT ONLY ONCE HERE
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📁 Project folder: ${__dirname}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});