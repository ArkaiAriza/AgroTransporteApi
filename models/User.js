const mongoose = require('mongoose');
const { Schema } = mongoose;

/* const subSchemaCharges = new Schema({
  amount: {
    type: String,
    required: true,
  },
}); */

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
  /* charges: {
    type: [subSchemaCharges],
    required: false,
  }, */
});

mongoose.model('users', userSchema);
