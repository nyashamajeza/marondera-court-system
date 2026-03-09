// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Case = require('../models/Case');
const Document = require('../models/Document');
const authMiddleware = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// Login page
router.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/admin/dashboard');
    }
    res.render('admin/login', { 
        title: 'Admin Login - Marondera Court',
        error: req.flash('error'),
        success: req.flash('success')
    });
});

// Login process

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // ===== ADD THESE DEBUG LINES =====
        console.log('='.repeat(50));
        console.log('🔐 LOGIN ATTEMPT');
        console.log('Time:', new Date().toLocaleString());
        console.log('Username received:', username);
        console.log('Password received:', password ? '[PROVIDED]' : '[MISSING]');
        console.log('Request body:', req.body);
        // =================================

        // Find user
        const user = await User.findOne({ username, isActive: true });
        console.log('User found in DB:', user ? 'YES' : 'NO');
        
        if (!user) {
            console.log('❌ User not found or inactive');
            req.flash('error', 'Invalid username or password');
            return res.redirect('/admin/login');
        }

        console.log('User details:', {
            id: user._id,
            username: user.username,
            role: user.role,
            isActive: user.isActive
        });

        // Check password
        console.log('Checking password...');
        const isValid = await bcrypt.compare(password, user.password);
        console.log('Password valid:', isValid ? 'YES' : 'NO');

        if (!isValid) {
            console.log('❌ Invalid password');
            req.flash('error', 'Invalid username or password');
            return res.redirect('/admin/login');
        }

        // Set session
        req.session.user = {
            id: user._id,
            username: user.username,
            name: user.name,
            role: user.role
        };

        console.log('✅ Session created:', req.session.user);
        console.log('Session ID:', req.sessionID);

        // Update last login
        user.lastLogin = new Date();
        await user.save();
        console.log('✅ Last login updated');

        req.flash('success', `Welcome back, ${user.name}!`);
        console.log('Redirecting to dashboard...');
        console.log('='.repeat(50));
        
        res.redirect('/admin/dashboard');

    } catch (error) {
        console.error('❌ Login error:', error);
        req.flash('error', 'Login failed. Please try again.');
        res.redirect('/admin/login');
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin/login');
});

// Dashboard (protected)
router.get('/dashboard', authMiddleware.isLoggedIn, async (req, res) => {
    try {
        // Get statistics
        const totalCases = await Case.countDocuments();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayCases = await Case.countDocuments({
            hearingDate: { $gte: today }
        });
        
        const pendingCases = await Case.countDocuments({
            status: { $in: ['Filed', 'Scheduled', 'In Progress'] }
        });
        
        const totalDocuments = await Document.countDocuments();
        const recentUploads = await Document.countDocuments({
            uploadDate: { $gte: today }
        });

        // Get recent cases
        const recentCases = await Case.find()
            .sort({ createdAt: -1 })
            .limit(5);

        // Get recent documents
        const recentDocs = await Document.find()
            .populate('caseId', 'caseNumber')
            .sort({ uploadDate: -1 })
            .limit(5);

        res.render('admin/dashboard', {
            title: 'Admin Dashboard - Marondera Court',
            user: req.session.user,
            stats: {
                totalCases,
                todayCases,
                pendingCases,
                totalDocuments,
                recentUploads
            },
            recentCases,
            recentDocs
        });

    } catch (error) {
        console.error('Dashboard error:', error);
        req.flash('error', 'Failed to load dashboard');
        res.redirect('/admin/login');
    }
});

// Cases management
router.get('/cases', authMiddleware.isLoggedIn, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;

        const cases = await Case.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Case.countDocuments();

        res.render('admin/cases', {
            title: 'Case Management - Marondera Court',
            user: req.session.user,
            cases,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total
        });

    } catch (error) {
        console.error('Cases page error:', error);
        req.flash('error', 'Failed to load cases');
        res.redirect('/admin/dashboard');
    }
});

