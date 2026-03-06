// models/Document.js
const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    caseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Case',
        required: true
    },
    caseNumber: {
        type: String,
        required: true,
        uppercase: true
    },
    fileName: {
        type: String,
        required: true
    },
    fileType: String,
    fileSize: Number,
    s3Key: {
        type: String,
        required: true
    },
    s3Url: String,
    uploadedBy: {
        name: String,
        role: {
            type: String,
            enum: ['Litigant', 'Clerk', 'Magistrate', 'Admin'],
            default: 'Litigant'
        },
        contact: String
    },
    documentType: {
        type: String,
        enum: ['Evidence', 'Pleading', 'Order', 'Affidavit', 'Motion', 'Other'],
        default: 'Evidence'
    },
    uploadDate: {
        type: Date,
        default: Date.now
    },
    isBackedUp: {
        type: Boolean,
        default: true
    },
    description: String
});

module.exports = mongoose.model('Document', documentSchema);