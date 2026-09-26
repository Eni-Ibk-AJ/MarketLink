const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    farmer: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    name: { type: String, required: true },
    category: { 
        type: String, 
        required: true,
        enum: ['Vegetables', 'Fruits', 'Dairy', 'Baked Goods', 'Meat & Poultry', 'Herbs & Spices', 'Others'] 
    },
    description: { type: String, default: '' },
    price: { type: Number, required: true },
    unit: { type: String, required: true }, // e.g., 'kg', 'lb', 'bunch', 'piece', 'liter'
    stockQuantity: { type: Number, required: true, default: 0 },
    isAvailable: { type: Boolean, default: true },
    imageUrl: { type: String, default: '' }
}, { 
    timestamps: true 
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;