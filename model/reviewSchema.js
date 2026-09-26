const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    customer: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    farmer: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    product: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product' // Optional: if review is for a specific product
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    farmerResponse: {
        comment: { type: String, default: '' },
        respondedAt: { type: Date }
    }
}, { 
    timestamps: true 
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;