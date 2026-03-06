// models/Case.js
const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
    caseNumber: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    parties: {
        plaintiff: {
            name: { type: String, required: true },
            contact: String,
            representation: String
        },
        defendant: {
            name: { type: String, required: true },
            contact: String,
            representation: String
        }
    },
    caseType: {
        type: String,
        enum: ['Small Claims', 'Civil', 'Criminal', 'Family', 'Traffic'],
        required: true
    },
    filingDate: {
        type: Date,
        default: Date.now
    },
    hearingDate: Date,
    courtroom: {
        type: String,
        default: 'TBD'
    },
    magistrate: {
        type: String,
        default: 'TBD'
    },
    status: {
        type: String,
        enum: ['Filed', 'Scheduled', 'In Progress', 'Adjourned', 'Completed', 'Closed'],
        default: 'Filed'
    },
    waitingTime: {
        type: Number,
        default: 0
    },
    description: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
caseSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Case', caseSchema);