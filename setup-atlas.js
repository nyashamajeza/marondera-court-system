// setup-atlas.js
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Your MongoDB Atlas connection string
const ATLAS_URI = 'mongodb+srv://courtadmin:QmRuaMTEZVeXAgDb@maronderacourtecosystem.1vc7hha.mongodb.net/marondera_court?retryWrites=true&w=majority&appName=MaronderaCourtEcosystem';

async function setupAtlas() {
    console.log('='.repeat(50));
    console.log('🚀 Setting up MongoDB Atlas for Marondera Court');
    console.log('='.repeat(50));

    try {
        // Connect to Atlas
        console.log('📡 Connecting to MongoDB Atlas...');
        await mongoose.connect(ATLAS_URI);
        console.log('✅ Connected to Atlas successfully!');

        // Check if admin exists
        console.log('\n🔍 Checking for admin user...');
        const existingAdmin = await User.findOne({ username: 'admin' });

        if (existingAdmin) {
            console.log('✅ Admin user already exists in Atlas:');
            console.log(`   Username: ${existingAdmin.username}`);
            console.log(`   Name: ${existingAdmin.name}`);
            console.log(`   Role: ${existingAdmin.role}`);
            console.log(`   Active: ${existingAdmin.isActive}`);
        } else {
            console.log('❌ No admin user found. Creating one...');
            
            // Create admin user
            const hashedPassword = await bcrypt.hash('Admin123!', 10);
            
            const admin = new User({
                username: 'admin',
                password: hashedPassword,
                name: 'System Administrator',
                email: 'admin@maronderacourt.gov.zw',
                role: 'Admin',
                isActive: true
            });

            await admin.save();
            console.log('✅ Admin user CREATED successfully in Atlas!');
            console.log(`   Username: admin`);
            console.log(`   Password: Admin123!`);
            console.log(`   Role: Admin`);
        }

        // Show all users in database
        const allUsers = await User.find();
        console.log(`\n📊 Total users in Atlas: ${allUsers.length}`);
        allUsers.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.username} (${user.role})`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
        console.log('='.repeat(50));
    }
}

// Run the setup
setupAtlas();