module.exports = ({ env }) => ({
  email: {
    config: {
      provider: 'sendgrid',
      providerOptions: {
        apiKey: env('SENDGRID_API_KEY'),
      },
      settings: {
        defaultFrom: env('SENDGRID_DEFAULT_FROM'),
        defaultReplyTo: env('SENDGRID_DEFAULT_TO'),
      },
    },
  },
  upload: {
    config: {
      provider: 'aws-s3',
      providerOptions: {
        s3Options: {
          accessKeyId: env('AWS_ACCESS_KEY'),
          secretAccessKey: env('AWS_ACCESS_SECRET'),
          region: env('AWS_REGION'),
          params: {
            Bucket: env('AWS_BUCKET'),
          },
        },
      },
      actionOptions: {
        upload: {},
        uploadStream: {},
        delete: {},
      },
    },
  },
  'duplicate-button': true,
});
