const passport = require('passport');

module.exports = (app) => {
  app.get('/', (req, res) => {
    res.send({ Agrotransporte: 'Agrotransporte API.' });
  });

  app.get(
    '/auth/google',
    passport.authenticate('google', {
      scope: ['profile', 'email'],
    })
  );

  app.get(
    '/auth/google/callback',
    passport.authenticate('google', {
      successRedirect: '/auth/google/redirect',
      failureRedirect: '/auth/google',
    }),
    (req, res, next) => {
      res.send(req.user);
    }
  );

  app.get('/auth/google/redirect', async (req, res, next) => {
    res.redirect('exp://localhost:19000');
  });
};
