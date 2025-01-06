const userRoute = require('./UserRoute');
const productRouter = require('./ProductRouter');
const routes = (app) => {
  app.use('/user', userRoute), app.use('/product', productRouter);
};

module.exports = routes;
