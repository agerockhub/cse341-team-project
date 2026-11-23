// src/models/users.js
import bcrypt from "bcrypt";
import user from "./schemas/users.js";
import { getRoleByName } from "./roles.js";

const SALT_ROUNDS = 12;

// Public registration always creates a customer. The role is never taken from the request.
export async function createUser({ displayName, username, email, password }) {
    const customerRole = await getRoleByName("customer");

    if (!customerRole) {
        throw new Error("The customer role is missing. Run npm run db:roles first.");
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const created = await user.create({
        displayName,
        username,
        email,
        passwordHash,
        role: customerRole._id,
    });

    return created.toObject();
}

export async function findUserByEmail(email) {
    return user
        .findOne({ email: String(email).toLowerCase().trim() })
        .populate("role")
        .lean();
}

export async function verifyPassword(password, passwordHash) {
    return bcrypt.compare(password, passwordHash);
}