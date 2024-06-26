const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const mongoose = require("./models/mongo");
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const UserCollection = require('./models/userModel');
const ShoppingItem = require('./models/shoppingModel');
const crypto = require('crypto');
const multer = require('multer');
const session = require('express-session');
const cookieParser = require('cookie-parser'); // Add cookie-parser
const axios = require('axios');
const router = express.Router();

require('dotenv').config();

const PORT = process.env.PORT;

const app = express();

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, '..')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser()); // Use cookie-parser middleware

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.APP_PASSWORD
    }
});

// Paths to HTML files
const indexPath = path.join(__dirname, "../template/index.html");
const loginPath = path.join(__dirname, "../template/login.html");
const signupPath = path.join(__dirname, "../template/signup.html");
const otpPath = path.join(__dirname, "../template/otp.html");
const forgotPasswordPath = path.join(__dirname, "../template/forgot-password.html");
const resetPasswordPath = path.join(__dirname, "../template/reset-password.html");
const profilePath = path.join(__dirname, "../template/profile.html");
const paymentPath = path.join(__dirname, "../template/payment.html");

// Serve login page
app.get("/", function(req, res) {
    res.sendFile(indexPath);
});

// Serve login page with userId cookie
app.get("/login", function(req, res) {
    const userId = req.cookies.userId || ''; // Get userId from cookies or set it to an empty string if not available
    res.sendFile(loginPath);
});


// Serve signup page
app.get("/signup", function(req, res) {
    res.redirect(`/signup?userId=${req.cookies.userId}`);
});

// Set the directory for templates
app.set('views', path.join(__dirname, '../template/'));

// Set the view engine
app.set('view engine', 'ejs'); // Assuming you're using EJS, change it to 'pug' if you're using Pug


// Serve OTP page
app.get("/otp", function(req, res) {
    // Check if email cookie exists
    if (req.cookies.email) {
        // If email cookie exists, render the OTP page with the email parameter
        res.render('otp', { email: req.cookies.email });
    } else {
        // If email cookie doesn't exist, render the OTP page without the email parameter
        res.sendFile(path.join(__dirname, '../template/otp.html'));
    }
});


// Serve forgot password page
app.get("/forgot-password", function(req, res) {
    res.redirect(`/forgot-password?userId=${req.cookies.userId}`);
});

// Handle GET request for reset password page
app.get("/reset-password", function(req, res) {
    const token = req.query.token;
    res.sendFile(path.join(__dirname, '../template', 'reset-password.html'));
});





// Serve the dogs HTML page
app.get('/shopping-items', (req, res) => {
    res.redirect(`/dogs?userId=${req.cookies.userId}`);
});





// Serve the payment HTML page
app.get('/payment', (req, res) => {
    // Retrieve the user ID from the cookie
    const userId = req.cookies.userId;
    if (!userId) {
        return res.status(400).send('User ID not found in cookies');
    }
    // Send the payment HTML file
    res.sendFile(path.join(__dirname, '../template', 'payment.html'));
});



const generateRandomString = (length) => {
    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex')
        .slice(0, length);
};

// Generate a secret key of length 32 (you can adjust the length as needed)
const secretKey = generateRandomString(32);


// Middleware for session management
app.use(session({
    secret: secretKey,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set secure to true if serving over HTTPS
}));

// Middleware to protect index route
const protectIndexRoute = (req, res, next) => {
    // Check if the user has an active session
    if (req.session.userId) {
        // User is logged in, proceed to next middleware/route handler
        next();
    } else {
        // User is not logged in, redirect to login page
        res.redirect('/login');
    }
};

// Route for logging out
app.post('/logout', (req, res) => {
    // Destroy the session
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            // Handle error if needed
            res.status(500).send('Internal Server Error');
        } else {
            // Clear the session cookie
            res.clearCookie('connect.sid');
            // Redirect the user to the login page after logout
            res.redirect('/login');
        }
    });
});




// Route for rendering the index page
app.get('/', protectIndexRoute, async (req, res) => {
    try {
        // Fetch the user data from the database using the userId
        const user = await UserCollection.findById(req.session.userId);

        // If user is not found, return an error response
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Render the index page with the username
        res.render('../template/index', { username: user.username });
    } catch (error) {
        console.error("Error rendering index page:", error);
        res.status(500).send("Internal Server Error");
    }
});






