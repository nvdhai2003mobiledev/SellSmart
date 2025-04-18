exports.getDashboard = (req, res) => {
  res.render("dashboard/home", { 
    title: "Trang chủ", 
    page: "home",
    admin: {
      fullName: req.user?.fullName || 'Admin',
      avatar: req.user?.avatar || null
    },
    user: req.user || null
  });
};
