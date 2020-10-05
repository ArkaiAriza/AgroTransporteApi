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
    passport.authenticate('google',
    (req, res, next) => {
      res.send(req.user);
      res.redirect('exp://192.168.0.103:19000');
    }
  );

  /* app.get('/auth/google/redirect', async (req, res, next) => {
    res.redirect('exp://192.168.0.103:19000');
  }); */
};
