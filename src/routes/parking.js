const express = require('express');
const router = express.Router();
const ParkingSpace = require('../models/parking'); // Import the model

// Display all parking spaces
router.get('/', async (req, res) => {
  try {
    const parkingSpaces = await ParkingSpace.find();
    res.render('parking', { parkingSpaces });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching parking spaces');
  }
});

// Clear parking space after payment
router.post('/clear/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await ParkingSpace.findOneAndUpdate({ id }, { isTaken: false });
    res.redirect('/parking');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error clearing parking space');
  }
});

// Park a vehicle in a space
router.post('/park/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await ParkingSpace.findOneAndUpdate({ id }, { isTaken: true });
    res.redirect('/parking');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error parking vehicle');
  }
});

// Set the number of parking spaces
router.post('/set-spaces', async (req, res) => {
  try {
    const numSpaces = parseInt(req.body.numSpaces);

    const currentSpaces = await ParkingSpace.find();

    // Add new spaces if numSpaces is greater than current length
    if (numSpaces > currentSpaces.length) {
      const currentLength = currentSpaces.length;
      for (let i = currentLength + 1; i <= numSpaces; i++) {
        const newSpace = new ParkingSpace({ id: i, isTaken: false });
        await newSpace.save();
      }
    } else {
      // Remove extra spaces if numSpaces is less than current length
      await ParkingSpace.deleteMany({ id: { $gt: numSpaces } });
    }

    res.redirect('/parking');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error setting number of parking spaces');
  }
});

module.exports = router;
