import trips from './seeds/trips.json' with { type: 'json' };
import schedules from './seeds/schedules.json' with { type: 'json' };
import stations from './seeds/stations.json' with { type: 'json' };
import ticketClasses from './seeds/ticket-classes.json' with { type: 'json' };
import trains from './seeds/trains.json' with { type: 'json' };

const starterCollections = [
  ['trips', trips],
  ['schedules', schedules],
  ['stations', stations],
  ['ticketClasses', ticketClasses],
  ['trains', trains]
];

const roleNames = ['customer', 'admin'];

// Adds the standard roles by name. Existing roles are left alone,
// so users keep a valid role reference.
const initializeRoles = async (db) => {
  const roles = db.collection('roles');
  await roles.createIndex({ name: 1 }, { unique: true });

  for (const name of roleNames) {
    await roles.updateOne({ name }, { $setOnInsert: { name } }, { upsert: true });
  }
};

const initializeDatabase = async (db) => {
  if (!db) {
    throw new Error('A database connection is required to initialize data.');
  }

  for (const [collectionName, documents] of starterCollections) {
    const collection = db.collection(collectionName);
    await collection.deleteMany({});
    await collection.insertMany(documents);
  }

  const bookings = db.collection('bookings');
  await bookings.deleteMany({});
  await bookings.createIndex({ id: 1 }, { unique: true });
};

export { initializeDatabase, initializeRoles, starterCollections };