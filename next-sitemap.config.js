/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://www.pixelpulseplay.ca',
  generateRobotsTxt: true,
  sitemapSize: 7000,
  exclude: ['/admin/*', '/api/*', '/vaughan', '/vaughan/*'],
};
