
const productRouter = require("./product");
const employeeRouter = require("./employee");
const authRouter = require("./auth");
const dashboardRouter = require("./dashboard");
const customerRouter = require("./customer");
const providerRouter= require("./provider")
const routes = (app) => {
  app.use("/", authRouter);
  app.use("/dashboard", dashboardRouter);
  app.use("/products", productRouter);
  app.use("/employees", employeeRouter);
  app.use("/customers", customerRouter);
  app.use("/provider",providerRouter)
};
module.exports = routes;
