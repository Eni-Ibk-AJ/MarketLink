const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    product: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product', 
        required: true 
    },
    quantity: { type: Number, required: true },
    priceAtPurchase: { type: Number, required: true }
}, { _id: false });

const orderSchema = new mongoose.Schema({
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
    market: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Market', 
        required: true 
    },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true },
    pickupDate: { type: Date, required: true },
    pickupTimeSlot: { type: String, required: true }, // e.g., '09:00 AM - 10:00 AM'
    status: { 
        type: String, 
        enum: ['placed', 'accepted', 'declined', 'ready_for_pickup', 'completed', 'cancelled'], 
        default: 'placed' 
    },
    note: { type: String, default: '' }
}, { 
    timestamps: true 
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;