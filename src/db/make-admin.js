import { closeDb, connectToDb } from './connect.js';

const email = process.argv[2]?.toLowerCase().trim();

if (!email) {
    console.error('Usage: npm run db:make-admin -- your-email@example.com');
    process.exit(1);
}

try {
    const db = await connectToDb();
    const adminRole = await db.collection('roles').findOne({ name: 'admin' });

    if (!adminRole) {
        console.error('The admin role is missing. Run npm run db:roles first.');
        process.exitCode = 1;
    } else {
        const result = await db
            .collection('users')
            .updateOne({ email }, { $set: { role: adminRole._id } });

        console.log(
            result.matchedCount
                ? `${email} is now an admin. Log out and log in again.`
                : `No user found with the email ${email}.`
        );
    }
} finally {
    await closeDb();
}