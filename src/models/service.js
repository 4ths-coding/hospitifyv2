// models/service.js
const mongoose = require('mongoose');

// Define the schema for Room Services
const roomServiceSchema = new mongoose.Schema({
  roomId: {
    type: Number, 
    required: true
  },
  foodOrders: [{
    item: String,
    status: { type: String, enum: ['pending', 'delivered'], default: 'pending' }
  }],
  removedFoodOrders: [{
    item: String,
    removedAt: { type: Date, default: Date.now }
  }],
  cleaningStatus: { type: String, enum: ['not_requested', 'pending', 'completed'], default: 'not_requested' },
  cleaningHistory: [{
    status: { type: String, enum: ['pending', 'completed'] },
    removedAt: { type: Date, default: Date.now }
  }],
  maintenanceStatus: { type: String, enum: ['not_required', 'in_progress', 'completed'], default: 'not_required' },
  roomService: { type: Boolean, default: false } 
});

// Model for Room Service
const RoomService = mongoose.model('RoomService', roomServiceSchema);

module.exports = RoomService;
