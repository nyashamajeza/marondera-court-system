// scripts/seedData.js
const mongoose = require('mongoose');
const Case = require('../models/Case');
const User = require('../models/User');
require('dotenv').config();

async function seedData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Sample cases
        const sampleCases = [
            {
                caseNumber: 'SMC/2024/0001',
                parties: {
                    plaintiff: { name: 'John Doe', contact: 'john@email.com' },
                    defendant: { name: 'Jane Smith', contact: 'jane@email.com' }
                },
                caseType: 'Small Claims',
                hearingDate: new Date(),
                courtroom: '1',
                magistrate: 'Magistrate Chigumba',
                status: 'Scheduled',
                waitingTime: 30
            },
            {
                caseNumber: 'SMC/2024/0002',
                parties: {
                    plaintiff: { name: 'ABC Company', contact: 'info@abc.com' },
                    defendant: { name: 'XYZ Enterprises', contact: 'info@xyz.com' }
                },
                caseType: 'Civil',
                hearingDate: new Date(),
                courtroom: '2',
                magistrate: 'Magistrate Moyo',
                status: 'In Progress',
                waitingTime: 15
            },
            {
                caseNumber: 'SMC/2024/0003',
                parties: {
                    plaintiff: { name: 'State', contact: 'npa@gov.zw' },
                    defendant: { name: 'Accused Person', contact: '' }
                },
                caseType: 'Criminal',
                hearingDate: new Date(),
                courtroom: '3',
                magistrate: 'Magistrate Makoni',
                status: 'Filed',
                waitingTime: 45
            }
        ];

        // Clear existing cases
        await Case.deleteMany({});
        console.log('🗑️ Cleared existing cases');

        // Insert sample cases
        const result = await Case.insertMany(sampleCases);
        console.log(`✅ Added ${result.length} sample cases`);

        console.log('\n📋 Sample data created successfully!');
        console.log('You can now test the application with these cases.');

    } catch (error) {
        console.error('❌ Error seeding data:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

seedData();