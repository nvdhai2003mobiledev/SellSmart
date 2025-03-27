const productRouter = require("./product");
const employeeRouter = require("./employee");
const authRouter = require("./auth");
const dashboardRouter = require("./dashboard");
const customerRouter = require("./customer");
const orderRouter = require("./order");
const typeProductRouter = require("./typeproduct");
const providerRouter = require("./provider");
const documentRouter = require("./document"); // Giữ từ HEAD
const promotionRouter = require("./promotion");

const routes = (app) => {
  app.use("/", authRouter);
  app.use("/dashboard", dashboardRouter);
  app.use("/products", productRouter);
  app.use("/employees", employeeRouter);
  app.use("/customers", customerRouter);
  app.use("/orders", orderRouter);
  app.use("/typeproduct", typeProductRouter);
  app.use("/providers", providerRouter);
  app.use("/documents", documentRouter);
  app.use("/promotions", promotionRouter);

  return app;
};
module.exports = routes;
