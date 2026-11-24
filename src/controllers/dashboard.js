
// src/controllers/dashboard.js

// Render the customer dashboard.
export function dashboardPage(req, res) {
    return res.render("dashboard", {
        title: "My Dashboard",
        user: req.user,
    });
}
