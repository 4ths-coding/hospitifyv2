const express = require('express');
const path = require('path');
const hbs = require('hbs');
const connectDB = require('./mongodb');
const roomManagementRoutes = require('./routes/roomManagement');
const roomServiceRoutes = require('./routes/roomService');
const paymentRoute = require('./routes/payment');
const parkingRoutes = require('./routes/parking');

// Initialize app
const app = express();

// Connect to MongoDB
connectDB();

// Set up Handlebars as the view engine
app.set('view engine', 'hbs');

hbs.registerHelper('eq', function (a, b) {
  return a === b;
});

app.set('views', path.join(__dirname, '../templates'));

// Middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.render('home');
});
app.use('/room-management', roomManagementRoutes);

app.use('/room-service', roomServiceRoutes);

app.use('/payment', paymentRoute);

app.use('/parking', parkingRoutes);

app.get('/room-service', (req, res) => {
  res.render('roomService');
  res.redirect('/roomService');
});

app.get('/room-management', (req, res) => {
  res.render('roomManagement');
  res.redirect('/room-management/availability');
});

app.get('/payment', (req, res) => {
  res.render('payment');
});

app.get('/parking', (req, res) => {
  res.render('parking');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
