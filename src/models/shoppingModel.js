const mongoose = require('mongoose');


// Define a schema for shopping items
const shoppingItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: false // Set unique to false for price field
    },
    price: {
        type: Number,
        required: true,
        unique: false // Set unique to false for price field
    },
    category: {
        type: String,
        required: true,
        unique: false // Set unique to false for price field
    },
    description: {
        type: String,
        unique: false // Set unique to false for price field
    },
    imageUrl: {
        type: String,
        required: true,
        unique: false // Set unique to false for price field
    },
    upiQR: {
        type: String,
        required: true,
        unique: false // Set unique to false for price field
    },
    paymentImage: {
        type: String,
        unique: false // Set unique to false for price field
    },
    confirmPayment: {
        type: Boolean,
        unique: false // Set unique to false for price field
    },
    clicks:{
        type: Number,
        unique: false,
        reset: 86400000
    }
});
  
// Create a model based on the schema, specifying the collection name
const ShoppingCollection = mongoose.model('ShoppingCollection', shoppingItemSchema, 'shoppingitems');

module.exports = ShoppingCollection;


  