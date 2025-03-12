const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.redirect("login");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).render("login", {
        title: "Đăng nhập",
        error: "Chỉ admin mới được truy cập",
      });
    }
    req.user = decoded;
    next();
  } catch (error) {
    res.redirect("login");
  }
};

module.exports = { protect };
