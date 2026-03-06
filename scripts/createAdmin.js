// scripts/createAdmin.js
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function createAdminUser() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ username: 'admin' });
        if (existingAdmin) {
            console.log('⚠️ Admin user already exists');
            process.exit(0);
        }

        // Create admin user
        const admin = new User({
            username: 'admin',
            password: 'Admin123!', // Will be hashed by pre-save hook
            name: 'System Administrator',
            email: 'admin@maronderacourt.gov.zw',
            role: 'Admin',
            isActive: true
        });

        await admin.save();
        console.log('✅ Admin user created successfully');
        console.log('📝 Username: admin');
        console.log('📝 Password: Admin123!');
        console.log('⚠️ Please change the password after first login!');

    } catch (error) {
        console.error('❌ Error creating admin:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

createAdminUser();