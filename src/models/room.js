const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  floor: {
    type: Number,
    required: true,
  },
  roomNumber: {
    type: Number,
    required: true,
  },
  isAvailable: {
    type: Boolean,
    default: true,  // Default to true when the room is created
  },
  reservedBy: {
    type: String,
  },
  checkInDate: {
    type: Date,     // Stores the check-in date and time
  },
  checkOutDate: {
    type: Date,     // Stores the check-out date and time
  },
  maintenanceStatus: {
    type: String,
    enum: ['not_required', 'in_progress', 'completed'],
    default: 'not_required'
  }
});

// Virtual to generate roomId as (floor)(padded roomNumber)
roomSchema.virtual('roomId').get(function() {
  // Pad roomNumber with a leading zero if it's a single digit
  const paddedRoomNumber = this.roomNumber.toString().padStart(2, '0');
  return `${this.floor}${paddedRoomNumber}`;
});

// Middleware to automatically update room availability based on maintenance status
roomSchema.pre('save', function (next) {
  if (this.maintenanceStatus === 'in_progress') {
    this.isAvailable = false;  // Room is unavailable during maintenance
  } else if (this.maintenanceStatus === 'completed') {
    this.isAvailable = true;   // Room becomes available once maintenance is completed
  }
  next();
});

// Create a compound index for floor and roomNumber to ensure uniqueness
roomSchema.index({ floor: 1, roomNumber: 1 }, { unique: true });

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
