
const productRouter = require('./ProductRouter');
const employeeRouter = require('./employee');
const supplierRouter=require('./SupplierRouter')
const routers = (app) => {
  
  app.use('/product', productRouter);
  app.use('/employees', employeeRouter);
  app.use('/suppliers', supplierRouter);
}

module.exports = routers;
