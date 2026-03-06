// config/aws.js
const { S3Client } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
require('dotenv').config();

// Create S3 client
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'af-south-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    },
    maxAttempts: 3
});

// Test S3 connection
const testS3Connection = async () => {
    try {
        // List buckets to test connection
        const { ListBucketsCommand } = require('@aws-sdk/client-s3');
        const command = new ListBucketsCommand({});
        const response = await s3Client.send(command);
        console.log('✅ AWS S3 connection successful');
        console.log('📦 Available buckets:', response.Buckets.map(b => b.Name).join(', '));
    } catch (error) {
        console.error('❌ AWS S3 connection failed:', error.message);
        console.log('\n🔧 Troubleshooting tips:');
        console.log('1. Check your AWS credentials in .env file');
        console.log('2. Verify AWS region is correct (af-south-1 for Cape Town)');
        console.log('3. Ensure your IAM user has S3 permissions');
        console.log('4. Check your internet connection\n');
    }
};

// Call test on startup if not in production
if (process.env.NODE_ENV !== 'production') {
    testS3Connection();
}

module.exports = { s3Client };