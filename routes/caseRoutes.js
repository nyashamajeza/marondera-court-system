// routes/caseRoutes.js
const express = require('express');
const router = express.Router();
const Case = require('../models/Case');
const Document = require('../models/Document');

// Get all cases for dashboard
router.get('/dashboard', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get cases scheduled for today
        const cases = await Case.find({
            hearingDate: {
                $gte: today,
                $lt: tomorrow
            }
        }).sort({ courtroom: 1, waitingTime: 1 });

        // Also include in-progress cases from previous days
        const inProgressCases = await Case.find({
            status: 'In Progress'
        }).sort({ hearingDate: 1 });

        // Combine and remove duplicates
        const allCases = [...cases];
        inProgressCases.forEach(c => {
            if (!allCases.find(ac => ac._id.toString() === c._id.toString())) {
                allCases.push(c);
            }
        });

        res.json({
            success: true,
            date: new Date().toLocaleDateString(),
            totalCases: allCases.length,
            cases: allCases
        });

    } catch (error) {
        console.error('Error fetching dashboard cases:', error);
        res.status(500).json({ error: 'Failed to fetch cases' });
    }
});

// Get case by ID
router.get('/:id', async (req, res) => {
    try {
        const case_ = await Case.findById(req.params.id);
        if (!case_) {
            return res.status(404).json({ error: 'Case not found' });
        }
        res.json({ success: true, case: case_ });
    } catch (error) {
        console.error('Error fetching case:', error);
        res.status(500).json({ error: 'Failed to fetch case' });
    }
});

// Get case by case number
router.get('/number/:caseNumber', async (req, res) => {
    try {
        const case_ = await Case.findOne({ 
            caseNumber: req.params.caseNumber.toUpperCase() 
        });
        
        if (!case_) {
            return res.status(404).json({ error: 'Case not found' });
        }

        // Get documents for this case
        const documents = await Document.find({ 
            caseNumber: req.params.caseNumber.toUpperCase() 
        }).sort({ uploadDate: -1 });

        res.json({ 
            success: true, 
            case: case_,
            documents: documents
        });
    } catch (error) {
        console.error('Error fetching case:', error);
        res.status(500).json({ error: 'Failed to fetch case' });
    }
});

// Update case status
router.patch('/:id/status', async (req, res) => {
    try {
        const { status, waitingTime, courtroom } = req.body;
        
        const case_ = await Case.findByIdAndUpdate(
            req.params.id,
            {
                status,
                waitingTime,
                courtroom,
                updatedAt: new Date()
            },
            { new: true }
        );

        if (!case_) {
            return res.status(404).json({ error: 'Case not found' });
        }

        res.json({
            success: true,
            message: 'Case status updated',
            case: case_
        });

    } catch (error) {
        console.error('Error updating case:', error);
        res.status(500).json({ error: 'Failed to update case' });
    }
});

// Create new case
router.post('/', async (req, res) => {
    try {
        const caseData = req.body;
        
        // Generate case number if not provided
        if (!caseData.caseNumber) {
            const year = new Date().getFullYear();
            const count = await Case.countDocuments() + 1;
            caseData.caseNumber = `SMC/${year}/${count.toString().padStart(4, '0')}`;
        }

        const newCase = new Case(caseData);
        await newCase.save();

        res.status(201).json({
            success: true,
            message: 'Case created successfully',
            case: newCase
        });

    } catch (error) {
        console.error('Error creating case:', error);
        res.status(500).json({ error: 'Failed to create case' });
    }
});

// Get case statistics
router.get('/stats/overview', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const stats = {
            total: await Case.countDocuments(),
            filed: await Case.countDocuments({ status: 'Filed' }),
            scheduled: await Case.countDocuments({ status: 'Scheduled' }),
            inProgress: await Case.countDocuments({ status: 'In Progress' }),
            completed: await Case.countDocuments({ status: 'Completed' }),
            closed: await Case.countDocuments({ status: 'Closed' }),
            todayHearings: await Case.countDocuments({
                hearingDate: {
                    $gte: today,
                    $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                }
            })
        };

        res.json({ success: true, stats });

    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

module.exports = router;