import { getDb } from '../db/connect.js';

const TRAIN_SORT_FIELDS = [
    'name',
    'operator',
    'type',
    'maxSpeedKmh',
    'capacity',
    'powerSource',
];

const TRAIN_SEARCH_FIELDS = [
    'name',
    'operator',
    'type',
    'powerSource',
    'bestFor',
    'description',
];

const TRAIN_FILTER_FIELDS = [
    'type',
    'powerSource',
];

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
const MAX_SEARCH_LENGTH = 100;

const parsePositiveInteger = (value, defaultValue) => {
    if (value === undefined) {
        return defaultValue;
    }

    if (typeof value !== 'string' || !/^\d+$/.test(value)) {
        return null;
    }

    const parsed = Number(value);

    return Number.isSafeInteger(parsed) && parsed >= 1 ? parsed : null;
};

const escapeRegex = (value) => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const trainsPage = (req, res) => {
    res.render('trains', { title: 'Trains' });
};

/**
 * @swagger
 * /api/trains:
 *   get:
 *     summary: Get trains with search, filtering, pagination and sorting
 *     description: Returns train records matching keyword searches and filters.
 *     tags:
 *       - Trains
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Search trains by name, operator, type, power source, bestFor, or description.
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter trains by train type.
 *       - in: query
 *         name: powerSource
 *         schema:
 *           type: string
 *         description: Filter trains by power source.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number to retrieve.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of trains per page.
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum:
 *             - name
 *             - operator
 *             - type
 *             - maxSpeedKmh
 *             - capacity
 *             - powerSource
 *           default: name
 *         description: Field used to sort train records.
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum:
 *             - asc
 *             - desc
 *           default: asc
 *         description: Sort order.
 *     responses:
 *       200:
 *         description: Trains retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       operator:
 *                         type: string
 *                       type:
 *                         type: string
 *                       maxSpeedKmh:
 *                         type: number
 *                       capacity:
 *                         type: number
 *                       powerSource:
 *                         type: string
 *                       bestFor:
 *                         type: string
 *                       description:
 *                         type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     hasNextPage:
 *                       type: boolean
 *                     hasPreviousPage:
 *                       type: boolean
 *       400:
 *         description: Invalid query parameters.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                       message:
 *                         type: string
 */
const trainsApi = async (req, res, next) => {
    const errors = [];

    // Pagination validation
    const page = parsePositiveInteger(req.query.page, 1);

    if (page === null) {
        errors.push({
            field: 'page',
            message: 'page must be a whole number of 1 or more.',
        });
    }

    const limit = parsePositiveInteger(req.query.limit, DEFAULT_LIMIT);

    if (limit === null || limit > MAX_LIMIT) {
        errors.push({
            field: 'limit',
            message: `limit must be a whole number between 1 and ${MAX_LIMIT}.`,
        });
    }

    // Sorting validation
    const sort = req.query.sort === undefined ? 'name' : req.query.sort;

    if (!TRAIN_SORT_FIELDS.includes(sort)) {
        errors.push({
            field: 'sort',
            message: `sort must be one of: ${TRAIN_SORT_FIELDS.join(', ')}.`,
        });
    }

    const orderText = req.query.order === undefined ? 'asc' : req.query.order;

    if (!['asc', 'desc'].includes(orderText)) {
        errors.push({
            field: 'order',
            message: 'order must be asc or desc.',
        });
    }

    // Keyword search validation
    const q = req.query.q;

    if (q !== undefined) {
        if (typeof q !== 'string') {
            errors.push({
                field: 'q',
                message: 'q must be a single string.',
            });
        } else if (q.trim().length === 0) {
            errors.push({
                field: 'q',
                message: 'q cannot be empty.',
            });
        } else if (q.trim().length > MAX_SEARCH_LENGTH) {
            errors.push({
                field: 'q',
                message: `q cannot exceed ${MAX_SEARCH_LENGTH} characters.`,
            });
        }
    }

    // Filter validation
    for (const field of TRAIN_FILTER_FIELDS) {
        const value = req.query[field];

        if (value !== undefined) {
            if (typeof value !== 'string') {
                errors.push({
                    field,
                    message: `${field} must be a single string.`,
                });
            } else if (value.trim().length === 0) {
                errors.push({
                    field,
                    message: `${field} cannot be empty.`,
                });
            }
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    const order = orderText === 'asc' ? 1 : -1;
    const skip = (page - 1) * limit;

    // Build MongoDB search and filter query
    const query = {};

    for (const field of TRAIN_FILTER_FIELDS) {
        const value = req.query[field];

        if (value !== undefined) {
            query[field] = value.trim();
        }
    }

    if (q !== undefined) {
        const keyword = escapeRegex(q.trim());

        query.$or = TRAIN_SEARCH_FIELDS.map((field) => ({
            [field]: {
                $regex: keyword,
                $options: 'i',
            },
        }));
    }

    try {
        const collection = getDb().collection('trains');

        // Apply search, filters, sorting and pagination
        const [trains, totalItems] = await Promise.all([
            collection
                .find(query)
                .sort({ [sort]: order, id: 1 })
                .skip(skip)
                .limit(limit)
                .toArray(),

            collection.countDocuments(query),
        ]);

        const totalPages = Math.ceil(totalItems / limit);

        return res.json({
            data: trains,
            pagination: {
                currentPage: page,
                limit,
                totalItems,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        });
    } catch (error) {
        return next(error);
    }
};

export { trainsApi, trainsPage };
