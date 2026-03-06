// routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const { 
    upload, 
    uploadEvidence, 
    getCaseDocuments, 
    deleteDocument,
    getUploadStats 
} = require('../controllers/uploadController');

// Upload evidence
router.post('/upload', upload.single('evidence'), uploadEvidence);

// Get documents for a case
router.get('/documents/:caseNumber', getCaseDocuments);

// Delete document
router.delete('/documents/:documentId', deleteDocument);

// Get upload statistics
router.get('/stats', getUploadStats);

module.exports = router;