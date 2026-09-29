require('dotenv').config();
var express = require("express")
var cors = require("cors")
var mongoose = require("mongoose")



const registerController = require("./controller/register");
const userInfoController = require("./controller/userInfoController");
const marketController = require("./controller/marketController");
const productController = require("./controller/productController");
const orderController = require("./controller/orderController");
const reviewController = require("./controller/reviewController");
const adminController = require("./controller/adminController");


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error(err));

var app = express()

const allowedOrigins = [
    'http://localhost:3000', 
    'http://localhost:5173', 
    'https://marketlink-orcin.vercel.app/',
    // 'https://teslasafebroker.com',
    //  'https://api.teslasafebroker.com', 
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'], 
}));

// controller

// for the registration 
registerController(app);
userInfoController(app);
marketController(app);
productController(app);
orderController(app);
reviewController(app); 
adminController(app);



const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`MarketLink backend running on port ${PORT}`);
});