// Add new case page
router.get('/cases/new', authMiddleware.isMagistrateOrAdmin, (req, res) => {
    res.render('admin/new-case', {
        title: 'Add New Case - Marondera Court',
        user: req.session.user
    });
});

// Create new case
router.post('/cases', authMiddleware.isMagistrateOrAdmin, async (req, res) => {
    try {
        const caseData = req.body;
        
        // Generate case number
        const year = new Date().getFullYear();
        const count = await Case.countDocuments() + 1;
        caseData.caseNumber = `SMC/${year}/${count.toString().padStart(4, '0')}`;

        const newCase = new Case(caseData);
        await newCase.save();

        req.flash('success', `Case ${newCase.caseNumber} created successfully`);
        res.redirect('/admin/cases');

    } catch (error) {
        console.error('Create case error:', error);
        req.flash('error', 'Failed to create case');
        res.redirect('/admin/cases/new');
    }
});

// Edit case page
router.get('/cases/:id/edit', authMiddleware.isMagistrateOrAdmin, async (req, res) => {
    try {
        const case_ = await Case.findById(req.params.id);
        if (!case_) {
            req.flash('error', 'Case not found');
            return res.redirect('/admin/cases');
        }

        res.render('admin/edit-case', {
            title: 'Edit Case - Marondera Court',
            user: req.session.user,
            case: case_
        });

    } catch (error) {
        console.error('Edit case error:', error);
        req.flash('error', 'Failed to load case');
        res.redirect('/admin/cases');
    }
});

// Update case
router.post('/cases/:id', authMiddleware.isMagistrateOrAdmin, async (req, res) => {
    try {
        const case_ = await Case.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: new Date() },
            { new: true }
        );

        if (!case_) {
            req.flash('error', 'Case not found');
            return res.redirect('/admin/cases');
        }

        req.flash('success', `Case ${case_.caseNumber} updated successfully`);
        res.redirect('/admin/cases');

    } catch (error) {
        console.error('Update case error:', error);
        req.flash('error', 'Failed to update case');
        res.redirect(`/admin/cases/${req.params.id}/edit`);
    }
});

// Delete case
router.post('/cases/:id/delete', authMiddleware.isAdmin, async (req, res) => {
    try {
        const case_ = await Case.findByIdAndDelete(req.params.id);
        
        // Also delete associated documents
        await Document.deleteMany({ caseId: req.params.id });

        req.flash('success', `Case ${case_.caseNumber} deleted successfully`);
        res.redirect('/admin/cases');

    } catch (error) {
        console.error('Delete case error:', error);
        req.flash('error', 'Failed to delete case');
        res.redirect('/admin/cases');
    }
});

// Documents management
router.get('/documents', authMiddleware.isLoggedIn, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;

        const documents = await Document.find()
            .populate('caseId', 'caseNumber')
            .sort({ uploadDate: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Document.countDocuments();

        res.render('admin/documents', {
            title: 'Document Management - Marondera Court',
            user: req.session.user,
            documents,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total
        });

    } catch (error) {
        console.error('Documents page error:', error);
        req.flash('error', 'Failed to load documents');
        res.redirect('/admin/dashboard');
    }
});

// User management (admin only)
router.get('/users', authMiddleware.isAdmin, async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.render('admin/users', {
            title: 'User Management - Marondera Court',
            user: req.session.user,
            users
        });

    } catch (error) {
        console.error('Users page error:', error);
        req.flash('error', 'Failed to load users');
        res.redirect('/admin/dashboard');
    }
});

// Add new user page
router.get('/users/new', authMiddleware.isAdmin, (req, res) => {
    res.render('admin/new-user', {
        title: 'Add New User - Marondera Court',
        user: req.session.user
    });
});

// Create new user
router.post('/users', authMiddleware.isAdmin, async (req, res) => {
    try {
        const { username, password, name, email, role } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            req.flash('error', 'Username already exists');
            return res.redirect('/admin/users/new');
        }

        // Create new user
        const user = new User({
            username,
            password, // Will be hashed by the pre-save hook
            name,
            email,
            role
        });

        await user.save();

        req.flash('success', `User ${name} created successfully`);
        res.redirect('/admin/users');

    } catch (error) {
        console.error('Create user error:', error);
        req.flash('error', 'Failed to create user');
        res.redirect('/admin/users/new');
    }
});

