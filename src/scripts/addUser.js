const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

const userSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format'
    }
  },
  userId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  voteCount: {
    type: Number,
    default: 0,
    min: 0
  },
  votedLogos: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

async function addUser(name, email) {
  if (!name || !email) {
    console.error('Error: Please provide both name and email as arguments');
    console.log('Usage: node addUser.js "User Name" "user@example.com"');
    process.exit(1);
  }

  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://admin:devpassword@localhost:27019/jardins-campion-dev?authSource=admin&directConnection=true', {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
      directConnection: true,
      retryWrites: true,
      retryReads: true,
      writeConcern: { w: 'majority' },
    });

    const userId = name.toLowerCase().replace(/\s+/g, '-');
    // Generate a unique ID using timestamp and random string
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const user = new User({
      id,
      name,
      email,
      userId,
      voteCount: 0,
      votedLogos: []
    });

    const savedUser = await user.save();
    console.log('User created successfully:', savedUser);
  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Get the name and email from command line arguments
const userName = process.argv[2];
const userEmail = process.argv[3];
addUser(userName, userEmail); 