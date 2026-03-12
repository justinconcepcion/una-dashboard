// Copy this file to config.js and fill in your credentials.
// config.js is gitignored — your keys will never be committed.

var DASHBOARD_CONFIG = {
  // Mailchimp Marketing API
  // Get yours: Account > Extras > API Keys > Create a Key
  // Format: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-usXX"
  // The "-usXX" suffix is your data center (e.g. us21)
  mailchimp: {
    apiKey: 'YOUR_MAILCHIMP_API_KEY',
    // CORS proxy is required because Mailchimp API doesn't allow browser requests.
    // Options: use a free proxy for dev, or deploy a tiny serverless function later.
    proxyUrl: 'https://corsproxy.io/?'
  },

  // Google Analytics 4 Data API
  // Requires a Google Cloud project with GA4 Data API enabled.
  // For a static site (no backend), we use an OAuth2 client with an API key,
  // OR a proxy endpoint that handles the service account auth server-side.
  ga4: {
    propertyId: 'YOUR_GA4_PROPERTY_ID',  // numeric ID from GA4 Admin > Property Settings
    apiKey: 'YOUR_GOOGLE_API_KEY',        // from Google Cloud Console > APIs & Services > Credentials
    // If using a proxy for service account auth:
    proxyUrl: ''
  },

  // Meta Graph API (Instagram Business + Facebook Pages + Facebook Ads)
  // Get yours: developers.facebook.com > Your App > Tools > Graph API Explorer
  metaAccessToken: 'YOUR_META_ACCESS_TOKEN',
  instagramAccountId: 'YOUR_INSTAGRAM_BUSINESS_ACCOUNT_ID',
  facebookPageId: 'YOUR_FACEBOOK_PAGE_ID',
  facebookAdAccountId: 'act_YOUR_AD_ACCOUNT_ID',

  // Refresh interval in minutes (default: 15)
  refreshIntervalMinutes: 15
};
