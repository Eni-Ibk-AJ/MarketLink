const bodyParser = require('body-parser');
const Market = require('../model/marketSchema');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');

const jsonParser = bodyParser.json();

module.exports = function (app) {

    // ==========================================
    // 1. GET ALL MARKETS (Public / Customers / Farmers)
    // Supports filter by day via query param: /api/markets?day=Saturday
    // ==========================================
    app.get("/api/markets", async function (req, res) {
        try {
            const { day } = req.query;
            let filter = { isActive: true };

            if (day) {
                filter.operatingDays = { $in: [day] };
            }

            const markets = await Market.find(filter).sort({ name: 1 });
            return res.status(200).json({
                count: markets.length,
                markets
            });
        } catch (err) {
            console.error("❌ Error fetching markets:", err);
            return res.status(500).json({ message: "Internal server error." });
        }
    });

    // ==========================================
    // 2. GET SINGLE MARKET BY ID
    // ==========================================
    app.get("/api/markets/:id", async function (req, res) {
        try {
            const market = await Market.findById(req.params.id);
            if (!market) {
                return res.status(404).json({ message: "Market not found." });
            }
            return res.status(200).json({ market });
        } catch (err) {
            console.error("❌ Error fetching market details:", err);
            return res.status(500).json({ message: "Internal server error." });
        }
    });

    // ==========================================
    // 3. CREATE NEW MARKET (Admin Only)
    // ==========================================
    app.post("/api/markets", authMiddleware, authorizeRoles('admin'), jsonParser, async function (req, res) {
        try {
            const { name, address, latitude, longitude, operatingDays, openingTime, closingTime, description } = req.body;

            if (!name || !address || latitude === undefined || longitude === undefined || !openingTime || !closingTime) {
                return res.status(400).json({ message: "Name, address, latitude, longitude, opening time, and closing time are required." });
            }

            const newMarket = new Market({
                name,
                address,
                location: {
                    latitude: Number(latitude),
                    longitude: Number(longitude)
                },
                operatingDays: operatingDays || [],
                openingTime,
                closingTime,
                description: description || ''
            });

            const savedMarket = await newMarket.save();
            return res.status(201).json({
                message: "Market created successfully.",
                market: savedMarket
            });

        } catch (err) {
            console.error("❌ Error creating market:", err);
            return res.status(500).json({ message: "Internal server error." });
        }
    });

    // ==========================================
    // 4. UPDATE MARKET (Admin Only)
    // ==========================================
    app.put("/api/markets/:id", authMiddleware, authorizeRoles('admin'), jsonParser, async function (req, res) {
        try {
            const { name, address, latitude, longitude, operatingDays, openingTime, closingTime, description, isActive } = req.body;

            const market = await Market.findById(req.params.id);
            if (!market) {
                return res.status(404).json({ message: "Market not found." });
            }

            if (name) market.name = name;
            if (address) market.address = address;
            if (latitude !== undefined) market.location.latitude = Number(latitude);
            if (longitude !== undefined) market.location.longitude = Number(longitude);
            if (operatingDays) market.operatingDays = operatingDays;
            if (openingTime) market.openingTime = openingTime;
            if (closingTime) market.closingTime = closingTime;
            if (description !== undefined) market.description = description;
            if (isActive !== undefined) market.isActive = isActive;

            const updatedMarket = await market.save();
            return res.status(200).json({
                message: "Market updated successfully.",
                market: updatedMarket
            });

        } catch (err) {
            console.error("❌ Error updating market:", err);
            return res.status(500).json({ message: "Internal server error." });
        }
    });

    // ==========================================
    // 5. DELETE MARKET (Admin Only)
    // ==========================================
    app.delete("/api/markets/:id", authMiddleware, authorizeRoles('admin'), async function (req, res) {
        try {
            const deletedMarket = await Market.findByIdAndDelete(req.params.id);
            if (!deletedMarket) {
                return res.status(404).json({ message: "Market not found." });
            }
            return res.status(200).json({ message: "Market removed successfully." });
        } catch (err) {
            console.error("❌ Error deleting market:", err);
            return res.status(500).json({ message: "Internal server error." });
        }
    });
};