// Define middleware to extract userId from the request
const extractUserIdMiddleware = (req, res, next) => {
    // Assuming userId is stored in the request headers or cookies
    req.userId = req.session.userId; // Change this based on where userId is stored
    next();
  };

// Use the middleware for all routes
app.use(extractUserIdMiddleware);



// Middleware to attach session secret key to request object
const attachSecretKeyMiddleware = (req, res, next) => {
    req.secretKey = req.session.secretKey;
    next();
};

// Use the middleware for all routes
app.use(attachSecretKeyMiddleware);













// Handle login request
app.post("/login", async function(req, res) {
    const { username, password } = req.body;
    try {
        const user = await UserCollection.findOne({ username });
        if (!user) {
            return res.status(401).send("Invalid credentials no user");
        }
        // Check if OTP is verified
        if (!user.otpVerified) {
            await UserCollection.deleteOne({ _id: user._id });
            res.status(400).send("OTP not verified. Please Sign in and verify your OTP before logging in.");
        }
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            res.status(400).send("Invalid credentials no password");
        }

        // Store actual userId and secretKey in session
        req.session.userId = user._id;

        console.log(user._id);

        // Set a cookie to remember the user's session
        res.cookie('userId', user._id, { httpOnly: true , path: '/', sameSite: 'lax'});


        // Redirect to index page after successful login
        res.redirect('/');
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});





// Route to handle GET request for fetching user ID
app.get('/getUserId', (req, res) => {
    try {
        // Assuming you have access to the user ID through the session
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).send("User ID not found");
        }

        // Send the user ID as a response
        res.status(200).send(userId);
    } catch (error) {
        console.error("Error fetching user ID:", error.message);
        res.status(500).send("Internal Server Error");
    }
});




// Route to fetch the username and profile image
app.get('/getUserData', async (req, res) => {
    try {
        // Assuming you have access to the user ID through the session
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).send("User ID not found");
        }

        // Fetch the user document from the database using the userId
        const user = await UserCollection.findById(userId);

        if (!user) {
            return res.status(404).send("User not found");
        }

        // Construct the user profile object with necessary fields
        const userData = {
            username: user.username,
            email: user.email,
            profileImage: user.profileImage // Assuming profileImage is a URL or file path
            // Add other fields as needed
        };
  
        // Send the user profile data as JSON response
        res.json(userData);

    } catch (error) {
        console.error("Error fetching user data:", error.message);
        res.status(500).send("Internal Server Error");
    }
});









// Route to fetch user data
app.get('/profiledetails', async (req, res) => {
    try {
        let userId = req.query.userId || req.cookies.userId; // Get userId from query parameters or cookies
        
        // Check if userId is provided
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized. User ID not provided' });
        }

        // Fetch user data from the database using the userId
        const user = await UserCollection.findById(userId);

        // If user is not found, return an error response
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Construct the user profile object with necessary fields
        const userProfile = {
            username: user.username,
            email: user.email,
            profileImage: user.profileImage // Assuming profileImage is a URL or file path
            // Add other fields as needed
        };
  
        // Send the user profile data as JSON response
        res.json(userProfile);

    } catch (error) {
        // Handle any errors that occur during the database operation
        res.status(500).json({ message: error.message });
    }
});






/// Set up multer for handling file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '../uploads/'); // Save uploaded files to the 'uploads' directory
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)); // Rename uploaded files
    }
});

const upload = multer({ storage: storage });


// Signup route
app.post('/signup', upload.fields([{ name: 'profile-image', maxCount: 1}, { name: 'upiQR', maxCount: 1}]), async (req, res) => {
    const { username, email, password } = req.body;
    try {
    
        // Check if the username or email already exists
        const existingUser = await UserCollection.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            if (!existingUser.otpVerified) {
                // If email already exists and OTP is not verified, remove the old data
                await UserCollection.deleteOne({ _id: existingUser._id });
                console.log("Existing user data removed:", existingUser);
            } else {
                // If OTP is verified, let the user know that the account already exists
                return res.status(400).send("Account with this email already exists.");
            }
        }


        

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate a random 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();


        // Extract filenames from the uploaded files
        const profileImageFilename = req.files['profile-image'][0].filename;
        const upiQRFilename = req.files['upiQR'][0].filename;


        // Create a new user document for user collection
        const newUser = new UserCollection({
            username,
            email,
            password: hashedPassword,
            profileImage: '../uploads/' + profileImageFilename,
            upiQR: '../uploads/' + upiQRFilename, // Save the filename as the image URL
            otp
        });
        await newUser.save(); // Save the new user to the user collection

        // Send verification email
        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: email,
            subject: 'Account Verification',
            text: `Your OTP for account verification is: ${otp}`
        };
        await transporter.sendMail(mailOptions);

        res.redirect(`/otp?email=${email}`); // Redirect to OTP verification page with email parameter
    } catch (error) {
        console.error("Error occurred during signup:", error);
        res.status(500).send("Internal Server Error");
    }
});











