const bodyParser = require('body-parser');
const Product = require('../model/productSchema');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');

const jsonParser = bodyParser.json();

module.exports = function (app) {

    // ==========================================
    // 1. GET ALL PRODUCTS (Public / Customers)
    // Filters: category, farmer, market, minPrice, maxPrice, search (query)
    // ==========================================
    app.get("/api/products", async function (req, res) {
        try {
            const { category, farmerId, minPrice, maxPrice, search } = req.query;
            let filter = { isAvailable: true };

            if (category) {
                filter.category = category;
            }

            if (farmerId) {
                filter.farmer = farmerId;
            }

            if (minPrice || maxPrice) {
                filter.price = {};
                if (minPrice) filter.price.$gte = Number(minPrice);
                if (maxPrice) filter.price.$lte = Number(maxPrice);
            }

            if (search) {
                filter.name = { $regex: search, $options: 'i' }; // Case-insensitive search
            }

            const products = await Product.find(filter)
                .populate('farmer', 'firstName lastName farmerProfile phone email')
                .sort({ createdAt: -1 });

            return res.status(200).json({
                count: products.length,
                products
            });

        } catch (err) {
            console.error("❌ Error fetching products:", err);
            return res.status(500).json({ message: "Internal server error." });
        }
    });

    // ==========================================
    // 2. GET SINGLE PRODUCT BY ID
    // ==========================================
    app.get("/api/products/:id", async function (req, res) {
        try {
            const product = await Product.findById(req.params.id)
                .populate('farmer', 'firstName lastName farmerProfile phone email');

            if (!product) {
                return res.status(404).json({ message: "Product not found." });
            }

            return res.status(200).json({ product });
        } catch (err) {
            console.error("❌ Error fetching product details:", err);
            return res.status(500).json({ message: "Internal server error." });
        }
    });

    // ==========================================
    // 3. GET FARMER'S OWN INVENTORY (Farmer Only)
    // ==========================================
    app.get("/api/farmer/products", authMiddleware, authorizeRoles('farmer'), async function (req, res) {
        try {
            const products = await Product.find({ farmer: req.user.id }).sort({ createdAt: -1 });
            return res.status(200).json({
                count: products.length,
                products
            });
        } catch (err) {
            console.error("❌ Error fetching farmer inventory:", err);
            return res.status(500).json({ message: "Internal server error." });
        }
    });

    // ==========================================
    // 4. ADD PRODUCT (Farmer Only)
    // ==========================================
    app.post("/api/products", authMiddleware, authorizeRoles('farmer'), jsonParser, async function (req, res) {
        try {
            const { name, category, description, price, unit, stockQuantity, imageUrl } = req.body;

            if (!name || !category || price === undefined || !unit || stockQuantity === undefined) {
                return res.status(400).json({ message: "Name, category, price, unit, and stock quantity are required." });
            }

            const newProduct = new Product({
                farmer: req.user.id,
                name,
                category,
                description: description || '',
                price: Number(price),
                unit,
                stockQuantity: Number(stockQuantity),
                imageUrl: imageUrl || '',
                isAvailable: Number(stockQuantity) > 0
            });

            const savedProduct = await newProduct.save();

            return res.status(201).json({
                message: "Product added successfully.",
                product: savedProduct
            });

        } catch (err) {
            console.error("❌ Error adding product:", err);
            return res.status(500).json({ message: "Internal server error." });
        }
    });

    // ==========================================
    // 5. UPDATE PRODUCT (Farmer Only - Ownership Check)
    // ==========================================
    app.put("/api/products/:id", authMiddleware, authorizeRoles('farmer'), jsonParser, async function (req, res) {
        try {
            const { name, category, description, price, unit, stockQuantity, isAvailable, imageUrl } = req.body;

            const product = await Product.findById(req.params.id);
            if (!product) {
                return res.status(404).json({ message: "Product not found." });
            }

            // Ensure the requesting farmer owns this product
            if (product.farmer.toString() !== req.user.id) {
                return res.status(403).json({ message: "Unauthorized: You can only edit your own products." });
            }

            if (name) product.name = name;
            if (category) product.category = category;
            if (description !== undefined) product.description = description;
            if (price !== undefined) product.price = Number(price);
            if (unit) product.unit = unit;
            if (stockQuantity !== undefined) {
                product.stockQuantity = Number(stockQuantity);
                // Automatically toggle availability if stock drops to zero
                if (Number(stockQuantity) === 0) product.isAvailable = false;
            }
            if (isAvailable !== undefined) product.isAvailable = isAvailable;
            if (imageUrl !== undefined) product.imageUrl = imageUrl;

            const updatedProduct = await product.save();

            return res.status(200).json({
                message: "Product updated successfully.",
                product: updatedProduct
            });

        } catch (err) {
            console.error("❌ Error updating product:", err);
            return res.status(500).json({ message: "Internal server error." });
        }
    });

    // ==========================================
    // 6. DELETE PRODUCT (Farmer or Admin)
    // ==========================================
    app.delete("/api/products/:id", authMiddleware, authorizeRoles('farmer', 'admin'), async function (req, res) {
        try {
            const product = await Product.findById(req.params.id);
            if (!product) {
                return res.status(404).json({ message: "Product not found." });
            }

            // Farmers can only delete their own product; Admin can delete any product
            if (req.user.role === 'farmer' && product.farmer.toString() !== req.user.id) {
                return res.status(403).json({ message: "Unauthorized: You can only delete your own products." });
            }

            await Product.findByIdAndDelete(req.params.id);

            return res.status(200).json({ message: "Product deleted successfully." });

        } catch (err) {
            console.error("❌ Error deleting product:", err);
            return res.status(500).json({ message: "Internal server error." });
        }
    });
};