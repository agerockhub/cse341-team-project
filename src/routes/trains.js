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
