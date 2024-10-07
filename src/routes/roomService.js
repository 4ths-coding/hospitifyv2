const express = require('express');
const router = express.Router();
const RoomService = require('../models/service'); // Adjust to your service model
const Room = require('../models/room'); // Adjust to your room model

// Route to render the room service dashboard
router.get('/', async (req, res) => {
  try {
    // Fetch room services where roomService is true
    const roomservices = await RoomService.find({ roomService: true });

    // Fetch all rooms, sorting by roomId in ascending order
    const allRooms = await Room.find({}).sort({ floor: 1, roomNumber: 1 });
 // Sort by roomId in ascending order
    const roomIds = allRooms.map(room => room.roomId); // Extract room IDs

    // Render the roomService.hbs file with roomservices and roomIds data
    res.render('roomService', { roomservices, roomIds });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Route to handle food orders
router.post('/food-order', async (req, res) => {
    const { roomId, foodItems } = req.body;
    
    try {
      const roomService = await RoomService.findOne({ roomId });
      
      if (roomService) {
        // Split the foodItems string into an array by commas, trim whitespace from each item
        const itemsArray = foodItems.split(',').map(item => item.trim()).filter(item => item); // Remove empty items
  
        // Push each food item into the foodOrders array
        itemsArray.forEach(item => {
          roomService.foodOrders.push({ item, status: 'pending' });
        });
  
        roomService.lastUpdated = Date.now();
        roomService.roomService = true; // Set roomService to true
  
        await roomService.save();
      }
      
      res.redirect('/room-service');
    } catch (err) {
      console.error('Error processing food order:', err);
      res.status(500).send('Error processing food order');
    }
  });
  
  
  // Route to handle cleaning requests
  router.post('/request-cleaning', async (req, res) => {
    const { roomId } = req.body;
  
    try {
      const roomService = await RoomService.findOne({ roomId });
  
      if (roomService) {
        roomService.cleaningStatus = 'pending';
        roomService.lastUpdated = Date.now();
        roomService.roomService = true; // Set roomService to true directly
  
        await roomService.save();
      }
  
      res.redirect('/room-service');
    } catch (err) {
      console.error('Error requesting cleaning:', err);
      res.status(500).send('Error requesting cleaning');
    }
  });
  
  // Route to handle setting maintenance status
  router.post('/set-maintenance', async (req, res) => {
    const { roomId } = req.body;
  
    try {
      const roomService = await RoomService.findOne({ roomId });
  
      if (roomService) {
        roomService.maintenanceStatus = 'in_progress';
        roomService.lastUpdated = Date.now();
        roomService.roomService = true; // Set roomService to true directly
  
        await roomService.save();
      }
  
      res.redirect('/room-service');
    } catch (err) {
      console.error('Error setting maintenance status:', err);
      res.status(500).send('Error setting maintenance status');
    }
  });  

// In routes/roomService.js

// Route to remove a food order
router.post('/remove-food-order', async (req, res) => {
    const { roomId, item } = req.body;
  
    try {
      const roomService = await RoomService.findOne({ roomId });
      
      if (roomService) {
        // Find the removed food order and add it to removedFoodOrders
        const removedOrder = roomService.foodOrders.find(order => order.item === item);
        if (removedOrder) {
          roomService.removedFoodOrders.push({ item: removedOrder.item });
        }

        // Remove the food order from the array
        roomService.foodOrders = roomService.foodOrders.filter(order => order.item !== item);
        roomService.lastUpdated = Date.now();
  
        await roomService.save();
      }
  
      res.redirect('/room-service');
    } catch (err) {
      console.error('Error removing food order:', err);
      res.status(500).send('Error removing food order');
    }
});

// Route to remove a cleaning request
router.post('/remove-cleaning', async (req, res) => {
    const { roomId } = req.body;
  
    try {
      const roomService = await RoomService.findOne({ roomId });
      
      if (roomService && roomService.cleaningStatus === 'pending') {
        roomService.cleaningHistory.push({ status: 'pending' }); // Log the cleaning request
        roomService.cleaningStatus = 'not_requested'; // Reset cleaning status
        roomService.lastUpdated = Date.now();
  
        await roomService.save();
      }
  
      res.redirect('/room-service');
    } catch (err) {
      console.error('Error removing cleaning request:', err);
      res.status(500).send('Error removing cleaning request');
    }
});

  // Route to remove a maintenance request
router.post('/remove-maintenance', async (req, res) => {
    const { roomId } = req.body;
  
    try {
      const roomService = await RoomService.findOne({ roomId });
      
      if (roomService) {
        roomService.maintenanceStatus = 'not_required'; // Reset maintenance status
        roomService.roomService = roomService.foodOrders.length > 0 || roomService.cleaningStatus !== 'not_requested'; // Check if any other services are active
        roomService.lastUpdated = Date.now();
  
        await roomService.save();
      }
  
      res.redirect('/room-service');
    } catch (err) {
      console.error('Error removing maintenance request:', err);
      res.status(500).send('Error removing maintenance request');
    }
  });
  

// Export the router
module.exports = router;