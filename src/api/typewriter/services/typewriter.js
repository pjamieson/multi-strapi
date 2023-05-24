'use strict';

/**
 * typewriter service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::typewriter.typewriter');
