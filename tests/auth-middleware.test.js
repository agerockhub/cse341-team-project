import { describe, expect, it, vi } from 'vitest';
import {
    requireApiLogin,
    requireApiRole,
    requirePageLogin,
    requirePageRole,
} from '../src/middleware/auth.js';

const makeRes = () => {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    res.redirect = vi.fn().mockReturnValue(res);
    res.render = vi.fn().mockReturnValue(res);
    return res;
};

const customer = { id: '1', name: 'Test', role: 'customer' };
const admin = { id: '2', name: 'Admin', role: 'admin' };

describe('API guards', () => {
    it('requireApiLogin returns 401 JSON when signed out', () => {
        const res = makeRes();
        const next = vi.fn();
        requireApiLogin({ user: null }, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
        expect(next).not.toHaveBeenCalled();
    });

    it('requireApiLogin lets a signed-in user through', () => {
        const next = vi.fn();
        requireApiLogin({ user: customer }, makeRes(), next);
        expect(next).toHaveBeenCalled();
    });

    it('requireApiRole returns 401 when signed out', () => {
        const res = makeRes();
        requireApiRole('admin')({ user: null }, res, vi.fn());
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('requireApiRole returns 403 JSON for the wrong role', () => {
        const res = makeRes();
        const next = vi.fn();
        requireApiRole('admin')({ user: customer }, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden' });
        expect(next).not.toHaveBeenCalled();
    });

    it('requireApiRole lets the right role through', () => {
        const next = vi.fn();
        requireApiRole('admin')({ user: admin }, makeRes(), next);
        expect(next).toHaveBeenCalled();
    });
});

describe('Page guards', () => {
    it('requirePageLogin redirects to /login when signed out', () => {
        const res = makeRes();
        requirePageLogin({ user: null }, res, vi.fn());
        expect(res.redirect).toHaveBeenCalledWith('/login');
    });

    it('requirePageRole redirects to /login when signed out', () => {
        const res = makeRes();
        requirePageRole('admin')({ user: null }, res, vi.fn());
        expect(res.redirect).toHaveBeenCalledWith('/login');
    });

    it('requirePageRole renders the 403 page for the wrong role', () => {
        const res = makeRes();
        const next = vi.fn();
        requirePageRole('admin')({ user: customer }, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.render).toHaveBeenCalledWith('errors/403', expect.any(Object));
        expect(next).not.toHaveBeenCalled();
    });

    it('requirePageRole lets the right role through', () => {
        const next = vi.fn();
        requirePageRole('admin')({ user: admin }, makeRes(), next);
        expect(next).toHaveBeenCalled();
    });
});