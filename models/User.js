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
});

mongoose.model('users', userSchema);
