(function () {
  'use strict';

  // ── API Layer ──
  // Fetches live data from Mailchimp, GA4, and Meta APIs.
  // Falls back gracefully to mock data if config is missing or API fails.

  var config = window.DASHBOARD_CONFIG || {};

  // ── Utility ──

  function isConfigured(section) {
    if (!config[section]) return false;
    var val = config[section];
    if (typeof val === 'string') return val && !val.startsWith('YOUR_');
    if (typeof val === 'object') {
      return Object.keys(val).some(function (k) {
        return typeof val[k] === 'string' && val[k] && !val[k].startsWith('YOUR_');
      });
    }
    return false;
  }

  function fetchJson(url, options) {
    return fetch(url, options || {}).then(function (res) {
      if (!res.ok) throw new Error('API ' + res.status + ': ' + res.statusText);
      return res.json();
    });
  }

  // ── Mailchimp ──

  function fetchMailchimp() {
    var mc = config.mailchimp;
    if (!mc || !mc.apiKey || mc.apiKey.startsWith('YOUR_')) {
      return Promise.resolve(null);
    }

    var dc = mc.apiKey.split('-')[1] || 'us21';
    var baseUrl = 'https://' + dc + '.api.mailchimp.com/3.0';
    var proxy = mc.proxyUrl || '';
    var authHeader = 'Basic ' + btoa('dashboard:' + mc.apiKey);

    var headers = { 'Authorization': authHeader };

    // Fetch account-level stats and recent campaigns
    return Promise.all([
      fetchJson(proxy + encodeURIComponent(baseUrl + '/lists?count=10&fields=lists.stats,lists.name,lists.id'), { headers: headers }),
      fetchJson(proxy + encodeURIComponent(baseUrl + '/reports?count=5&fields=reports.campaign_title,reports.emails_sent,reports.opens,reports.clicks,reports.send_time'), { headers: headers })
    ]).then(function (results) {
      var lists = results[0];
      var reports = results[1];

      // Aggregate subscriber count across all lists
      var totalSubscribers = 0;
      if (lists && lists.lists) {
        lists.lists.forEach(function (list) {
          totalSubscribers += (list.stats && list.stats.member_count) || 0;
        });
      }

      // Calculate avg open/click rates from recent campaigns
      var totalOpens = 0;
      var totalClicks = 0;
      var totalSent = 0;
      var campaignCount = 0;
      if (reports && reports.reports) {
        reports.reports.forEach(function (r) {
          campaignCount++;
          totalSent += r.emails_sent || 0;
          totalOpens += (r.opens && r.opens.unique_opens) || 0;
          totalClicks += (r.clicks && r.clicks.unique_clicks) || 0;
        });
      }

      return {
        subscribers: totalSubscribers,
        openRate: totalSent > 0 ? Math.round((totalOpens / totalSent) * 1000) / 10 : 0,
        clickRate: totalSent > 0 ? Math.round((totalClicks / totalSent) * 1000) / 10 : 0,
        recentCampaigns: campaignCount,
        source: 'mailchimp'
      };
    }).catch(function (err) {
      console.warn('[Mailchimp] Fetch failed:', err.message);
      return null;
    });
  }

  // ── Google Analytics 4 ──

  function fetchGA4() {
    var ga = config.ga4;
    if (!ga || !ga.propertyId || ga.propertyId.startsWith('YOUR_')) {
      return Promise.resolve(null);
    }

    // If a proxy URL is provided, use it (handles service account auth server-side)
    if (ga.proxyUrl) {
      return fetchJson(ga.proxyUrl + '?propertyId=' + ga.propertyId + '&period=quarter')
        .catch(function (err) {
          console.warn('[GA4] Proxy fetch failed:', err.message);
          return null;
        });
    }

    // Direct API call with API key (limited, requires property to be public or OAuth)
    var apiKey = ga.apiKey;
    if (!apiKey || apiKey.startsWith('YOUR_')) {
      console.warn('[GA4] No API key or proxy configured');
      return Promise.resolve(null);
    }

    var url = 'https://analyticsdata.googleapis.com/v1beta/properties/' +
      ga.propertyId + ':runReport?key=' + apiKey;

    var body = {
      dateRanges: [{ startDate: '90daysAgo', endDate: 'today' }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' }
      ]
    };

    return fetchJson(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (data) {
      if (!data.rows || !data.rows[0]) return null;
      var values = data.rows[0].metricValues;
      return {
        activeUsers: parseInt(values[0].value, 10),
        sessions: parseInt(values[1].value, 10),
        pageViews: parseInt(values[2].value, 10),
        avgSessionDuration: Math.round(parseFloat(values[3].value)),
        source: 'ga4'
      };
    }).catch(function (err) {
      console.warn('[GA4] Fetch failed:', err.message);
      return null;
    });
  }

  // ── Meta (Instagram + Facebook) ──

  function fetchMeta() {
    var token = config.metaAccessToken;
    if (!token || token.startsWith('YOUR_')) {
      return Promise.resolve(null);
    }

    var promises = [];

    // Instagram Business insights
    if (config.instagramAccountId && !config.instagramAccountId.startsWith('YOUR_')) {
      var igUrl = 'https://graph.facebook.com/v19.0/' + config.instagramAccountId +
        '?fields=followers_count,media_count,name&access_token=' + token;
      promises.push(
        fetchJson(igUrl).then(function (d) {
          return { igFollowers: d.followers_count, igPosts: d.media_count, igName: d.name };
        }).catch(function () { return {}; })
      );
    } else {
      promises.push(Promise.resolve({}));
    }

    // Facebook Page insights
    if (config.facebookPageId && !config.facebookPageId.startsWith('YOUR_')) {
      var fbUrl = 'https://graph.facebook.com/v19.0/' + config.facebookPageId +
        '?fields=fan_count,name,new_like_count&access_token=' + token;
      promises.push(
        fetchJson(fbUrl).then(function (d) {
          return { fbPageLikes: d.fan_count, fbPageName: d.name };
        }).catch(function () { return {}; })
      );
    } else {
      promises.push(Promise.resolve({}));
    }

    // Facebook Ad Account insights (last 90 days)
    if (config.facebookAdAccountId && !config.facebookAdAccountId.startsWith('YOUR_')) {
      var adUrl = 'https://graph.facebook.com/v19.0/' + config.facebookAdAccountId +
        '/insights?fields=spend,impressions,reach,actions&date_preset=last_quarter&access_token=' + token;
      promises.push(
        fetchJson(adUrl).then(function (d) {
          if (!d.data || !d.data[0]) return {};
          var row = d.data[0];
          return {
            adSpend: parseFloat(row.spend) || 0,
            adImpressions: parseInt(row.impressions, 10) || 0,
            adReach: parseInt(row.reach, 10) || 0
          };
        }).catch(function () { return {}; })
      );
    } else {
      promises.push(Promise.resolve({}));
    }

    return Promise.all(promises).then(function (results) {
      var merged = { source: 'meta' };
      results.forEach(function (r) { Object.assign(merged, r); });
      return merged;
    }).catch(function (err) {
      console.warn('[Meta] Fetch failed:', err.message);
      return null;
    });
  }

  // ── Data Binding: Update DOM with live data ──

  function updateElement(selector, value) {
    var el = document.querySelector(selector);
    if (el && value !== undefined && value !== null) {
      el.textContent = value;
    }
  }

  function applyMailchimpData(data) {
    if (!data) return;
    // Services tab — Communication & Outreach
    updateElement('[data-metric="mc-subscribers"]', data.subscribers.toLocaleString());
    updateElement('[data-metric="mc-open-rate"]', data.openRate + '%');
    updateElement('[data-metric="mc-click-rate"]', data.clickRate + '%');
    // Summary tab — Membership panel
    updateElement('[data-metric="mc-subscribers-summary"]', data.subscribers.toLocaleString());
    console.log('[Mailchimp] Data applied:', data);
  }

  function applyGA4Data(data) {
    if (!data) return;
    // Services tab — Communication & Outreach
    updateElement('[data-metric="ga4-visitors"]', data.activeUsers.toLocaleString());
    updateElement('[data-metric="ga4-sessions"]', data.sessions.toLocaleString());
    updateElement('[data-metric="ga4-pageviews"]', data.pageViews.toLocaleString());
    console.log('[GA4] Data applied:', data);
  }

  function applyMetaData(data) {
    if (!data) return;
    if (data.igFollowers) {
      updateElement('[data-metric="ig-followers"]', data.igFollowers.toLocaleString());
    }
    if (data.fbPageLikes) {
      updateElement('[data-metric="fb-page-likes"]', data.fbPageLikes.toLocaleString());
    }
    if (data.adSpend !== undefined) {
      updateElement('[data-metric="fb-ad-spend"]', '$' + data.adSpend.toLocaleString());
    }
    console.log('[Meta] Data applied:', data);
  }

  // ── Loading States ──

  function showLoading() {
    document.querySelectorAll('[data-metric]').forEach(function (el) {
      el.setAttribute('data-original', el.textContent);
      el.classList.add('metric-loading');
    });
  }

  function hideLoading() {
    document.querySelectorAll('.metric-loading').forEach(function (el) {
      el.classList.remove('metric-loading');
    });
  }

  // ── Main Fetch ──

  function fetchAllData() {
    showLoading();

    Promise.all([
      fetchMailchimp(),
      fetchGA4(),
      fetchMeta()
    ]).then(function (results) {
      hideLoading();

      var mc = results[0];
      var ga = results[1];
      var meta = results[2];

      applyMailchimpData(mc);
      applyGA4Data(ga);
      applyMetaData(meta);

      // Update last-updated timestamp
      if (mc || ga || meta) {
        var now = new Date();
        var ts = now.toLocaleString('en-CA', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        updateElement('.last-updated', 'Live \u00b7 ' + ts);
      }
    }).catch(function (err) {
      hideLoading();
      console.warn('[Dashboard] Data fetch error:', err);
    });
  }

  // ── Init ──

  window.addEventListener('load', function () {
    // Only fetch if at least one integration is configured
    var hasConfig = isConfigured('mailchimp') || isConfigured('ga4') ||
      (config.metaAccessToken && !config.metaAccessToken.startsWith('YOUR_'));

    if (hasConfig) {
      fetchAllData();

      // Auto-refresh with Visibility API — pause when tab is hidden
      var interval = (config.refreshIntervalMinutes || 15) * 60 * 1000;
      var refreshTimer = setInterval(fetchAllData, interval);

      document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
          clearInterval(refreshTimer);
          refreshTimer = null;
        } else {
          if (!refreshTimer) {
            fetchAllData();
            refreshTimer = setInterval(fetchAllData, interval);
          }
        }
      });
    } else {
      console.info('[Dashboard] No API keys configured. Showing mock data. Copy config.example.js to config.js and add your keys.');
    }
  });

})();
