// src/models/roles.js
import role from "./schemas/roles.js";

export async function getRoleByName(name) {
    return role.findOne({ name }).lean();
}