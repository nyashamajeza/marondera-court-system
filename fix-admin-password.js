// fix-admin-password.js
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

// Your MongoDB Atlas connection string
const ATLAS_URI = 'mongodb+srv://courtadmin:QmRuaMTEZVeXAgDb@maronderacourtecosystem.1vc7hha.mongodb.net/marondera_court?retryWrites=true&w=majority&appName=MaronderaCourtEcosystem';

async function fixAdminPassword() {
    console.log('='.repeat(60));
    console.log('🔧 FIXING ADMIN PASSWORD IN MONGODB ATLAS');
    console.log('='.repeat(60));

    try {
        // Connect to Atlas
        console.log('📡 Connecting to MongoDB Atlas...');
        await mongoose.connect(ATLAS_URI, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 10000,
        });
        console.log('✅ Connected to Atlas successfully!');

        // Find admin user
        console.log('\n🔍 Searching for admin user...');
        const admin = await User.findOne({ username: 'admin' });
        
        if (!admin) {
            console.log('❌ Admin user not found! Creating new one...');
            
            // Create new admin if doesn't exist
            const hashedPassword = await bcrypt.hash('Admin123!', 10);
            const newAdmin = new User({
                username: 'admin',
                password: hashedPassword,
                name: 'System Administrator',
                email: 'admin@maronderacourt.gov.zw',
                role: 'Admin',
                isActive: true
            });
            
            await newAdmin.save();
            console.log('✅ New admin user created!');
            
            // Verify
            const verifyNew = await User.findOne({ username: 'admin' });
            const isValidNew = await bcrypt.compare('Admin123!', verifyNew.password);
            console.log(`🔐 Password verification: ${isValidNew ? '✅ SUCCESS' : '❌ FAILED'}`);
            
        } else {
            console.log('✅ Found admin user:');
            console.log(`   ID: ${admin._id}`);
            console.log(`   Username: ${admin.username}`);
            console.log(`   Current password hash: ${admin.password.substring(0, 20)}...`);

            // Test current password
            console.log('\n🔐 Testing current password...');
            const currentPasswordValid = await bcrypt.compare('Admin123!', admin.password);
            console.log(`   Current password valid? ${currentPasswordValid ? '✅ YES' : '❌ NO'}`);

            // Force set new password with a different approach
            console.log('\n🔄 Setting new password directly...');
            
            // Generate hash with explicit salt rounds
            const salt = await bcrypt.genSalt(10);
            const newHash = await bcrypt.hash('Admin123!', salt);
            
            // Update using updateOne instead of save
            await User.updateOne(
                { _id: admin._id },
                { $set: { password: newHash } }
            );
            
            console.log('✅ Password updated via updateOne');

            // Verify the new password
            const updatedAdmin = await User.findOne({ username: 'admin' });
            const isValid = await bcrypt.compare('Admin123!', updatedAdmin.password);
            
            console.log(`\n🔐 FINAL VERIFICATION:`);
            console.log(`   Password matches: ${isValid ? '✅ SUCCESS' : '❌ FAILED'}`);
            
            if (isValid) {
                console.log('\n🎉 SUCCESS! Admin password is now correct!');
                console.log('   You can now login with:');
                console.log('   ┌─────────────────────────┐');
                console.log('   │ Username: admin         │');
                console.log('   │ Password: Admin123!     │');
                console.log('   └─────────────────────────┘');
            } else {
                console.log('\n⚠️  Password still doesn\'t match. Trying one more method...');
                
                // Last resort: delete and recreate
                console.log('   Deleting and recreating admin user...');
                await User.deleteOne({ _id: admin._id });
                
                const finalHash = await bcrypt.hash('Admin123!', 10);
                const finalAdmin = new User({
                    username: 'admin',
                    password: finalHash,
                    name: 'System Administrator',
                    email: 'admin@maronderacourt.gov.zw',
                    role: 'Admin',
                    isActive: true
                });
                
                await finalAdmin.save();
                
                // Final verification
                const finalCheck = await User.findOne({ username: 'admin' });
                const finalValid = await bcrypt.compare('Admin123!', finalCheck.password);
                console.log(`   Final verification: ${finalValid ? '✅ SUCCESS' : '❌ FAILED'}`);
            }
        }

        // List all users
        const allUsers = await User.find();
        console.log('\n📊 All users in database:');
        if (allUsers.length === 0) {
            console.log('   No users found');
        } else {
            allUsers.forEach((user, i) => {
                console.log(`   ${i+1}. ${user.username} (${user.role})`);
            });
        }

    } catch (error) {
        console.error('\n❌ ERROR:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
        console.log('='.repeat(60));
    }
}

fixAdminPassword();