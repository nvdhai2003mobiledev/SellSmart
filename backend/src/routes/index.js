const authRoutes = require("./auth");
const dashboardRoutes = require("./dashboard");
const employeeRoutes = require("./employee");
const routers = (app) => {
  app.use("/", authRoutes);
  app.use("/employees", employeeRoutes);
};

module.exports = routers;
