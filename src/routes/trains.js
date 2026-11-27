import { getDb } from '../db/connect.js';

const TRAIN_SORT_FIELDS = [
    'name',
    'operator',
    'type',
    'maxSpeedKmh',
    'capacity',
    'powerSource',
];

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

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

const trainsPage = (req, res) => {
    res.render('trains', { title: 'Trains' });
};

/**
 * @swagger
 * /api/trains:
 *   get:
 *     summary: Get a paginated list of trains
 *     description: Returns train records with pagination and sorting options.
 *     tags:
 *       - Trains
 *     parameters:
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
 *         description: Field used to sort the train records.
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
 *         description: Invalid pagination or sorting parameters.
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

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    const order = orderText === 'asc' ? 1 : -1;
    const skip = (page - 1) * limit;

    try {
        const collection = getDb().collection('trains');

        const [trains, totalItems] = await Promise.all([
            collection
                .find({})
                .sort({ [sort]: order, id: 1 })
                .skip(skip)
                .limit(limit)
                .toArray(),
            collection.countDocuments({}),
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
