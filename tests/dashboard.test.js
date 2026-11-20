import { beforeEach, describe, expect, test } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../app.js';

import userModel from '../src/models/schemas/users.js';
import roleModel from '../src/models/schemas/roles.js';
import bookingModel from '../src/models/schemas/bookings.js';

import { createUser } from '../src/models/users.js';

const CUSTOMER_EMAIL = 'dashboardcustomer@example.com';
const CUSTOMER_PASSWORD = 'CustomerPass123';

const ADMIN_EMAIL = 'dashboardadmin@example.com';
const ADMIN_PASSWORD = 'AdminPass123';


async function createTestUsers() {
    const customerRole = await roleModel.findOne({ name: 'customer' });
    const adminRole = await roleModel.findOne({ name: 'admin' });

    // Create customer using the application's existing user model.
    await createUser({
        displayName: 'Dashboard Customer',
        username: 'dashboardcustomer',
        email: CUSTOMER_EMAIL,
        password: CUSTOMER_PASSWORD,
    });

    // Create an administrator directly using the existing schema.
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

   await userModel.create({
        displayName: 'Dashboard Admin',
        username: 'dashboardadmin',
        email: ADMIN_EMAIL,
        passwordHash,
        role: adminRole._id,
    });

    expect(customerRole).toBeTruthy();
    expect(adminRole).toBeTruthy();
}

async function createCustomerBooking() {
    await bookingModel.create({
        id: 'DASH-BOOK-001',
        scheduleId: 1,
        tripId: 'alpine-panorama',
        ticketClass: 'First Class',
        selectedDay: '2026-12-15',
        passengers: [
            {
                firstName: 'Dashboard',
                lastName: 'Customer',
                email: CUSTOMER_EMAIL,
                phone: '0240000000',
            },
        ],
    });
}

describe('Dashboard and navigation integration tests', () => {
    beforeEach(async () => {
        await createTestUsers();
        await createCustomerBooking();
    });

    test('signed-out users are redirected from the dashboard to login', async () => {
        const response = await request(app)
            .get('/dashboard');

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('/login');
    });

    test('signed-out users cannot access their bookings API', async () => {
        const response = await request(app)
            .get('/api/bookings/me');

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            message: 'Authentication required',
        });
    });

    test('customers can log in and are redirected to the dashboard', async () => {
        const agent = request.agent(app);

        const response = await agent
            .post('/login')
            .send({
                email: CUSTOMER_EMAIL,
                password: CUSTOMER_PASSWORD,
            });

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('/dashboard');
    });

    test('authenticated customers can access the dashboard', async () => {
        const agent = request.agent(app);

        await agent
            .post('/login')
            .send({
                email: CUSTOMER_EMAIL,
                password: CUSTOMER_PASSWORD,
            });

        const response = await agent.get('/dashboard');

        expect(response.status).toBe(200);
        expect(response.text).toContain('Welcome, Dashboard Customer!');
        expect(response.text).toContain(CUSTOMER_EMAIL);
        expect(response.text).toContain('My Bookings');
    });

    test('customers can retrieve their own bookings', async () => {
        const agent = request.agent(app);

        await agent
            .post('/login')
            .send({
                email: CUSTOMER_EMAIL,
                password: CUSTOMER_PASSWORD,
            });

        const response = await agent.get('/api/bookings/me');

        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body).toHaveLength(1);

        expect(response.body[0]).toMatchObject({
            id: 'DASH-BOOK-001',
            tripId: 'alpine-panorama',
        });
    });

    test('customers cannot access the admin dashboard', async () => {
        const agent = request.agent(app);

        await agent
            .post('/login')
            .send({
                email: CUSTOMER_EMAIL,
                password: CUSTOMER_PASSWORD,
            });

        const response = await agent.get('/admin-dashboard');

        expect(response.status).toBe(403);
    });

    test('customers cannot access the admin bookings API', async () => {
        const agent = request.agent(app);

        await agent
            .post('/login')
            .send({
                email: CUSTOMER_EMAIL,
                password: CUSTOMER_PASSWORD,
            });

        const response = await agent.get('/api/bookings');

        expect(response.status).toBe(403);
        expect(response.body).toEqual({
            message: 'Forbidden',
        });
    });

    test('admins can log in and are redirected to the admin dashboard', async () => {
        const agent = request.agent(app);

        const response = await agent
            .post('/login')
            .send({
                email: ADMIN_EMAIL,
                password: ADMIN_PASSWORD,
            });

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('/admin-dashboard');
    });

    test('admins can access the admin dashboard', async () => {
        const agent = request.agent(app);

        await agent
            .post('/login')
            .send({
                email: ADMIN_EMAIL,
                password: ADMIN_PASSWORD,
            });

        const response = await agent.get('/admin-dashboard');

        expect(response.status).toBe(200);
        expect(response.text).toContain('Welcome to the Admin Dashboard');
    });

    test('admins can access the admin bookings API', async () => {
        const agent = request.agent(app);

        await agent
            .post('/login')
            .send({
                email: ADMIN_EMAIL,
                password: ADMIN_PASSWORD,
            });

        const response = await agent.get('/api/bookings');

        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
    });

    test('logout ends the customer session', async () => {
        const agent = request.agent(app);

        await agent
            .post('/login')
            .send({
                email: CUSTOMER_EMAIL,
                password: CUSTOMER_PASSWORD,
            });

        const logoutResponse = await agent
            .post('/logout');

        expect(logoutResponse.status).toBe(302);
        expect(logoutResponse.headers.location).toBe('/');

        const dashboardResponse = await agent
            .get('/dashboard');

        expect(dashboardResponse.status).toBe(302);
        expect(dashboardResponse.headers.location).toBe('/login');
    });
});
