const userRoute = require('./UserRoute');
const productRouter = require('./ProductRouter');
const employeeRouter = require('./EmployeeRouter');
const supplierRouter=require('./SupplierRouter')
const routes = (app) => {
  app.use('/user', userRoute);
  app.use('/product', productRouter);
  app.use('/employee', employeeRouter);
  app.use('/supplier', supplierRouter);

};

module.exports = routes;
