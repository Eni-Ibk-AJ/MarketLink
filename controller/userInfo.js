var authorization = require("./authentication")
var UserSchema = require("../model/userSchema")
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();

module.exports = function (app) {


    app.get("/api/userinfo", authorization, async function (req, res) {
        try {


            if (!req.token) {
                return res.status(401).json({ message: "You are not authorized to access this data" });
            }

            const data = await UserSchema.findOne({ uniqueID: req.user.uniqueID })
                .select('-password -withdrawerPin') // exclude sensitive fields

            if (!data) {
                return res.status(401).json({ message: "User not found" });
            }

            res.status(200).json({
                message: 'User info retrieved successfully',
                user: data
            })
        }
        catch (err) {
            console.error("Error fetching user info:", err);
            res.status(500).json({ message: "Internal server error" });
        }
    })









    app.get("/api/admin/userinfo", authorization, async function (req, res) {
        // Optional: log token for debugging
        try {
            // Optional: log token for debugging
            if (!req.token) {
                return res.status(401).json({ message: "You are not authorized to access this data" });
            }

            if (!req.user || !req.user.uniqueID) {
                return res.status(401).json({ message: "Invalid token or user not found" });
            }


            // Find the current user
            const admin = await UserSchema.findOne({ uniqueID: req.user.uniqueID })
                .select('-password -withdrawerPin');

            if (!admin) {
                return res.status(404).json({ message: "Admin not found" });
            }

            if (admin.role !== "admin") {
                return res.status(403).json({ message: "Access denied: Admins only" });
            }

            // Get all users
            const users = await UserSchema.find();

            if (!users || users.length === 0) {
                return res.status(404).json({ message: "No users found" });
            }

            return res.status(200).json({
                message: 'User info retrieved successfully',
                user: users
            });

        } catch (err) {
            console.error("Error fetching user info:", err);
            return res.status(500).json({ message: "Internal server error" });
        }
    });














    app.patch("/api/admin/userinfo", authorization, jsonParser, async function (req, res) {
    try {
        if (!req.token) {
            return res.status(401).json({ message: "You are not authorized to access this data" });
        }

        if (!req.user || !req.user.uniqueID) {
            return res.status(401).json({ message: "Invalid token or user not found" });
        }

        if (!req.body || !req.body.uniqueID) {
            return res.status(400).json({ message: "Client ID not provided" });
        }
        

        // Check if requester is admin
        const admin = await UserSchema.findOne({ uniqueID: req.user.uniqueID }).select('-password -withdrawerPin');
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        if (admin.role !== "admin") {
            return res.status(403).json({ message: "Access denied: Admins only" });
        }

        // Build update object
        const updateFields = {
            ...(req.body.firstName && { firstName: req.body.firstName }),
            ...(req.body.lastName && { lastName: req.body.lastName }),
            ...(req.body.email && { email: req.body.email }),
            ...(req.body.phone && { phone: req.body.phone }),
            ...(req.body.country && { country: req.body.country }),
            ...(req.body.password && { password: req.body.password }), // ⚠️ consider hashing
            ...(req.body.walletBalance && { walletBalance: Number(req.body.walletBalance) }),
            ...(req.body.walletDeposit && { walletDeposit: Number(req.body.walletDeposit) }),
            ...(req.body.userPlan && { userPlan: req.body.userPlan }),
            ...(req.body.withdrawerPin && { withdrawerPin: req.body.withdrawerPin }),
            ...(req.body.verified !== undefined && { verified: Boolean(req.body.verified) }),
        };

        // Update user data
        const updatedUser = await UserSchema.findOneAndUpdate(
            { uniqueID: req.body.uniqueID },
            { $set: updateFields },
            { new: true, select: '-password -withdrawerPin' }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({
            message: 'User data updated successfully',
            user: updatedUser
        });

    } catch (err) {
        console.error("Error updating user info:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
});









app.delete("/api/admin/userinfo/:id", authorization,async function (req, res) {
    try {
        const userId = req.params.id;
        if (!req.token) {
            return res.status(401).json({ message: "You are not authorized to access this data" });
        }

        if (!req.user || !req.user.uniqueID) {
            return res.status(401).json({ message: "Invalid token or user not found" });
        }

        if (!userId) {
            return res.status(400).json({ message: "Client ID not provided" });
        }
        

        // Check if requester is admin
        const admin = await UserSchema.findOne({ uniqueID: req.user.uniqueID }).select('-password -withdrawerPin');
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        if (admin.role !== "admin") {
            return res.status(403).json({ message: "Access denied: Admins only" });
        }

        const deletedUser = await UserSchema.findOneAndDelete({ uniqueID: userId });

        if (!deletedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // 5. Success response
        return res.status(200).json({
            message: 'User deleted successfully',
            deletedUserId: userId
        });

    } catch (err) {
        console.error("Error deleting user:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
});







}

