// src/controllers/auth.js
import { createUser, findUserByEmail, verifyPassword } from "../models/users.js";

const text = (value) => (typeof value === "string" ? value : "");

// Decide where a signed-in user goes.
const homeFor = (user) =>
    user.role === "admin" ? "/admin-dashboard" : "/dashboard";

const renderRegister = (res, status, error, values = {}) =>
    res.status(status).render("register", { title: "Register", error, values });

const renderLogin = (res, status, error, values = {}) =>
    res.status(status).render("login", { title: "Log In", error, values });

export function registerPage(req, res) {
    if (req.user) {
        return res.redirect(homeFor(req.user));
    }
    return renderRegister(res, 200, null);
}

export function loginPage(req, res) {
    if (req.user) {
        return res.redirect(homeFor(req.user));
    }
    return renderLogin(res, 200, null);
}

export async function register(req, res, next) {
    const displayName = text(req.body.displayName).trim();
    const username = text(req.body.username).trim();
    const email = text(req.body.email).trim();
    const password = text(req.body.password);
    const values = { displayName, username, email };

    if (!displayName || !username || !email || !password) {
        return renderRegister(res, 400, "Please fill in every field.", values);
    }

    if (password.length < 8) {
        return renderRegister(res, 400, "Your password must be at least 8 characters.", values);
    }

    try {
        await createUser({ displayName, username, email, password });
        return res.redirect("/login?registered=1");
    } catch (error) {
        if (error.code === 11000) {
            return renderRegister(res, 409, "That email or username is already in use.", values);
        }
        if (error.name === "ValidationError") {
            return renderRegister(res, 400, "Please check your details and try again.", values);
        }
        return next(error);
    }
}

export async function login(req, res, next) {
    const email = text(req.body.email).trim();
    const password = text(req.body.password);

    try {
        const user = await findUserByEmail(email);
        const passwordMatches = user ? await verifyPassword(password, user.passwordHash) : false;

        if (!passwordMatches) {
            // The same message for a wrong email and a wrong password.
            return renderLogin(res, 401, "Incorrect email or password.", { email });
        }

        const sessionUser = {
            id: user._id.toString(),
            name: user.displayName,
            email: user.email,
            role: user.role?.name || "customer",
        };

        // A new session id after login protects against session fixation.
        return req.session.regenerate((regenerateError) => {
            if (regenerateError) {
                return next(regenerateError);
            }

            req.session.user = sessionUser;

            return req.session.save((saveError) => {
                if (saveError) {
                    return next(saveError);
                }

                return res.redirect(homeFor(sessionUser));
            });
        });
    } catch (error) {
        return next(error);
    }
}

export function logout(req, res, next) {
    req.session.destroy((error) => {
        if (error) {
            return next(error);
        }
        res.clearCookie("connect.sid");
        return res.redirect("/");
    });
}

export function adminDashboardPage(req, res) {
    res.render("admin-dashboard", { title: "Admin Dashboard" });
}
