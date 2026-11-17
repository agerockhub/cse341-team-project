import { closeDb, connectToDb } from './connect.js';
import { initializeRoles } from './initialize.js';

try {
    const db = await connectToDb();
    await initializeRoles(db);
    console.log('Roles are in place: customer, admin.');
} finally {
    await closeDb();
}