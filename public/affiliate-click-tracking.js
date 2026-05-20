/**
 * Affiliate Click Tracking Script
 *
 * Embed on any landing page:
 *   <script src="/affiliate-click-tracking.js"></script>
 *
 * Mark affiliate links with data-affiliate-link attribute:
 *   <a href="https://partner.example.com/..." data-affiliate-link>Buy Now</a>
 *
 * Optional config (set before this script loads):
 *   <script>
 *     window.AFFILIATE_CONFIG = {
 *       serverUrl: 'https://your-server.com',  // default: same origin
 *       subIdParam: 'subId1',                  // URL param name for UUID
 *       debug: false,
 *     };
 *   </script>
 */

(function () {
  'use strict';

  const CONFIG = Object.assign(
    { serverUrl: '', subIdParam: 'subId1', debug: false },
    window.AFFILIATE_CONFIG || {}
  );

  function log(...args) {
    if (CONFIG.debug) console.log('[affiliate]', ...args);
  }

  function getCookie(name) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = document.cookie.match(new RegExp('(?:^|;)\\s*' + escaped + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  }

  function getUrlParam(name) {
    return new URLSearchParams(location.search).get(name);
  }

  function collectPixels() {
    const fbclid = getUrlParam('fbclid');
    return {
      fbc: getCookie('_fbc') || (fbclid ? 'fb.1.' + Date.now() + '.' + fbclid : null),
      fbp: getCookie('_fbp'),
      ttclid: getUrlParam('ttclid') || getCookie('_ttp_ttclid'),
      ttp: getCookie('_ttp'),
    };
  }

  function parseBrandFromUrl(url) {
    try {
      const u = new URL(url);
      const parts = u.pathname.split('/').filter(Boolean);
      return {
        brand_name: u.hostname.replace(/^www\./, '').split('.')[0],
        brand_id: parts[parts.length - 1] || '',
        aff_url: url,
      };
    } catch (_) {
      return { aff_url: url };
    }
  }

  function appendSubId(url, uuid) {
    try {
      const u = new URL(url);
      u.searchParams.set(CONFIG.subIdParam, uuid);
      return u.toString();
    } catch (_) {
      const sep = url.includes('?') ? '&' : '?';
      return url + sep + CONFIG.subIdParam + '=' + uuid;
    }
  }

  async function trackClick(targetUrl) {
    const pixels = collectPixels();
    const brand = parseBrandFromUrl(targetUrl);

    const payload = {
      ...pixels,
      ...brand,
      ua: navigator.userAgent,
      referrer: document.referrer,
      time: Date.now(),
    };

    log('tracking click', payload);

    try {
      const res = await fetch(CONFIG.serverUrl + '/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && data.uuid) {
        log('UUID received:', data.uuid);
        return data.uuid;
      }
    } catch (err) {
      log('server call failed:', err.message);
    }
    return null;
  }

  function redirect(link, url) {
    if (link && link.target === '_blank') {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = url;
    }
  }

  async function handleClick(e) {
    const link = e.target.closest('a[data-affiliate-link], a[data-affiliate]');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || href.startsWith('javascript:')) return;

    e.preventDefault();

    const uuid = await trackClick(href);
    const finalUrl = uuid ? appendSubId(href, uuid) : href;
    log('redirecting to:', finalUrl);
    redirect(link, finalUrl);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () =>
      document.addEventListener('click', handleClick)
    );
  } else {
    document.addEventListener('click', handleClick);
  }

  log('affiliate tracking initialized');
})();
