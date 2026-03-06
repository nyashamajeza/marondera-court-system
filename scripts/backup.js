// scripts/backup.js
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

class BackupService {
    constructor() {
        this.backupDir = path.join(__dirname, '../backups');
        this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // Initialize S3 client for v3
        this.s3Client = new S3Client({
            region: process.env.AWS_REGION || 'af-south-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            }
        });
        
        this.ensureBackupDir();
    }

    ensureBackupDir() {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }

    async backupDatabase() {
        console.log('📦 Starting database backup...');
        
        const backupFile = path.join(this.backupDir, `mongodb-backup-${this.timestamp}.gz`);
        
        return new Promise((resolve, reject) => {
            // Get database name from connection string
            const dbName = process.env.MONGODB_URI.split('/').pop().split('?')[0];
            
            // Use mongodump for backup
            const mongodump = spawn('mongodump', [
                `--uri=${process.env.MONGODB_URI}`,
                `--archive=${backupFile}`,
                '--gzip'
            ]);

            mongodump.stdout.on('data', (data) => {
                console.log(`stdout: ${data}`);
            });

            mongodump.stderr.on('data', (data) => {
                console.error(`stderr: ${data}`);
            });

            mongodump.on('close', (code) => {
                if (code === 0) {
                    console.log(`✅ Database backup created: ${backupFile}`);
                    resolve(backupFile);
                } else {
                    reject(new Error(`mongodump exited with code ${code}`));
                }
            });
        });
    }

    async uploadToS3(filePath) {
        console.log('☁️ Uploading backup to S3...');
        
        const fileName = path.basename(filePath);
        const s3Key = `backups/database/${fileName}`;

        const fileContent = fs.readFileSync(filePath);

        const params = {
            Bucket: process.env.AWS_BACKUP_BUCKET || process.env.AWS_BUCKET_NAME,
            Key: s3Key,
            Body: fileContent,
            ContentType: 'application/gzip',
            Metadata: {
                backupDate: new Date().toISOString(),
                type: 'database-backup'
            }
        };

        try {
            // Use AWS SDK v3 PutObjectCommand
            const command = new PutObjectCommand(params);
            const result = await this.s3Client.send(command);
            
            // Construct the URL
            const bucketName = process.env.AWS_BACKUP_BUCKET || process.env.AWS_BUCKET_NAME;
            const region = process.env.AWS_REGION || 'af-south-1';
            const fileUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${s3Key}`;
            
            console.log(`✅ Backup uploaded to S3: ${fileUrl}`);
            return result;
        } catch (error) {
            console.error('❌ S3 upload failed:', error);
            throw error;
        }
    }

    async cleanupOldBackups(daysToKeep = 7) {
        console.log('🧹 Cleaning up old backups...');
        
        const files = fs.readdirSync(this.backupDir);
        const now = Date.now();
        const maxAge = daysToKeep * 24 * 60 * 60 * 1000;

        files.forEach(file => {
            const filePath = path.join(this.backupDir, file);
            const stats = fs.statSync(filePath);
            const age = now - stats.mtimeMs;

            if (age > maxAge) {
                fs.unlinkSync(filePath);
                console.log(`🗑️ Deleted old backup: ${file}`);
            }
        });
    }

    async runBackup() {
        console.log('='.repeat(50));
        console.log('🚀 Starting backup process...');
        console.log('='.repeat(50));
        console.log(`📅 Time: ${new Date().toLocaleString()}`);

        try {
            // Create database backup
            const backupFile = await this.backupDatabase();

            // Upload to S3
            await this.uploadToS3(backupFile);

            // Clean up old backups
            await this.cleanupOldBackups(7);

            console.log('='.repeat(50));
            console.log('✅ Backup completed successfully!');
            console.log('='.repeat(50));

            return { success: true, file: backupFile };

        } catch (error) {
            console.error('❌ Backup failed:', error);
            return { success: false, error: error.message };
        }
    }
}

// Run backup if called directly
if (require.main === module) {
    const backup = new BackupService();
    backup.runBackup().then(result => {
        if (result.success) {
            process.exit(0);
        } else {
            process.exit(1);
        }
    });
}

module.exports = BackupService;