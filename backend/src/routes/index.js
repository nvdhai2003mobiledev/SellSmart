const productRouter = require("./product");
const employeeRouter = require("./employee");
const authRouter = require("./auth");
const dashboardRouter = require("./dashboard");
const customerRouter = require("./customer");
const orderRouter = require("./order");
const typeProductRouter = require("./typeproduct");
const providerRouter = require("./provider");
const documentRouter = require("./document");
const promotionRouter = require("./promotion");
const warrantyRouter = require("./warranty");

// Thêm route ping để kiểm tra kết nối server
const express = require("express");
const pingRouter = express.Router();
pingRouter.get('/ping', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Server is up and running' });
});

const routes = (app) => {
  app.use(pingRouter);
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
  app.use("/warranty", warrantyRouter);
  return app;
};

module.exports = routes;
