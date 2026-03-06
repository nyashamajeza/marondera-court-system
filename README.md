# Marondera Magistrate Court Digital Ecosystem

## Overview
A comprehensive cloud-based case management system for Marondera Magistrate Court, Zimbabwe.

## Features
- 📤 **Evidence Upload Portal** - Litigants can securely upload case documents
- 📊 **Case Activity Dashboard** - Real-time case status display
- 💾 **Secure Cloud Backup** - Automated backups to AWS S3
- 👥 **User Management** - Role-based access control
- 📈 **Reports & Analytics** - Case statistics and trends

## Tech Stack
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Frontend**: EJS, HTML5, CSS3, JavaScript
- **Cloud**: AWS S3, EC2 (or Lightsail)
- **Authentication**: Session-based with bcrypt

## Installation

### Prerequisites
- Node.js v18+
- MongoDB
- AWS Account

### Local Setup
1. Clone repository
2. Run `npm install`
3. Create `.env` file
4. Run `npm run create-admin`
5. Run `npm run seed` (optional)
6. Run `npm run dev`

### Production Deployment
See deployment guide in `/docs/deployment.md`

## API Endpoints

### Public
- `GET /api/cases/dashboard` - Get today's cases
- `GET /api/cases/number/:caseNumber` - Lookup case
- `POST /api/upload/upload` - Upload evidence

### Admin (Protected)
- `GET /admin/dashboard` - Admin dashboard
- `GET /admin/cases` - Case management
- `POST /admin/cases` - Create case
- `GET /admin/reports` - View reports

## Backup Strategy
- Daily automated backups to S3
- 30-day retention in S3 Standard
- Archive to Glacier after 30 days
- 1-year retention policy

## Security Features
- Password hashing with bcrypt
- Session-based authentication
- S3 bucket policies for secure access
- HTTPS enforced in production
- Input validation and sanitization

## Contributing
For court staff: Contact IT department for access

## License
Property of Marondera Magistrate Court

## Contact
For support: it@maronderacourt.gov.zw