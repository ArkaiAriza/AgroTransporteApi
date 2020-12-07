const passport = require('passport');
const querystring = require('querystring');

const mongoose = require('mongoose');
const User = mongoose.model('users');
const Order = mongoose.model('orders');

const { networkInterfaces } = require('os');

const nets = networkInterfaces();
const results = Object.create(null);

for (const name of Object.keys(nets)) {
  for (const net of nets[name]) {
    // skip over non-ipv4 and internal (i.e. 127.0.0.1) addresses
    if (net.family === 'IPv4' && !net.internal) {
      if (!results[name]) {
        results[name] = [];
      }

      results[name].push(net.address);
    }
  }
}

const addDays = (date, days) => {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

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
        number: req.user.number,
      };
      console.log(querystring.stringify(userData));
      if (process.env.NODE_ENV === 'production') {
        res.redirect(
          `exp://${results.Ethernet[0]}:19000?${querystring.stringify(
            userData
          )}`
        );
      } else {
        res.redirect(
          `exp://${results.Ethernet[0]}:19000?${querystring.stringify(
            userData
          )}`
        );
      }
    }
  );

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

  app.put('/agroapi/user_number/:id', (req, res) => {
    User.findById(req.params.id, (err, userData) => {
      if (!userData) {
        res.statusCode = 404;
        return res.send({ error: 'Not found' });
      }
      if (req.body.number) {
        if (userData.number === 'Pending') {
          userData.number = req.body.number;
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
          res.send({ error: 'User number already defined!' });
        }
      } else {
        res.statusCode = 500;
        res.send({ error: 'Server error' });
      }
    });
  });

  //order

  app.get('/agroapi/orders_details/:orderId', (req, res) => {
    Order.findById(req.params.orderId, (err, order) => {
      if (!order) {
        res.statusCode = 404;
        return res.send({ error: 'Order Not found' });
      }
      User.findById(order.userID, (err, userData) => {
        if (!userData) {
          res.statusCode = 404;
          return res.send({ error: 'Owner of Order Not found' });
        }
        res.send({ order: order, owner: userData });
      });
    });
  });

  //--//agricultor

  app.get('/agroapi/orders_agricultor/:id', (req, res) => {
    User.findById(req.params.id, async (err, userData) => {
      if (!userData) {
        res.statusCode = 404;
        return res.send({ error: 'Not found' });
      }
      const response = await Order.find(
        { userID: userData._id },
        (err, orders) => {
          orders.forEach((order) => {
            const endDate = addDays(order.initDate, order.timeLeft);
            const actualDate = new Date();
            let daysLeft = 0;

            if (endDate > actualDate) {
              const diffTime = Math.abs(actualDate - endDate);
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              daysLeft = diffDays;
              order.expired = false;
            } else {
              order.expired = true;
            }
            order.daysToExpire = daysLeft;
            order.initDate;
            order.save();
          });
        }
      );
      res.send(response);
    });
  });

  app.post('/agroapi/create_order/:id', (req, res) => {
    User.findById(req.params.id, (err, userData) => {
      if (!userData) {
        res.statusCode = 404;
        return res.send({ error: 'Not found' });
      }
      if (
        !userData.recentLocations.find(
          (loc) => JSON.stringify(loc) === JSON.stringify(req.body.endLoc)
        )
      ) {
        if (userData.recentLocations.length < 4) {
          userData.recentLocations = [
            ...userData.recentLocations,
            req.body.endLoc,
          ];
        } else {
          userData.recentLocations = userData.recentLocations.slice(
            1,
            userData.recentLocations.length
          );
          userData.recentLocations = [
            ...userData.recentLocations,
            req.body.endLoc,
          ];
        }
      }

      userData.save();

      new Order({
        userID: userData._id,
        initLoc: req.body.initLoc,
        endLoc: req.body.endLoc,
        products: req.body.products,
        weight: req.body.weight,
        initDate: new Date(),
        timeLeft: req.body.timeLeft,
        currentBid: req.body.currentBid,
        daysToExpire: req.body.timeLeft,
      }).save(function (err, doc) {
        if (!err) {
          console.log('order created');
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

  app.delete('/agroapi/delete_order/:orderId', (req, res) => {
    Order.findById(req.params.orderId, (err, order) => {
      if (!order) {
        res.statusCode = 404;
        return res.send({ error: 'Not found' });
      }
      order.remove((err) => {
        if (!err) {
          console.log('order removed');
          return res.send({ status: 'OK', message: 'Order Removed.' });
        } else {
          res.statusCode = 500;
          return res.send({ error: 'Server error' });
        }
      });
    });
  });

  //--//transportador

  app.post('/agroapi/search_orders_transportador/:id', (req, res) => {
    User.findById(req.params.id, (err, userData) => {
      if (!userData) {
        res.statusCode = 404;
        return res.send({ error: 'User Not found' });
      }
      Order.find(
        { initLoc: req.body.initLoc, endLoc: req.body.endLoc, expired: false },
        (err, orderData) => {
          orderData.forEach((order) => {
            const endDate = addDays(order.initDate, order.timeLeft);
            const actualDate = new Date();
            let daysLeft = 0;

            if (endDate > actualDate) {
              const diffTime = Math.abs(actualDate - endDate);
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              daysLeft = diffDays;
              order.expired = false;
            } else {
              order.expired = true;
            }
            order.daysToExpire = daysLeft;
            order.save();
          });

          if (JSON.stringify(orderData) === JSON.stringify([])) {
            return res.send({
              message: 'There are not orders near specified locations',
            });
          }
          return res.send(orderData);
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

      if (orderData.currentBid <= req.body.offeredBid) {
        res.statusCode = 400;
        return res.send({
          error: 'Current value is lower than offered one!',
        });
      }

      const endDate = addDays(orderData.initDate, orderData.timeLeft);
      const actualDate = new Date();
      let daysLeft = 0;

      if (endDate > actualDate) {
        const diffTime = Math.abs(actualDate - endDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        daysLeft = diffDays;
        orderData.expired = false;
      } else {
        orderData.expired = true;
      }
      orderData.daysToExpire = daysLeft;

      if (orderData.daysToExpire === 0) {
        orderData.save();
        res.statusCode = 400;
        return res.send({
          error: 'No more time to offer!',
        });
      }

      orderData.currentBid = req.body.offeredBid;

      if (
        !orderData.offeringUsersID.find(
          (id) => JSON.stringify(id) === JSON.stringify(req.body.offeringUserID)
        )
      ) {
        orderData.offeringUsersID = [
          ...orderData.offeringUsersID,
          req.body.offeringUserID,
        ];
      } else {
        orderData.offeringUsersID = orderData.offeringUsersID.filter((id) => {
          return !(
            JSON.stringify(id) === JSON.stringify(req.body.offeringUserID)
          );
        });
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

  app.get('/agroapi/orders_transportador/:id', (req, res) => {
    User.findById(req.params.id, (err, userData) => {
      if (!userData) {
        res.statusCode = 404;
        return res.send({ error: 'Not found' });
      }
      Order.find({ offeringUsersID: userData._id }, (err, orders) => {
        orders.forEach((order) => {
          const endDate = addDays(order.initDate, order.timeLeft);
          const actualDate = new Date();
          let daysLeft = 0;

          if (endDate > actualDate) {
            const diffTime = Math.abs(actualDate - endDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            daysLeft = diffDays;
            order.expired = false;
          } else {
            order.expired = true;
          }
          order.daysToExpire = daysLeft;
          order.initDate;
          order.save();
        });

        if (JSON.stringify(orders) === JSON.stringify([])) {
          res.statusCode = 404;
          return res.send({ message: 'Not offered orders found' });
        }
        res.send(orders);
      });
    });
  });

  app.get('/agroapi/transportador_wins_order/:orderId', (req, res) => {
    Order.findById(req.params.orderId, (err, order) => {
      if (
        order.offeringUsersID.find(
          (id, index) =>
            id === req.body.offeringUserID &&
            index === order.offeringUsersID.length - 1
        )
      ) {
        return res.send({ userID: req.body.offeringUserID, status: 'won' });
      }
      return res.send({ userID: req.body.offeringUserID, status: 'failed' });
    });
  });

  //Support

  app.post('/agroapi/request/:id', async (req, res) => {
    User.findById(req.params.id, (err, userData) => {
      if (!userData) {
        res.statusCode = 404;
        return res.send({ error: 'User Not found' });
      }
      userData.requests = req.body.requests;
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
    });
  });
};
