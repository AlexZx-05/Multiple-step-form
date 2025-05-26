require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const User = require('./models/User'); // your Mongoose User model
const countries = require('./data/countries.json');
const states = require('./data/states.json');
const cities = require('./data/cities.json');

const app = express();
const PORT = 3000;

//this is for hashing 
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Multer config for profile photo upload
const upload = multer({
  dest: 'uploads/', // folder to store uploaded files
  limits: { fileSize: 1 * 1024 * 1024 }, // max 1MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
      cb(null, true);
    } else {
      cb(new Error('Only .jpg, .jpeg, .png files are allowed'));
    }
  }
});

// Basic test route
app.get('/', (req, res) => {
  res.send('Hello from Express server connected to MongoDB!');
});

// Create new user route (if you want this separately)
app.post('/users', async (req, res) => {
  try {
    const userData = req.body;

    // Hash the password before saving it
    userData.passwordHash = hashPassword(userData.passwordHash);

    console.log('Hashed password:', userData.passwordHash); // <-- Add this line to see hash

    const newUser = new User(userData);
    await newUser.save();
    res.status(201).send('User created successfully');
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).send('Username already exists. Please choose another.');
    }
    console.error(err);
    res.status(400).send('Error creating user');
  }
});


// Check username availability
app.post('/api/check-username', async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ available: false, message: 'Username is required' });

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.json({ available: false, message: 'Username is already taken' });
    }
    res.json({ available: true, message: 'Username is available' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ available: false, message: 'Server error' });
  }
});


// Get all countries
app.get('/api/countries', (req, res) => {
  res.json(countries);
});

// Get states for a given country
app.get('/api/states', (req, res) => {
  const country = req.query.country;
  if (!country) return res.status(400).json({ error: 'Country query param is required' });

  const statesList = states[country];
  if (!statesList) return res.status(404).json({ error: 'States not found for this country' });

  res.json(statesList);
});

// Get cities for a given state
app.get('/api/cities', (req, res) => {
  const state = req.query.state;
  if (!state) return res.status(400).json({ error: 'State query param is required' });

  const citiesList = cities[state];
  if (!citiesList) return res.status(404).json({ error: 'Cities not found for this state' });

  res.json(citiesList);
});

// Upload profile photo
app.post('/api/upload-profile-photo', upload.single('profilePhoto'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'File upload failed' });

  res.json({
    message: 'File uploaded successfully',
    filename: req.file.filename,
    path: req.file.path,
  });
});

// Update or save user profile data
app.post('/api/update-profile', async (req, res) => {
  const userData = req.body;

  if (!userData.username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const updatedUser = await User.findOneAndUpdate(
      { username: userData.username },
      userData,
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ message: 'User profile saved', user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error saving user profile' });
  }
});

// for submitting form 
app.post('/api/submit-form', upload.single('profilePhoto'), async (req, res) => {
  try {
    const data = req.body;

    // Handle file upload
    let profilePhotoPath = '';
    if (req.file) {
      profilePhotoPath = req.file.path;
    }

    const userPayload = {
      ...data,
      profilePhotoPath,
      passwordHash: hashPassword(data.newPassword || data.currentPassword),
    };

    // Save or update the user
    const user = await User.findOneAndUpdate(
      { username: data.username },
      userPayload,
      { upsert: true, new: true }
    );

    res.json({ message: 'Form submitted successfully', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Form submission failed' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
