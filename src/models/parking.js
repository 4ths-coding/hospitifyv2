const mongoose = require('mongoose');

const parkingSpaceSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  isTaken: { type: Boolean, required: true }
});

const ParkingSpace = mongoose.model('ParkingSpace', parkingSpaceSchema);

module.exports = ParkingSpace;
