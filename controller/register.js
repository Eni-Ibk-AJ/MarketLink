const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../model/userSchema');

const jsonParser = bodyParser.json();

module.exports = function (app) {

    // ==========================================
    // 1. REGISTER USER (Customer or Farmer)
    // ==========================================
    app.post("/api/register", jsonParser, async function (req, res) {
        try {
            const { firstName, lastName, email, phone, password, role, stallName, description } = req.body;

            // Basic validation
            if (!email || !password || !firstName || !lastName || !phone) {
                return res.status(400).json({ message: "All required fields (firstName, lastName, email, phone, password) must be provided." });
            }

            // Check if user already exists
            const existingUser = await User.findOne({ email: email.toLowerCase() });
            if (existingUser) {
                return res.status(400).json({ message: "An account with this email already exists." });
            }

            // Determine role and status
            const userRole = (role === 'farmer') ? 'farmer' : 'customer';
            // Farmers require admin approval before listing products
            const userStatus = (userRole === 'farmer') ? 'pending' : 'active';

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Generate unique user ID
            const userId = uuidv4();

            // Prepare new user object
            const newUser = new User({
                uniqueID: userId,
                firstName,
                lastName,
                email: email.toLowerCase(),
                phone,
                password: hashedPassword,
                role: userRole,
                status: userStatus,
                verified: true, // Set to false if you enable email verification flow
                farmerProfile: userRole === 'farmer' ? {
                    stallName: stallName || `${firstName}'s Farm Stall`,
                    description: description || ''
                } : undefined
            });

            const savedUser = await newUser.save();

            return res.status(201).json({
                message: userRole === 'farmer' 
                    ? "Farmer registration submitted successfully. Pending admin approval."
                    : "Customer registration successful.",
                user: {
                    id: savedUser._id,
                    uniqueID: savedUser.uniqueID,
                    firstName: savedUser.firstName,
                    lastName: savedUser.lastName,
                    email: savedUser.email,
                    role: savedUser.role,
                    status: savedUser.status
                }
            });

        } catch (err) {
            console.error("❌ Error during registration:", err);
            return res.status(500).json({ message: "Internal server error." });
        }
    });

    // ==========================================
    // 2. ADMIN REGISTER
    // ==========================================
    app.post("/api/admin/register", jsonParser, async function (req, res) {
        try {
            const { firstName, lastName, email, phone, password } = req.body;

            if (!email || !password || !firstName || !lastName) {
                return res.status(400).json({ message: "Email, password, first name, and last name are required." });
            }

            const existingUser = await User.findOne({ email: email.toLowerCase() });
            if (existingUser) {
                return res.status(400).json({ message: "User already exists." });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            const userId = uuidv4();

            const adminUser = new User({
                uniqueID: userId,
                firstName,
                lastName,
                email: email.toLowerCase(),
                phone: phone || '',
                password: hashedPassword,
                role: 'admin',
                status: 'pending', // Requires super admin or system approval
                verified: true
            });

            await adminUser.save();

            return res.status(201).json({
                message: "Admin account request registered. Contact super admin for account activation."
            });

        } catch (err) {
            console.error("❌ Admin Registration error:", err);
            return res.status(500).json({ message: "Internal server error." });
        }
    });

    // ==========================================
    // 3. LOGIN (Customer, Farmer, Admin)
    // ==========================================
    app.post("/api/login", jsonParser, async function (req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ message: "Email and password are required." });
            }

            // Step 1: Find user
            const user = await User.findOne({ email: email.toLowerCase() });
            if (!user) {
                return res.status(401).json({ message: "Invalid email or password." });
            }

            // Step 2: Check password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: "Invalid email or password." });
            }

            // Step 3: Check status
            if (user.status === 'suspended') {
                return res.status(403).json({ message: "Your account has been suspended. Please contact support." });
            }

            if (user.role === 'farmer' && user.status === 'pending') {
                return res.status(403).json({ message: "Your farmer account is currently pending approval by an admin." });
            }

            // Step 4: Generate JWT Token
            const token = jwt.sign(
                {
                    id: user._id,
                    uniqueID: user.uniqueID,
                    email: user.email,
                    role: user.role
                },
                process.env.JWT_SECRET || 'marketlink_secret_key',
                { expiresIn: '7d' }
            );

            // Step 5: Send response
            return res.status(200).json({
                message: "Login successful.",
                token,
                user: {
                    id: user._id,
                    uniqueID: user.uniqueID,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                    status: user.status,
                    farmerProfile: user.role === 'farmer' ? user.farmerProfile : undefined
                }
            });

        } catch (err) {
            console.error("❌ Login error:", err);
            return res.status(500).json({ message: "Internal server error." });
        }
    });
};