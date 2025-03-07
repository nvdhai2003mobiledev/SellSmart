<<<<<<< HEAD
const userRoute = require('./UserRoute');
const productRouter = require('./ProductRouter');
const mobileUserRouter = require('./UserRouterMobile'); // Import file router của mobile

const routes = (app) => {
  app.use('/user', userRoute);
  app.use('/product', productRouter);
  app.use('/mobile/users', mobileUserRouter); // ✅ API dành riêng cho mobile
=======
const authRoutes = require("./auth");
const dashboardRoutes = require("./dashboard");
const employeeRoutes = require("./employee");
const routers = (app) => {
  app.use("/", authRoutes);
  app.use("/employees", employeeRoutes);
>>>>>>> 020b47ca46b2e2cab43ec38af5437ee7a01f20e2
};

module.exports = routers;
