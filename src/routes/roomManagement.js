const express = require('express');
const Room = require('../models/room');
const Hotel = require('../models/hotel');
const RoomService = require('../models/service'); // Import RoomService model
const router = express.Router();

// Helper function to generate roomId (FloorNumber + RoomNumber with leading zero)
function generateRoomId(floor, roomNumber) {
    return `${floor}${roomNumber.toString().padStart(2, '0')}`; // Adds leading zero if roomNumber is single digit
}

// Initialize floors and rooms (Only once)
router.post('/initialize', async (req, res) => {
    const { floors, roomsPerFloor } = req.body;
  
    try {
        const hotel = await Hotel.findOne();
        if (!hotel) {
            // Mark hotel as initialized
            const newHotel = new Hotel({ isInitialized: true });
            await newHotel.save();
      
            const roomCreationPromises = [];
            const roomServiceCreationPromises = [];

            // Loop through each floor and room to create rooms
            for (let floor = 1; floor <= floors; floor++) {
                for (let roomNumber = 1; roomNumber <= roomsPerFloor; roomNumber++) {
                    // Create and save room
                    const newRoom = new Room({ floor, roomNumber });
                    roomCreationPromises.push(newRoom.save());

                    // Generate custom room ID
                    const customRoomId = generateRoomId(floor, roomNumber);

                    // After room is created, create corresponding RoomService
                    const newRoomService = new RoomService({
                        roomId: customRoomId, // Will be populated after room creation
                        floor: floor,
                        foodOrders: [],      // Initialize with empty food orders
                        cleaningStatus: 'not_requested',
                        maintenanceStatus: 'not_required',
                        roomService: 'false'
                    });

                    roomServiceCreationPromises.push(newRoomService.save());
                }
            }

            // Await for room creation promises
            await Promise.all(roomCreationPromises);
            // Await for room service creation promises after rooms are created
            await Promise.all(roomServiceCreationPromises);
      
            res.redirect('/room-management/availability');
        } else {
            res.send('Hotel is already initialized.');
        }
    } catch (error) {
        console.error('Error during initialization:', error);
        res.status(500).send('An error occurred during hotel initialization.');
    }
});

router.post('/change-rooms', async (req, res) => {
    const { floor, roomsPerFloor } = req.body;

    try {
        console.log(`Received request to change rooms on floor: ${floor}, rooms per floor: ${roomsPerFloor}`);

        // Remove existing rooms on the specified floor
        const deletedRooms = await Room.deleteMany({ floor });
        console.log(`Deleted ${deletedRooms.deletedCount} rooms from floor ${floor}`);

        // Remove RoomService entries associated with that floor
        const deletedServices = await RoomService.deleteMany({ floor });
        console.log(`Deleted ${deletedServices.deletedCount} RoomService entries for floor ${floor}`);

        const roomCreationPromises = [];
        const roomServiceCreationPromises = [];

        for (let roomNumber = 1; roomNumber <= roomsPerFloor; roomNumber++) {
            // Generate custom room ID
            const customRoomId = generateRoomId(floor, roomNumber);
            console.log(`Creating room ${customRoomId} on floor ${floor}`);

            // Create and save room
            const newRoom = new Room({
                floor,
                roomNumber,
                roomId: customRoomId
            });
            roomCreationPromises.push(newRoom.save());

            // Create corresponding RoomService for the new room
            const newRoomService = new RoomService({
                roomId: customRoomId,    // Room ID for the RoomService entry
                floor,                   // Assign the floor value to the RoomService
                foodOrders: [],          // Initialize with empty food orders
                cleaningStatus: 'not_requested',
                maintenanceStatus: 'not_required',
                roomService: false       // Default to false since no services requested yet
            });
            roomServiceCreationPromises.push(newRoomService.save());
        }

        // Wait for room creation and room service creation to complete
        await Promise.all(roomCreationPromises);
        await Promise.all(roomServiceCreationPromises);

        console.log('Successfully created new rooms and room services.');
        res.redirect('/room-management/availability');
    } catch (error) {
        console.error('Error occurred while changing rooms:', error);
        res.status(500).send('An error occurred while changing rooms.');
    }
});


// Get room availability (show only available rooms)
router.get('/availability', async (req, res) => {
    try {
        const rooms = await Room.find().sort({ floor: 1, roomNumber: 1 });
        const hotel = await Hotel.findOne(); // Check if the hotel is initialized
        
        // Ensure the state is passed to the template
        const isInitialized = hotel ? hotel.isInitialized : false;
  
        // Render the room management template with data
        res.render('roomManagement', { rooms, isInitialized });
    } catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).send('An error occurred while fetching room availability.');
    }
});

// Reserve a room and set check-in/check-out dates
router.post('/reserve', async (req, res) => {
    const { roomId, reservedBy, checkInDate, checkOutDate } = req.body;

    try {
        // Get the current date and time for validation
        let now = new Date();

        // Convert the check-in and check-out dates to JavaScript Date objects
        let checkIn = new Date(checkInDate);
        let checkOut = new Date(checkOutDate);

        // Set the check-in time to 2 PM (12-hour format)
        checkIn.setHours(14, 0, 0, 0); // 2:00 PM (14:00 in 24-hour format)

        // Set the check-out time to 12 PM (noon)
        checkOut.setHours(12, 0, 0, 0); // 12:00 PM (noon)

        // Validation: Ensure check-in is not in the past
        if (checkIn <= now) {
            return res.status(400).send('Check-in date cannot be in the past.');
        }

        // Validation: Ensure that check-out date is later than check-in date
        if (checkOut <= checkIn) {
            return res.status(400).send('Check-out date must be later than check-in date.');
        }

        // Find the room by ID and check availability
        const room = await Room.findById(roomId);
        if (room && room.isAvailable) {
            room.isAvailable = false;
            room.reservedBy = reservedBy;
            room.checkInDate = checkIn;
            room.checkOutDate = checkOut;

            await room.save();
        } else {
            return res.status(400).send('Room is not available.');
        }

        res.redirect('/room-management/availability');
    } catch (error) {
        console.error('Error reserving room:', error);
        res.status(500).send('An error occurred while reserving the room.');
    }
});

module.exports = router;
