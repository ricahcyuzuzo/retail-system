const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const authHeader = req.headers['authorization'];
  // Support token from Authorization header OR from query string (?token=)
  const headerToken = authHeader && authHeader.split(' ')[1];
  const queryToken = req.query && req.query.token;
  const token = headerToken || queryToken;
  if (!token) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};
