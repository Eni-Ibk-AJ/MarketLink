const mongoose = require('mongoose');

// Location sub-schema for Maps (Google Maps / OpenStreetMap)
const locationSchema = new mongoose.Schema({
    address: { type: String, default: '' },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null }
}, { _id: false });

// Main User Schema
const userSchema = new mongoose.Schema({
    uniqueID: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    
    // Core Role: 'customer', 'farmer', 'admin'
    role: { 
        type: String, 
        enum: ['customer', 'farmer', 'admin'], 
        default: 'customer' 
    },

    // Account Status (Admins can approve/suspend accounts)
    status: { 
        type: String, 
        enum: ['pending', 'active', 'suspended'], 
        default: 'active' 
    },
    verified: { type: Boolean, default: false },

    // --- Customer Specific Fields ---
    favorites: {
        farmers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
    },
    deliveryAddress: { type: String, default: '' },

    // --- Farmer Specific Fields ---
    farmerProfile: {
        stallName: { type: String, default: '' },
        description: { type: String, default: '' },
        markets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Market' }], // Associated markets
        operatingDays: [{ type: String }], // e.g., ['Saturdays', 'Sundays']
        pickupTimeSlots: [{ type: String }], // e.g., ['09:00 AM - 12:00 PM', '02:00 PM - 05:00 PM']
        cutoffTime: { type: String, default: '' }, // Order cutoff timing
        location: { type: locationSchema, default: () => ({}) }
    }
}, { 
    timestamps: true 
});

const User = mongoose.model("User", userSchema);

module.exports = User;