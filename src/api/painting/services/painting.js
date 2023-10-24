'use strict';

/**
 * painting service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::painting.painting');
