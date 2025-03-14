exports.getDashboard = (req, res) => {
  res.render("dashboard/home", { title: "Dashboard", page: "home" });
};
