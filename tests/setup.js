import { afterAll, beforeAll, beforeEach, inject } from 'vitest';
import { closeDb, connectToDb, getDb } from '../src/db/connect.js';
import { initializeDatabase, initializeRoles } from '../src/db/initialize.js';

const connectionString = inject('MONGODB_TEST_URI');

beforeAll(async () => {
    await connectToDb({
        connectionString,
        databaseName: 'kizuna-rail-test'
    });
});

beforeEach(async () => {
    const db = getDb();

    await db.dropDatabase();

    // Initialize customer and admin roles first.
    await initializeRoles(db);

    // Initialize the starter collections and bookings.
    await initializeDatabase(db);
});

afterAll(async () => {
    await closeDb();
});