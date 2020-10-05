const mongoose = require('mongoose');
const { Schema } = mongoose;

const subSchemaProducts = new Schema({
  product: String,
  weight: {
    type: Number,
    default: 0,
  },
});

const orderSchema = new Schema({
  userID: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
  initLoc: String,
  endLoc: String,
  products: [subSchemaProducts],
  weight: Number,
  initDate: Date,
  timeLeft: Number,
  currentBid: Number,
});

mongoose.model('orders', orderSchema);
