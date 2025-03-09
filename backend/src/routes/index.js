
const productRouter = require('./ProductRouter');
const mobileUserRouter = require('./UserRouterMobile'); // Import file router của mobile

const authRoutes = require("./auth");
const dashboardRoutes = require("./dashboard");
const employeeRoutes = require("./employee");

const routes = (app) => {
  app.use('/product', productRouter);
  app.use('/mobile/users', mobileUserRouter); // ✅ API dành riêng cho mobile

  app.use("/", authRoutes);
  app.use("/dashboard", dashboardRoutes);
  app.use("/employees", employeeRoutes);
};

module.exports = routes;
