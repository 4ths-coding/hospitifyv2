const mongoose = require('mongoose');

// Define Hotel Schema for initialization tracking
const hotelSchema = new mongoose.Schema({
  isInitialized: {
    type: Boolean,
    default: false
  }
});

const Hotel = mongoose.model('Hotel', hotelSchema);

module.exports = Hotel;
