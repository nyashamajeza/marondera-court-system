// middleware/auth.js
const authMiddleware = {
    // Check if user is logged in
    isLoggedIn: (req, res, next) => {
        if (req.session && req.session.user) {
            return next();
        }
        req.flash('error', 'Please login to access this page');
        res.redirect('/admin/login');
    },

    // Check if user is admin
    isAdmin: (req, res, next) => {
        if (req.session && req.session.user && req.session.user.role === 'Admin') {
            return next();
        }
        req.flash('error', 'Access denied. Admin privileges required.');
        res.redirect('/admin/dashboard');
    },

    // Check if user is magistrate or admin
    isMagistrateOrAdmin: (req, res, next) => {
        if (req.session && req.session.user && 
            (req.session.user.role === 'Magistrate' || req.session.user.role === 'Admin')) {
            return next();
        }
        req.flash('error', 'Access denied. Magistrate or Admin privileges required.');
        res.redirect('/admin/dashboard');
    }
};

module.exports = authMiddleware;