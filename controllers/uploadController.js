// controllers/uploadController.js
const multer = require('multer');
const { s3Client } = require('../config/aws');
const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const Document = require('../models/Document');
const Case = require('../models/Case');
const path = require('path');
const crypto = require('crypto');

// Configure multer for Windows
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'image/jpeg', 
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, JPEG, PNG, DOC, and TXT files are allowed.'), false);
    }
};

// Configure multer upload
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
        files: 1
    },
    fileFilter: fileFilter
});

// Generate unique filename for S3
const generateFileName = (originalName, caseNumber) => {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(originalName);
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    return `${caseNumber}_${timestamp}_${randomString}_${sanitizedName}${ext}`;
};

// Upload evidence controller
const uploadEvidence = async (req, res) => {
    try {
        console.log('📤 Upload request received');
        console.log('Body:', req.body);
        console.log('File:', req.file ? req.file.originalname : 'No file');

        const { caseNumber, documentType, litigantName, litigantContact, description } = req.body;
        
        // Validate required fields
        if (!caseNumber || !litigantName || !req.file) {
            return res.status(400).json({ 
                error: 'Missing required fields. Please provide case number, your name, and a file.' 
            });
        }

        // Verify case exists
        const courtCase = await Case.findOne({ caseNumber: caseNumber.toUpperCase().trim() });
        if (!courtCase) {
            return res.status(404).json({ error: 'Case not found. Please check the case number.' });
        }

        // Generate S3 key
        const fileName = generateFileName(req.file.originalname, caseNumber);
        const s3Key = `evidence/${caseNumber}/${fileName}`;

        // Upload to S3 using AWS SDK v3
        const uploadParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: s3Key,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
            Metadata: {
                caseNumber: caseNumber,
                documentType: documentType || 'Evidence',
                uploadedBy: litigantName,
                originalName: req.file.originalname,
                uploadDate: new Date().toISOString()
            }
        };

        console.log('☁️ Uploading to S3...');
        const command = new PutObjectCommand(uploadParams);
        const s3Result = await s3Client.send(command);
        
        // Construct the S3 URL
        const s3Url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
        
        console.log('✅ S3 upload successful:', s3Url);

        // Save document metadata to database
        const document = new Document({
            caseId: courtCase._id,
            caseNumber: caseNumber.toUpperCase(),
            fileName: req.file.originalname,
            fileType: req.file.mimetype,
            fileSize: req.file.size,
            s3Key: s3Key,
            s3Url: s3Url,
            uploadedBy: {
                name: litigantName,
                role: 'Litigant',
                contact: litigantContact || 'Not provided'
            },
            documentType: documentType || 'Evidence',
            description: description || '',
            isBackedUp: true
        });

        await document.save();
        console.log('✅ Document metadata saved to database');

        res.status(201).json({
            success: true,
            message: 'Evidence uploaded successfully',
            document: {
                id: document._id,
                fileName: document.fileName,
                s3Url: document.s3Url,
                uploadDate: document.uploadDate,
                caseNumber: document.caseNumber
            }
        });

    } catch (error) {
        console.error('❌ Upload error:', error);
        res.status(500).json({ 
            error: 'Failed to upload evidence. Please try again.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get documents for a case
const getCaseDocuments = async (req, res) => {
    try {
        const { caseNumber } = req.params;
        
        const documents = await Document.find({ 
            caseNumber: caseNumber.toUpperCase() 
        })
        .sort({ uploadDate: -1 })
        .populate('caseId', 'caseNumber parties status');

        res.json({
            success: true,
            count: documents.length,
            documents: documents
        });

    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
};

// Delete document (with S3 cleanup)
const deleteDocument = async (req, res) => {
    try {
        const { documentId } = req.params;
        
        const document = await Document.findById(documentId);
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Delete from S3
        const deleteParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: document.s3Key
        };
        
        const deleteCommand = new DeleteObjectCommand(deleteParams);
        await s3Client.send(deleteCommand);
        console.log('✅ S3 file deleted:', document.s3Key);

        // Delete from database
        await Document.findByIdAndDelete(documentId);

        res.json({
            success: true,
            message: 'Document deleted successfully'
        });

    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Failed to delete document' });
    }
};

// Get upload statistics
const getUploadStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const stats = {
            total: await Document.countDocuments(),
            today: await Document.countDocuments({
                uploadDate: { $gte: today }
            }),
            byType: await Document.aggregate([
                { $group: { _id: '$documentType', count: { $sum: 1 } } }
            ])
        };

        res.json({ success: true, stats });

    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
};

module.exports = {
    upload,
    uploadEvidence,
    getCaseDocuments,
    deleteDocument,
    getUploadStats
};