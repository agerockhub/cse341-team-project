// src/swagger.js
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Kizuna Rail API',
            version: '1.0.0',
            description: 'API for Kizuna Rail trips and related data',
        },
    },
    apis: ['./src/routes/*.js'],
};

export default swaggerJsdoc(options);