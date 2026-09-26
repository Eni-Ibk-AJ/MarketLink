const bodyParser = require('body-parser');
const Review = require('../model/reviewSchema');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');

const jsonParser = bodyParser.json();

module.exports = function (app) {

    // ==========================================
    // 1. ADD REVIEW (Customer Only)
    // ==========================================
    app.post("/api/reviews", authMiddleware, authorizeRoles('customer'), jsonParser, async function (req, res) {
        try {
            const { farmerId, productId, rating, comment } = req.body;

            if (!farmerId || !rating || !comment) {
                return res.status(400).json({ message: "Farmer ID, rating, and comment are required." });
            }

            const newReview = new Review({
                customer: req.user.id,
                farmer: farmerId,
                product: productId || null,
                rating: Number(rating),
                comment
            });

            const savedReview = await newReview.save();
            return res.status(201).json({ message: "Review posted successfully.", review: savedReview });

        } catch (err) {
            console.error("❌ Error posting review:", err);
            return res.status(500).json({ message: "Internal server error." });
        }
    });

    // ==========================================
    // 2. GET REVIEWS FOR A FARMER (Public)
    // ==========================================
    app.get("/api/farmers/:id/reviews", async function (req, res) {
        try {
            const reviews = await Review.find({ farmer: req.params.id })
                .populate('customer', 'firstName lastName')
                .populate('product', 'name')
                .sort({ createdAt: -1 });

            return res.status(200).json({ count: reviews.length, reviews });
        } catch (err) {
            console.error("❌ Error fetching reviews:", err);
            return res.status(500).json({ message: "Internal server error." });
        }
    });

    // ==========================================
    // 3. FARMER RESPONSE TO REVIEW (Farmer Only)
    // ==========================================
    app.post("/api/reviews/:id/respond", authMiddleware, authorizeRoles('farmer'), jsonParser, async function (req, res) {
        try {
            const { comment } = req.body;
            if (!comment) return res.status(400).json({ message: "Response comment is required." });

            const review = await Review.findById(req.params.id);
            if (!review) return res.status(404).json({ message: "Review not found." });

            if (review.farmer.toString() !== req.user.id) {
                return res.status(403).json({ message: "Unauthorized to respond to this review." });
            }

            review.farmerResponse = { comment, respondedAt: new Date() };
            await review.save();

            return res.status(200).json({ message: "Response added successfully.", review });
        } catch (err) {
            console.error("❌ Error responding to review:", err);
            return res.status(500).json({ message: "Internal server error." });
        }
    });
};