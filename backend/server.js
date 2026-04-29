require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const { seedIfEmpty } = require('./utils/seedData');

const app = express();

(async () => {
  try {
    await connectDB();
    await seedIfEmpty();
  } catch (err) {
    // A seeding hiccup must never silently kill the API. Log loudly and keep listening.
    console.error('⚠️  Startup seed/connect error:', err.message);
  }
})();

// Last-resort safety net so an unhandled rejection (eg. mongo unique-index race)
// can't terminate Node and take the API down with it.
process.on('unhandledRejection', (err) => {
  console.error('⚠️  unhandledRejection:', err?.message || err);
});

app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => res.json({ message: 'Toy Mall API is running' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/brands', require('./routes/brands'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/users', require('./routes/users'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/wholesale-categories', require('./routes/wholesaleCategories'));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Toy Mall API running on port ${PORT}`));
