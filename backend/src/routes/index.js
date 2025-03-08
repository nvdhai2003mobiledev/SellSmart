
const productRouter = require('./ProductRouter');
const employeeRouter = require('./employee');
const supplierRouter=require('./SupplierRouter')
const routers = (app) => {
  
  app.use('/product', productRouter);
  app.use('/employee', employeeRouter);
  app.use('/supplier', supplierRouter);
}

module.exports = routers;
