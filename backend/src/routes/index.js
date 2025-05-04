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
const warrantyRouter = require("./warranty");
const inventoryRouter = require("./inventory");
const warrantyRoutes = require("./warrantyRoutes")
const routes = (app) => {
  app.use("/", authRouter);
  app.use("/dashboard", dashboardRouter);
  app.use("/inventory", inventoryRouter);
  app.use("/products", productRouter);
  app.use("/employees", employeeRouter);
  app.use("/customers", customerRouter);
  app.use("/orders", orderRouter);
  app.use("/typeproduct", typeProductRouter);
  app.use("/providers", providerRouter);
  app.use("/documents", documentRouter);
  app.use("/promotions", promotionRouter);
  app.use("/warranty", warrantyRouter);
  app.use("/warranty-support", warrantyRoutes);

  return app;
};
module.exports = routes;
