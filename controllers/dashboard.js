function controlDashboardGet(req, res) {
  res.render("dashboard", {
    title: "Dashboard",
    user: req.user,
  });
}

function controlUploadPost(req, res) {
  req.flash("success", "File uploaded successfully");
  res.redirect("/dashboard");
}

module.exports = {
  controlDashboardGet,
  controlUploadPost,
};