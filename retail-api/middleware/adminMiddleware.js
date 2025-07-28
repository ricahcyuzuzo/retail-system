const User = require('../models/User');

module.exports = async function (req, res, next) {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