// Edit user page
router.get('/users/:id/edit', authMiddleware.isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            req.flash('error', 'User not found');
            return res.redirect('/admin/users');
        }

        res.render('admin/edit-user', {
            title: 'Edit User - Marondera Court',
            user: req.session.user,
            editUser: user
        });

    } catch (error) {
        console.error('Edit user error:', error);
        req.flash('error', 'Failed to load user');
        res.redirect('/admin/users');
    }
});

// Update user
router.post('/users/:id', authMiddleware.isAdmin, async (req, res) => {
    try {
        const { name, email, role, isActive } = req.body;
        
        const user = await User.findById(req.params.id);
        if (!user) {
            req.flash('error', 'User not found');
            return res.redirect('/admin/users');
        }

        // Update fields
        user.name = name;
        user.email = email;
        user.role = role;
        user.isActive = isActive === 'on';

        await user.save();

        req.flash('success', `User ${user.name} updated successfully`);
        res.redirect('/admin/users');

    } catch (error) {
        console.error('Update user error:', error);
        req.flash('error', 'Failed to update user');
        res.redirect(`/admin/users/${req.params.id}/edit`);
    }
});

// Delete user
router.post('/users/:id/delete', authMiddleware.isAdmin, async (req, res) => {
    try {
        // Don't allow deleting yourself
        if (req.params.id === req.session.user.id) {
            req.flash('error', 'You cannot delete your own account');
            return res.redirect('/admin/users');
        }

        await User.findByIdAndDelete(req.params.id);
        req.flash('success', 'User deleted successfully');
        res.redirect('/admin/users');

    } catch (error) {
        console.error('Delete user error:', error);
        req.flash('error', 'Failed to delete user');
        res.redirect('/admin/users');
    }
});

// Reports page
router.get('/reports', authMiddleware.isMagistrateOrAdmin, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        let dateFilter = {};
        if (startDate && endDate) {
            dateFilter = {
                filingDate: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            };
        }

        // Get case statistics by type
        const casesByType = await Case.aggregate([
            { $match: dateFilter },
            { $group: { _id: '$caseType', count: { $sum: 1 } } }
        ]);

        // Get case statistics by status
        const casesByStatus = await Case.aggregate([
            { $match: dateFilter },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Get document statistics
        const documentsByType = await Document.aggregate([
            { $match: dateFilter },
            { $group: { _id: '$documentType', count: { $sum: 1 } } }
        ]);

        // Get monthly trends
        const monthlyCases = await Case.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: '$filingDate' },
                        month: { $month: '$filingDate' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } },
            { $limit: 12 }
        ]);

        res.render('admin/reports', {
            title: 'Reports - Marondera Court',
            user: req.session.user,
            casesByType,
            casesByStatus,
            documentsByType,
            monthlyCases,
            startDate: startDate || '',
            endDate: endDate || ''
        });

    } catch (error) {
        console.error('Reports error:', error);
        req.flash('error', 'Failed to generate reports');
        res.redirect('/admin/dashboard');
    }
});

// Backup page
router.get('/backup', authMiddleware.isAdmin, async (req, res) => {
    try {
        // Get backup statistics
        const totalDocuments = await Document.countDocuments();
        const totalStorage = await Document.aggregate([
            { $group: { _id: null, totalSize: { $sum: '$fileSize' } } }
        ]);

        res.render('admin/backup', {
            title: 'Backup Management - Marondera Court',
            user: req.session.user,
            stats: {
                totalDocuments,
                totalStorage: totalStorage[0]?.totalSize || 0,
                lastBackup: new Date().toLocaleString() // You can store this in database
            }
        });

    } catch (error) {
        console.error('Backup page error:', error);
        req.flash('error', 'Failed to load backup page');
        res.redirect('/admin/dashboard');
    }
});

module.exports = router;