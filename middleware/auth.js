// middleware/auth.js
const authMiddleware = {
    // Check if user is logged in
    isLoggedIn: (req, res, next) => {
        console.log('Auth check - Session:', req.session); // Add this debug line
        console.log('Auth check - User:', req.session?.user);
        
        if (req.session && req.session.user) {
            return next();
        }
        console.log('User not logged in, redirecting to login');
        req.flash('error', 'Please login to access this page');
        res.redirect('/admin/login');
    },

    isAdmin: (req, res, next) => {
        if (req.session && req.session.user && req.session.user.role === 'Admin') {
            return next();
        }
        req.flash('error', 'Access denied. Admin privileges required.');
        res.redirect('/admin/dashboard');
    },

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