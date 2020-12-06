const keys = require('../config/keys');
const stripe = require('stripe')(keys.stripeSecretKey);

module.exports = (app) => {
  app.post('/agroapi/stripe_charge', async (req, res) => {
    console.log(req.body);
    const charge = await stripe.charges.create({
      amount: req.body.amount,
      currency: 'cop',
      description: 'Shipment Payment',
      source: req.body.token.tokenId,
    });
    res.send(charge);

    /* add /:id to path
    User.findById(req.params.id, (err, userData) => {
      if (!userData) {
        res.statusCode = 404;
        return res.send({ error: 'User Not found' });
      }
      userData.charges = {
        amount: charge.amount
        }
      userData.save(function (err, doc) {
        if (!err) {
          console.log('Request made!');
          return res.send(user);
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
    }); */
  });
};
