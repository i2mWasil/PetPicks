const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    profileImage: {
        type: String,
        required: true
    },
    upiQR: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    otpVerified: {
        type: Boolean,
        default: false // Default value is false until OTP is verified
    },
    resetToken: String,
    tokenExpiry: Date
});

const UserCollection = mongoose.model('UserCollection', userSchema);

module.exports = UserCollection;
