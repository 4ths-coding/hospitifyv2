const express = require('express');
const router = express.Router();
const Room = require('../models/room');
const RoomService = require('../models/service');

// Utility function to calculate date difference in days
function calculateDateDifference(startDate, endDate) {
  const diffTime = Math.abs(endDate - startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Route to render the payment dashboard for all reserved rooms
router.get('/', async (req, res) => {
  try {
    // Fetch all reserved rooms (assuming 'checkInDate' indicates reservation)
    const reservedRooms = await Room.find({ checkInDate: { $exists: true }, isAvailable: false });
    
    if (reservedRooms.length === 0) {
      return res.status(404).send('No reserved rooms found');
    }

    // Fetch room service records for all reserved rooms
    const roomServices = await RoomService.find({
      roomId: { $in: reservedRooms.map(room => room.roomId) }
    });

    // Create a lookup for room services by roomId
    const roomServiceMap = roomServices.reduce((map, service) => {
      map[service.roomId] = service;
      return map;
    }, {});

    // Prepare the data for each room
    const roomsData = reservedRooms.map(room => {
      const roomService = roomServiceMap[room.roomId] || {};
      const checkInDate = room.checkInDate;
      const checkOutDate = room.checkOutDate || new Date(); // Default to today if no check-out yet
      const stayDuration = calculateDateDifference(checkInDate, checkOutDate);

      // Calculate room cost (e.g., $100 per night)
      const roomRate = 100; // Change as needed
      const roomCost = stayDuration * roomRate;

      // Calculate food order cost (e.g., $10 per item, including removedFoodOrders)
      const totalFoodOrders = (roomService.foodOrders || []).length + (roomService.removedFoodOrders || []).length;
      const foodOrderCost = totalFoodOrders * 10;

      // Calculate cleaning cost (e.g., $50 per cleaning request, including cleaningHistory)
      const totalCleanings = (roomService.cleaningHistory || []).length + (roomService.cleaningStatus === 'pending' ? 1 : 0);
      const cleaningCost = totalCleanings * 50;

      // Calculate total cost
      const totalCost = roomCost + foodOrderCost + cleaningCost;

      return {
        roomId: room.roomId,
        stayDuration,
        roomCost,
        foodOrderCost,
        cleaningCost,
        totalCost
      };
    });

    // Render the payment page with room data
    res.render('payment', { roomsData });

  } catch (err) {
    console.error('Error generating payment:', err);
    res.status(500).send('Server error');
  }
});

// Route to handle payment (triggered when the "Pay" button is clicked)
router.post('/pay', async (req, res) => {
    const { roomId } = req.body;
  
    try {
      // Extract floor and room number from roomId
      const roomNumber = roomId.slice(-2); // Last 2 digits for room number
      const floor = roomId.slice(0, -2);   // Remaining digits for floor number
  
      // Find the room by floor and roomNumber
      const reservedRoom = await Room.findOne({ floor, roomNumber });
  
      if (!reservedRoom) {
        return res.status(404).send('Room not found');
      }
  
      // Update the room to remove checkInDate, checkOutDate, reservedBy, and set isAvailable to true
      reservedRoom.checkInDate = null;
      reservedRoom.checkOutDate = null;
      reservedRoom.reservedBy = null;
      reservedRoom.isAvailable = true;
  
      await reservedRoom.save();
  
      // Find the room service record associated with the room
      const roomService = await RoomService.findOne({ roomId });
  
      if (roomService) {
        // Update roomService: clear arrays and reset status fields
        roomService.foodOrders = [];
        roomService.removedFoodOrders = [];
        roomService.cleaningHistory = [];
        roomService.cleaningStatus = 'not_requested';
        roomService.isServiceActive = false;
        roomService.roomService = false;
  
        await roomService.save();
      }
  
      // Fetch all updated reserved rooms after the payment has been processed
      const reservedRooms = await Room.find({ checkInDate: { $exists: true } });
      
      // Fetch room service records for all reserved rooms
      const roomServices = await RoomService.find({
        roomId: { $in: reservedRooms.map(room => room.roomId) }
      });
  
      // Create a lookup for room services by roomId
      const roomServiceMap = roomServices.reduce((map, service) => {
        map[service.roomId] = service;
        return map;
      }, {});
  
      // Prepare the data for each room
      const roomsData = reservedRooms.map(room => {
        const roomService = roomServiceMap[room.roomId] || {};
        const checkInDate = room.checkInDate;
        const checkOutDate = room.checkOutDate || new Date(); // Default to today if no check-out yet
        const stayDuration = calculateDateDifference(checkInDate, checkOutDate);
  
        // Calculate room cost (e.g., $100 per night)
        const roomRate = 100; // Change as needed
        const roomCost = stayDuration * roomRate;
  
        // Calculate food order cost (e.g., $10 per item, including removedFoodOrders)
        const totalFoodOrders = (roomService.foodOrders || []).length + (roomService.removedFoodOrders || []).length;
        const foodOrderCost = totalFoodOrders * 10;
  
        // Calculate cleaning cost (e.g., $50 per cleaning request, including cleaningHistory)
        const totalCleanings = (roomService.cleaningHistory || []).length + (roomService.cleaningStatus === 'pending' ? 1 : 0);
        const cleaningCost = totalCleanings * 50;
  
        // Calculate total cost
        const totalCost = roomCost + foodOrderCost + cleaningCost;
  
        return {
          roomId: room.roomId,
          stayDuration,
          roomCost,
          foodOrderCost,
          cleaningCost,
          totalCost
        };
      });
  
      // Render the payment page with updated room data after payment
      res.render('payment', { roomsData });
  
    } catch (err) {
      console.error('Error processing payment:', err);
      res.status(500).send('Error processing payment');
    }
  });
  
module.exports = router;
