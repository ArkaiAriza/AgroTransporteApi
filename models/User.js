const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  googleId: String,
  name: String,
  photo: String,
  email: String,
  userType: {
    type: String,
    default: 'Not Selected',
  },
  recentLocations: {
    type: [String],
    default: [],
  },
  number: String,
  requests: {
    type: [String],
    default: [],
  },
});

mongoose.model('users', userSchema);
