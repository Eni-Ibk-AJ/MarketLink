const mongoose = require('mongoose');

const marketSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    location: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true }
    },
    operatingDays: [{ type: String }], // e.g., ['Saturday', 'Sunday']
    openingTime: { type: String, required: true }, // e.g., '08:00 AM'
    closingTime: { type: String, required: true }, // e.g., '02:00 PM'
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true }
}, { 
    timestamps: true 
});

const Market = mongoose.model('Market', marketSchema);
module.exports = Market;