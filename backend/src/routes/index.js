const productRouter = require("./product");
const employeeRouter = require("./employee");
const authRouter = require("./auth");
const dashboardRouter = require("./dashboard");
const routes = (app) => {
  app.use("/", authRouter);
  app.use("/dashboard", dashboardRouter);
  app.use("/product", productRouter);
  app.use("/employees", employeeRouter);
};
module.exports = routes;
