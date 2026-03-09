# Instead of hardcoding keys, use environment variables
cat > .env << EOL
PORT=3000
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/marondera_court
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
AWS_REGION=af-south-1
AWS_BUCKET_NAME=${AWS_BUCKET_NAME}
AWS_BACKUP_BUCKET=${AWS_BACKUP_BUCKET}
SESSION_SECRET=$(openssl rand -base64 32)
EOL