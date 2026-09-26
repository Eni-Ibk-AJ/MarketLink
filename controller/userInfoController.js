const bodyParser = require('body-parser');
const User = require('../model/userSchema');
const Product = require('../model/productSchema');
const Market = require('../model/marketSchema');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');

const jsonParser = bodyParser.json();

module.exports = function (app) {

    // ==========================================
    // 1. GET CURRENT USER PROFILE
    // ==========================================
    app.get("/api/user/profile", authMiddleware, async function (req, res) {
        try {
            const user = await User.findById(req.user.id)
                .select('-password')
                .populate('favorites.farmers', 'firstName lastName farmerProfile')
                .populate('favorites.products', 'name price unit category imageUrl');

            if (!user) return res.status(404).json({ message: "User not found." });
            return res.status(200).json({ user });
        } catch (err) {
            console.error("❌ Error fetching profile:", err);
            return res.status(500).json({ message: "Internal server error." });
        }
    });

    // ==========================================
    // 2. UPDATE FARMER PROFILE & STALL LOCATION
    // ==========================================
    app.put("/api/farmer/profile", authMiddleware, authorizeRoles('farmer'), jsonParser, async function (req, res) {
        try {
            const { stallName, description, markets, operatingDays, pickupTimeSlots, cutoffTime, address, latitude, longitude } = req.body;

            const user = await User.findById(req.user.id);
            if (!user) return res.status(404).json({ message: "User not found." });

            user.farmerProfile = {
                stallName: stallName || user.farmerProfile.stallName,
                description: description !== undefined ? description : user.farmerProfile.description,
                markets: markets || user.farmerProfile.markets,
                operatingDays: operatingDays || user.farmerProfile.operatingDays,
                pickupTimeSlots: pickupTimeSlots || user.farmerProfile.pickupTimeSlots,
                cutoffTime: cutoffTime !== undefined ? cutoffTime : user.farmerProfile.cutoffTime,
                location: {
                    address: address || user.farmerProfile.location?.address || '',
                    latitude: latitude !== undefined ? Number(latitude) : user.farmerProfile.location?.latitude,
                    longitude: longitude !== undefined ? Number(longitude) : user.farmerProfile.location?.longitude
                }
            };

            await user.save();
            return res.status(200).json({ message: "Farmer profile updated successfully.", farmerProfile: user.farmerProfile });
        } catch (err) {
            console.error("❌ Error updating farmer profile:", err);
            return res.status(500).json({ message: "Internal server error." });
        }
    });

    // ==========================================
    // 3. TOGGLE FAVORITE (Farmer or Product)
    // ==========================================
    app.post("/api/user/favorites", authMiddleware, authorizeRoles('customer'), jsonParser, async function (req, res) {
        try {
            const { itemType, itemId } = req.body; // itemType: 'farmer' or 'product'

            if (!['farmer', 'product'].includes(itemType) || !itemId) {
                return res.status(400).json({ message: "Invalid payload. Provide itemType ('farmer'|'product') and itemId." });
            }

            const user = await User.findById(req.user.id);
            const listKey = itemType === 'farmer' ? 'farmers' : 'products';

            const index = user.favorites[listKey].indexOf(itemId);
            if (index > -1) {
                user.favorites[listKey].splice(index, 1); // Remove
            } else {
                user.favorites[listKey].push(itemId); // Add
            }

            await user.save();
            return res.status(200).json({ message: "Favorites updated successfully.", favorites: user.favorites });
        } catch (err) {
            console.error("❌ Error updating favorites:", err);
            return res.status(500).json({ message: "Internal server error." });
        }
    });

    // ==========================================
    // 4. BASIC AI ASSISTANT / CHATBOT
    // ==========================================
    app.post("/api/ai/assistant", jsonParser, async function (req, res) {
        try {
            const { query } = req.body;
            if (!query) return res.status(400).json({ message: "Query text is required." });

            const lowerQuery = query.toLowerCase();

            // Simple pattern-based context retrieval
            if (lowerQuery.includes('market') || lowerQuery.includes('timing') || lowerQuery.includes('days')) {
                const markets = await Market.find({ isActive: true }).select('name operatingDays openingTime closingTime address');
                return res.status(200).json({
                    answer: "Here are the active market details and schedule:",
                    data: markets
                });
            }

            if (lowerQuery.includes('product') || lowerQuery.includes('stock') || lowerQuery.includes('available')) {
                const products = await Product.find({ isAvailable: true }).limit(10).select('name category price unit stockQuantity');
                return res.status(200).json({
                    answer: "Here are some popular products currently in stock:",
                    data: products
                });
            }

            return res.status(200).json({
                answer: "I can help you check market operating times, available stock, or finding nearby farmers. Try asking about 'markets' or 'available products'."
            });

        } catch (err) {
            console.error("❌ Error processing AI query:", err);
            return res.status(500).json({ message: "Internal server error." });
        }
    });
};