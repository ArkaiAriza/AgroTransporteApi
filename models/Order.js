const mongoose = require('mongoose');
const { Schema } = mongoose;

const subSchemaProducts = new Schema({
  product: {
    type: String,
    required: true,
  },
  weight: {
    type: Number,
    default: 0,
  },
});

const orderSchema = new Schema({
  userID: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  offeringUsersID: [String],
  initLoc: String,
  endLoc: String,
  products: {
    type: [subSchemaProducts],
    required: true,
  },
  weight: Number,
  initDate: Date,
  timeLeft: Number,
  currentBid: {
    type: Number,
    required: true,
  },
  expired: {
    type: Boolean,
    default: false,
  },
  daysToExpire: Number,
  bill: {
    type: String,
    default: 'None',
  },
});

mongoose.model('orders', orderSchema);
