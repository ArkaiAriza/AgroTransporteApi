const keys = require('../config/keys');
const stripe = require('stripe')(keys.stripeSecretKey);
const querystring = require('querystring');

const mongoose = require('mongoose');
const User = mongoose.model('users');
const Order = mongoose.model('orders');

module.exports = (app) => {
  app.post('/agroapi/stripe_charge/:orderId', async (req, res) => {
    //console.log(req.body);
    const charge = await stripe.charges.create({
      amount: req.body.amount,
      currency: 'cop',
      description: 'Shipment Payment',
      source: req.body.token.tokenId,
    });
    var amountStr = charge.amount + '';
    console.log('COP $' + amountStr.slice(0, amountStr.length - 2) + '.00');
    const amountData =
      'COP $' + amountStr.slice(0, amountStr.length - 2) + '.00';
    console.log(amountData);

    Order.findById(req.params.orderId, (err, order) => {
      if (!order) {
        res.statusCode = 404;
        return res.send({ error: 'Order Not found' });
      }
      order.bill = amountData;
      order.save(function (err, doc) {
        if (!err) {
          console.log('Bill made!');
          return res.send(order);
        } else {
          console.log(err);
          if (err.name == 'ValidationError') {
            res.statusCode = 400;
            res.send({ error: 'Validation error' });
          } else {
            res.statusCode = 500;
            res.send({ error: 'Server error' });
          }
          console.log('Internal error(%d): %s', res.statusCode, err.message);
        }
      });
    });
  });
};
