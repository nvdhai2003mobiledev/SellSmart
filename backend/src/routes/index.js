const userRoute = require('./UserRoute');
const productRouter = require('./ProductRouter');
const mobileUserRouter = require('./UserRouterMobile'); // Import file router của mobile

const routes = (app) => {
  app.use('/user', userRoute);
  app.use('/product', productRouter);
  app.use('/mobile/users', mobileUserRouter); // ✅ API dành riêng cho mobile
};

module.exports = routes;
