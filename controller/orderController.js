const bodyParser = require('body-parser');
const Order = require('../model/orderSchema');
const Product = require('../model/productSchema');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');

const jsonParser = bodyParser.json();

module.exports = function (app) {

    // ==========================================
    // 1. PLACE PRE-ORDER (Customer Only)
    // ==========================================
    app.post("/api/orders", authMiddleware, authorizeRoles('customer'), jsonParser, async function (req, res) {
        try {
            const { farmerId, marketId, items, pickupDate, pickupTimeSlot, note } = req.body;

            if (!farmerId || !marketId || !items || !Array.isArray(items) || items.length === 0 || !pickupDate || !pickupTimeSlot) {
                return res.status(400).json({ message: "Farmer ID, market ID, items list, pickup date, and pickup time slot are required." });
            }

            let totalAmount = 0;
            const orderItems = [];

            // Validate inventory and calculate total cost
            for (const item of items) {
                const product = await Product.findById(item.productId);
                if (!product) {
                    return res.status(404).json({ message: `Product not found: ${item.productId}` });
                }

                if (!product.isAvailable || product.stockQuantity < item.quantity) {
                    return res.status(400).json({ 
                        message: `Insufficient stock for product '${product.name}'. Available: ${product.stockQuantity}` 
                    });
                }

                const itemTotal = product.price * item.quantity;
                totalAmount += itemTotal;

                orderItems.push({
                    product: product._id,
                    quantity: item.quantity,
                    priceAtPurchase: product.price
                });

                // Deduct stock quantity
                product.stockQuantity -= item.quantity;
                if (product.stockQuantity === 0) {
                    product.isAvailable = false;
                }
                await product.save();
            }

            const newOrder = new Order({
                customer: req.user.id,
                farmer: farmerId,
                market: marketId,
                items: orderItems,
                totalAmount,
                pickupDate,
                pickupTimeSlot,
                note: note || '',
                status: 'placed'
            });

            const savedOrder = await newOrder.save();

            return res.status(201).json({
                message: "Pre-order placed successfully.",
                order: savedOrder
            });

        } catch (err) {
            console.error("❌ Error placing order:", err);
            return res.status(500).json({ message: "Internal server error." });
        }
    });

    // ==========================================
    // 2. GET CUSTOMER ORDERS (Customer Only)
    // ==========================================
    app.get("/api/customer/orders", authMiddleware, authorizeRoles('customer'), async function (req, res) {
        try {
            const orders = await Order.find({ customer: req.user.id })
                .populate('farmer', 'firstName lastName farmerProfile phone email')
                .populate('market', 'name address location')
                .populate('items.product', 'name category unit imageUrl')
                .sort({ createdAt: -1 });

            return res.status(200).json({
                count: orders.length,
                orders
            });
        } catch (err) {
            console.error("❌ Error fetching customer orders:", err);
            return res.status(500).json({ message: "Internal server error." });
        }
    });

    // ==========================================
    // 3. GET FARMER INCOMING ORDERS & METRICS (Farmer Only)
    // ==========================================
    app.get("/api/farmer/orders", authMiddleware, authorizeRoles('farmer'), async function (req, res) {
        try {
            const orders = await Order.find({ farmer: req.user.id })
                .populate('customer', 'firstName lastName email phone')
                .populate('market', 'name address')
                .populate('items.product', 'name category unit')
                .sort({ createdAt: -1 });

            // Calculate Dashboard Metrics
            const totalOrders = orders.length;
            const pendingOrders = orders.filter(o => o.status === 'placed' || o.status === 'accepted').length;
            const totalRevenue = orders
                .filter(o => o.status === 'completed')
                .reduce((sum, o) => sum + o.totalAmount, 0);

            return res.status(200).json({
                metrics: {
                    totalOrders,
                    pendingOrders,
                    totalRevenue
                },
                orders
            });
        } catch (err) {
            console.error("❌ Error fetching farmer orders:", err);
            return res.status(500).json({ message: "Internal server error." });
        }
    });

    // ==========================================
    // 4. UPDATE ORDER STATUS (Farmer & Customer)
    // Status Flow: placed -> accepted -> ready_for_pickup -> completed
    // Cancellation: Customer or Farmer can set 'cancelled' / 'declined'
    // ==========================================
    app.patch("/api/orders/:id/status", authMiddleware, jsonParser, async function (req, res) {
        try {
            const { status } = req.body;
            const allowedStatuses = ['accepted', 'declined', 'ready_for_pickup', 'completed', 'cancelled'];

            if (!status || !allowedStatuses.includes(status)) {
                return res.status(400).json({ message: "Invalid status value provided." });
            }

            const order = await Order.findById(req.params.id);
            if (!order) {
                return res.status(404).json({ message: "Order not found." });
            }

            const userId = req.user.id;
            const isFarmer = req.user.role === 'farmer' && order.farmer.toString() === userId;
            const isCustomer = req.user.role === 'customer' && order.customer.toString() === userId;

            if (!isFarmer && !isCustomer) {
                return res.status(403).json({ message: "Unauthorized to update this order." });
            }

            // Customer cancellation rules
            if (isCustomer && status !== 'cancelled') {
                return res.status(403).json({ message: "Customers can only cancel orders." });
            }

            // Restore inventory stock if order is cancelled or declined
            if ((status === 'cancelled' || status === 'declined') && order.status !== 'cancelled' && order.status !== 'declined') {
                for (const item of order.items) {
                    const product = await Product.findById(item.product);
                    if (product) {
                        product.stockQuantity += item.quantity;
                        product.isAvailable = true;
                        await product.save();
                    }
                }
            }

            order.status = status;
            const updatedOrder = await order.save();

            return res.status(200).json({
                message: `Order status updated to ${status}.`,
                order: updatedOrder
            });

        } catch (err) {
            console.error("❌ Error updating order status:", err);
            return res.status(500).json({ message: "Internal server error." });
        }
    });
};