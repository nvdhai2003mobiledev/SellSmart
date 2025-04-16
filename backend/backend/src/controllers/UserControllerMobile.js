const { loginUserMobile } = require('../services/UserServiceMobile');

const loginMobile = async (req, res) => {
  try {
    const result = await loginUserMobile(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json(error);
  }
};

module.exports = { loginMobile };