// Verify OTP route
app.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    try {
        // Find the user document in the database
        const user = await UserCollection.findOne({ email, otp });

        if (user) {
            // OTP is valid
            // Update OTP verification status to true
            user.otpVerified = true;
            await user.save();
            // You can perform additional actions here, such as marking the user as verified
            res.redirect("/login");
        } else {
            // OTP is invalid or expired
            // Delete user from the database
            await UserCollection.deleteOne({ email: email }); // Correct syntax for deleting by email
            console.log(`Email is: ${email}`);
            res.status(400).send("Invalid OTP");
        }
    } catch (error) {
        console.error("Error verifying OTP:", error);
        // Delete user from the database if an error occurs
        await UserCollection.deleteOne({ email: email }); // Correct syntax for deleting by email
        res.status(500).send("Internal Server Error");
    }
});

// Handle forgot password request
app.post("/forgot-password", async function(req, res) {
    const { email } = req.body;
    try {
        const user = await UserCollection.findOne({ email });
        if (!user) {
            // If user is not found, return an appropriate error message
            return res.status(404).send("User not found. Please check your email address.");
        }
        
        // Generate a unique token for password reset
        const resetToken = crypto.randomBytes(20).toString('hex');
        
        // Set expiry time for token (e.g., 1 hour from now)
        const tokenExpiry = Date.now() + 3600000; // 1 hour from now
        
        // Store the token and expiry time in the database
        user.resetToken = resetToken;
        user.tokenExpiry = tokenExpiry;
        await user.save();

        // Construct the password reset link with the token
        const resetLink = `http://localhost:${PORT}/reset-password?token=${resetToken}`;

        // Send email with the password reset link
        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: email,
            subject: 'Password Reset',
            text: `Please click the following link to reset your password: ${resetLink}`
        };
        await transporter.sendMail(mailOptions);

        
        res.sendFile(path.join(__dirname, '../template', 'login.html'));
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Handle reset password request
app.post("/reset-password", async function(req, res) {
    const { token, password } = req.body;
    try {
        // Find the user by the reset token
        const user = await UserCollection.findOne({ resetToken: token });

        if (!user) {
            // If no user found with the reset token, return an error
            return res.status(404).send("Invalid or expired reset token");
        }

        // Check if the token has expired
        if (user.tokenExpiry < Date.now()) {
            // If the token has expired, return an error
            return res.status(400).send("Reset token has expired");
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update the user's password in the database
        user.password = hashedPassword;
        user.resetToken = null;
        user.tokenExpiry = null;
        await user.save();

        res.sendFile(path.join(__dirname, '../template', 'login.html'));
    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).send("Internal Server Error");
    }
});












// Route for uploading an item
app.post('/upload-item', upload.single('image'), async (req, res) => {
    try {

        // Obtain the user ID from the request cookie
        const userId = req.session.userId;

        // Fetch the user document from the database
        const user = await UserCollection.findById(userId);

        // Check if the user document exists
        if (!user) {
            return res.status(404).send('User not found');
        }

        // Create a new item object with metadata
        const newItem = new ShoppingItem({
            name: req.body.name,
            price: req.body.price,
            category: req.body.category,
            description: req.body.description,
            imageUrl: '../uploads/' + req.file.filename, // Save the filename as the image URL
            upiQR: user.upiQR // Use the upiQR field from the user document
        });

        // Save the new item to the database
        await newItem.save();

        res.sendFile(path.join(__dirname, '../template', 'index.html'));
    } catch (error) {
        console.error('Error uploading item:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Route for retrieving an item and its image
app.get('/items/:itemId', async (req, res) => {
    try {
        const itemId = req.params.itemId;
        const item = await ShoppingItem.findById(itemId);
        if (!item) {
            return res.status(404).send('Item not found');
        }
        // Construct the file path to the image in the "images" folder
        const imagePath = path.join(__dirname, item.imageUrl);
        // Serve the image file
        res.sendFile(imagePath);
    } catch (error) {
        console.error('Error retrieving item:', error);
        res.status(500).send('Internal Server Error');
    }
});




// Import necessary modules and setup express app




// Route to retrieve item details
app.get('/itemdetails', async (req, res) => {
    try {
        // Get the item ID from the request query parameters
        const itemId = req.query.itemId;

        // Check if itemId is provided
        if (!itemId) {
            return res.status(400).send('Item ID is missing');
        }

        // Fetch the item details from the database using the item ID
        const item = await ShoppingItem.findById(itemId);

        // Check if the item exists
        if (!item) {
            return res.status(404).send('Item not found');
        }

        // Send the item details as JSON response
        res.status(200).json(item);
    } catch (error) {
        console.error('Error fetching item details:', error);
        res.status(500).send('Internal Server Error');
    }
});








// Endpoint to fetch trending images
app.get('/trendingimages', async (req, res) => {
    try {
        // Fetch trending images from the database
        const trendingImages = await ShoppingItem.find().sort({ clicks: -1 });
        
        // Extract image URLs and item IDs from the retrieved data
        const imageUrlsWithIds = trendingImages.map(image => ({
            imageUrl: image.imageUrl,
            itemId: image._id // Assuming the item ID is stored in the "_id" field
        }));

        // Send the image URLs and item IDs as JSON response
        res.json(imageUrlsWithIds);
    } catch (error) {
        console.error('Error fetching trending images:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



// Endpoint to fetch trending images with sorting
// Endpoint to fetch trending images with sorting
// Endpoint to fetch trending images with sorting
app.get('/trendingimages/dog', async (req, res) => {
    console.log("working");
    const { sortBy } = req.query; // Extract sortBy parameter from query

    try {
        let trendingImages;

        if (sortBy === 'priceDesc') {
            trendingImages = await ShoppingItem.find({ category: 'dog' }).sort({ price: -1 });
        } else if (sortBy === 'priceAsc') {
            trendingImages = await ShoppingItem.find({ category: 'dog' }).sort({ price: 1 });
        } else {
            trendingImages = await ShoppingItem.find({ category: 'dog' }).sort({ clicks: -1 });
        }

        res.json(trendingImages);
    } catch (error) {
        console.error(`Error fetching trending images for category dog:`, error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// Endpoint to fetch trending images with sorting
// Endpoint to fetch trending images with sorting
app.get('/trendingimages/cat', async (req, res) => {
    console.log("working");
    const { sortBy } = req.query; // Extract sortBy parameter from query

    try {
        let trendingImages;

        if (sortBy === 'priceDesc') {
            trendingImages = await ShoppingItem.find({ category: 'cat' }).sort({ price: -1 });
        } else if (sortBy === 'priceAsc') {
            trendingImages = await ShoppingItem.find({ category: 'cat' }).sort({ price: 1 });
        } else {
            trendingImages = await ShoppingItem.find({ category: 'cat' }).sort({ clicks: -1 });
        }

        res.json(trendingImages);
    } catch (error) {
        console.error(`Error fetching trending images for category cat:`, error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});




// Endpoint to fetch trending images with sorting
// Endpoint to fetch trending images with sorting
app.get('/trendingimages/bird', async (req, res) => {
    console.log("working");
    const { sortBy } = req.query; // Extract sortBy parameter from query

    try {
        let trendingImages;

        if (sortBy === 'priceDesc') {
            trendingImages = await ShoppingItem.find({ category: 'bird' }).sort({ price: -1 });
        } else if (sortBy === 'priceAsc') {
            trendingImages = await ShoppingItem.find({ category: 'bird' }).sort({ price: 1 });
        } else {
            trendingImages = await ShoppingItem.find({ category: 'bird' }).sort({ clicks: -1 });
        }

        res.json(trendingImages);
    } catch (error) {
        console.error(`Error fetching trending images for category bird:`, error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});





// Endpoint to fetch trending images with sorting
// Endpoint to fetch trending images with sorting
app.get('/trendingimages/exotic', async (req, res) => {
    console.log("working");
    const { sortBy } = req.query; // Extract sortBy parameter from query

    try {
        let trendingImages;

        if (sortBy === 'priceDesc') {
            trendingImages = await ShoppingItem.find({ category: 'exotic' }).sort({ price: -1 });
        } else if (sortBy === 'priceAsc') {
            trendingImages = await ShoppingItem.find({ category: 'exotic' }).sort({ price: 1 });
        } else {
            trendingImages = await ShoppingItem.find({ category: 'exotic' }).sort({ clicks: -1 });
        }

        res.json(trendingImages);
    } catch (error) {
        console.error(`Error fetching trending images for category exotic:`, error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});





// Endpoint to fetch trending images with sorting
// Endpoint to fetch trending images with sorting
app.get('/trendingimages/rabbit', async (req, res) => {
    console.log("working");
    const { sortBy } = req.query; // Extract sortBy parameter from query

    try {
        let trendingImages;

        if (sortBy === 'priceDesc') {
            trendingImages = await ShoppingItem.find({ category: 'rabbit' }).sort({ price: -1 });
        } else if (sortBy === 'priceAsc') {
            trendingImages = await ShoppingItem.find({ category: 'rabbit' }).sort({ price: 1 });
        } else {
            trendingImages = await ShoppingItem.find({ category: 'rabbit' }).sort({ clicks: -1 });
        }

        res.json(trendingImages);
    } catch (error) {
        console.error(`Error fetching trending images for category rabbit:`, error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});




// Endpoint to fetch trending images with sorting
// Endpoint to fetch trending images with sorting
app.get('/trendingimages/fish', async (req, res) => {
    console.log("working");
    const { sortBy } = req.query; // Extract sortBy parameter from query

    try {
        let trendingImages;

        if (sortBy === 'priceDesc') {
            trendingImages = await ShoppingItem.find({ category: 'fish' }).sort({ price: -1 });
        } else if (sortBy === 'priceAsc') {
            trendingImages = await ShoppingItem.find({ category: 'fish' }).sort({ price: 1 });
        } else {
            trendingImages = await ShoppingItem.find({ category: 'fish' }).sort({ clicks: -1 });
        }

        res.json(trendingImages);
    } catch (error) {
        console.error(`Error fetching trending images for category fish:`, error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// Endpoint to handle incrementing the click counter for an item
app.post('/incrementclicks/:itemId', async (req, res) => {
    try {
        const itemId = req.params.itemId;
        // Find the item by its ID and increment the clicks counter
        const updatedItem = await ShoppingItem.findByIdAndUpdate(itemId, { $inc: { clicks: 1 } }, { new: true });
        if (updatedItem) {
            res.sendStatus(200); // Send a success response
        } else {
            res.sendStatus(404); // Send a not found response if item not found
        }
    } catch (error) {
        console.error('Error incrementing click counter:', error.message);
        res.sendStatus(500); // Send a server error response
    }
});






// Route to fetch item details by ID
app.get('/shoppingitems/:itemId', async (req, res) => {
    const itemId = req.params.itemId;
    try {
        // Check if itemId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(itemId)) {
            res.status(400).send('Invalid item ID');
            return;
        }
            
        const item = await ShoppingItem.findById(itemId);
        if (!item) {
            // If item is not found, send a 404 Not Found response
            res.status(404).send('Item not found');
            return;
        }
        // Send the item details as a JSON response
        res.json(item);
    } catch (error) {
        console.error('Error fetching item details:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



// Endpoint to handle payment confirmation
app.post('/confirmpayment', upload.single('confirmpayment'), async (req, res) => {
    try {
        // Get the payment confirmation file
        const paymentConfirmationFile = req.file;

        // Perform any necessary processing with the file
        // For example, save the file to a specific location
        // You can access the file path using paymentConfirmationFile.path

        // Retrieve the item ID from the request body
        const itemId = req.body.itemId;

        // Once payment is confirmed, delete the corresponding shopping item
        const deletedItem = await ShoppingItem.findByIdAndDelete(itemId);

        if (!deletedItem) {
            return res.status(404).send('Payment unsuccessful');
        }

        // Send a success response
        res.status(200).send('Payment confirmed');
    } catch (error) {
        console.error('Error confirming payment and deleting item:', error.message);
        res.status(500).send('Internal Server Error');
    }
});









// Export the router
module.exports = router;









app.listen(PORT, function() {
    console.log(`Server is running on port ${PORT}`);
});
