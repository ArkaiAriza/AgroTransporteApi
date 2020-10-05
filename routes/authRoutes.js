const passport = require('passport');
const querystring = require('querystring');

const mongoose = require('mongoose');
const User = mongoose.model('users');
const Order = mongoose.model('orders');

module.exports = (app) => {
  //Initial Page
  app.get('/', (req, res) => {
    res.send({ Agrotransporte: 'Agrotransporte API.' });
  });

  //Oauth Flow
  app.get(
    '/auth/google',
    passport.authenticate('google', {
      scope: ['profile', 'email'],
    })
  );

  app.get(
    '/auth/google/callback',
    passport.authenticate('google'),
    (req, res, next) => {
      const userData = {
        name: req.user.name,
        _id: req.user.id,
        photo: req.user.photo,
        email: req.user.email,
        googleId: req.user.googleId,
        userType: req.user.userType,
      };
      console.log(querystring.stringify(userData));
      console.log(req);
      res.redirect(
        `exp://192.168.0.103:19000?${querystring.stringify(userData)}`
      );
      /* res.redirect(`/agroapi/current_user`); */
    }
  );

  /* app.get('/auth/google/redirect', async (req, res, next) => {
    res.redirect('exp://fs-r8g.anonymous.agrotransporte.exp.direct');
  });*/

  //Functionalities

  app.get('/agroapi/logout', (req, res) => {
    req.logout();
    res.send(req.user);
  });

  //user

  app.get('/agroapi/current_user/:id', (req, res) => {
    User.findById(req.params.id, (err, user) => {
      console.log(user);
      res.send(user);
    });
  });

  app.put('/agroapi/user_type/:id', (req, res) => {
    User.findById(req.params.id, (err, userData) => {
      if (!userData) {
        res.statusCode = 404;
        return res.send({ error: 'Not found' });
      }
      if (req.body.userType) {
        if (
          userData.userType === 'Not Selected' ||
          (userData.userType !== 'agricultor' &&
            userData.userType !== 'transportador')
        ) {
          userData.userType = req.body.userType;
          return userData.save(function (err) {
            if (!err) {
              console.log('user updated');
              return res.send({ status: 'OK', userData: userData });
            } else {
              if (err.name == 'ValidationError') {
                res.statusCode = 400;
                res.send({ error: 'Validation error' });
              } else {
                res.statusCode = 500;
                res.send({ error: 'Server error' });
              }
              console.log(
                'Internal error(%d): %s',
                res.statusCode,
                err.message
              );
            }
          });
        } else {
          res.statusCode = 400;
          res.send({ error: 'User type already defined' });
        }
      } else {
        res.statusCode = 500;
        res.send({ error: 'Server error' });
      }
    });
  });

  //order

  //agricultor

  app.get('/agroapi/orders_agricultor/:id', (req, res) => {
    User.findById(req.params.id, async (err, userData) => {
      if (!userData) {
        res.statusCode = 404;
        return res.send({ error: 'Not found' });
      }
      const response = await Order.find({});
      res.send(response);
    });
  });

  app.get('/agroapi/orders_details_agricultor/:id', (req, res) => {
    User.findById(req.params.id, (err, userData) => {
      if (!userData) {
        res.statusCode = 404;
        return res.send({ error: 'User Not found' });
      }
      Order.findById(req.body.orderId, (err, orderData) => {
        if (!orderData) {
          res.statusCode = 404;
          return res.send({ error: 'Order Not found' });
        }
        res.send(orderData);
      });
    });
  });

  app.post('/agroapi/create_order/:id', (req, res) => {
    User.findById(req.params.id, (err, userData) => {
      if (!userData) {
        res.statusCode = 404;
        return res.send({ error: 'Not found' });
      }
      new Order({
        userID: userData._id,
        initLoc: req.body.initLoc,
        endLoc: req.body.endLoc,
        products: req.body.products,
        weight: req.body.weight,
        initDate: req.body.initDate,
        timeLeft: req.body.timeLeft,
        currentBid: req.body.currentBid,
      }).save(function (err, doc) {
        if (!err) {
          console.log('article created');
          return res.send({ status: 'OK', order: doc });
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

  //transportador

  app.get('/agroapi/search_orders_transportador/:id', (req, res) => {
    User.findById(req.params.id, (err, userData) => {
      if (!userData) {
        res.statusCode = 404;
        return res.send({ error: 'User Not found' });
      }
      Order.find(
        { initLoc: req.body.initLoc, endLoc: req.body.endLoc },
        (err, orderData) => {
          console.log(orderData);
          if (JSON.stringify(orderData) === JSON.stringify([])) {
            return res.send({
              message: 'There are not orders near specified locations',
            });
          }
          res.send(orderData);
        }
      );
    });
  });

  app.put('/agroapi/offer_order/:orderId', (req, res) => {
    Order.findById(req.params.orderId, (err, orderData) => {
      if (!orderData) {
        res.statusCode = 404;
        return res.send({ error: 'Order Not found' });
      }

      Order.find({ offeringUsersID: req.body.offeringUserID }, (err, order) => {
        if (orderData.currentBid <= req.body.offeredBid) {
          res.statusCode = 400;
          return res.send({
            error: 'Current value is lower than offered one!',
          });
        }
        orderData.currentBid = req.body.offeredBid;

        if (JSON.stringify(orderData.offeringUsersID) === JSON.stringify([])) {
          orderData.offeringUsersID = [
            ...orderData.offeringUsersID,
            req.body.offeringUserID,
          ];
        }

        orderData.save(function (err) {
          if (!err) {
            console.log('Order Offered');
            return res.send({ status: 'OK', offeredOrder: orderData });
          } else {
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
  });

  app.get('/agroapi/orders_transportador/:id', (req, res) => {
    User.findById(req.params.id, (err, userData) => {
      if (!userData) {
        res.statusCode = 404;
        return res.send({ error: 'Not found' });
      }
      Order.find({ offeringUsersID: userData._id }, (err, orders) => {
        if (JSON.stringify(orders) === JSON.stringify([])) {
          res.statusCode = 404;
          return res.send({ message: 'Not offered orders found' });
        }
        res.send(orders);
      });
    });
  });

  app.get('/agroapi/orders_details_transportador/:id', (req, res) => {
    User.findById(req.params.id, (err, userData) => {
      if (!userData) {
        res.statusCode = 404;
        return res.send({ error: 'User Not found' });
      }
      Order.find({ offeringUsersID: userData._id }, (err, orders) => {
        if (!orders) {
          res.statusCode = 404;
          return res.send({ error: 'Order Not found' });
        }
        res.send(orders);
      });
    });
  });
};
