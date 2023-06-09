module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('NODE_PORT', 1337),
  url: env('API_URL', 'https://api.ultraportabletypewriters.com'),
  app: {
    keys: env.array('APP_KEYS'),
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
});
