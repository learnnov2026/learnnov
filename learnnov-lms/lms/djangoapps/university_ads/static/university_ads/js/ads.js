/**
 * university_ads/ads.js
 * Loads ad banners from /api/university_ads/ads/ and injects them into the page.
 * Tracks impressions and clicks via the tracking API.
 */
(function () {
  'use strict';

  var API_BASE = '/api/university_ads';
  var CSRF_COOKIE = 'csrftoken';

  function getCookie(name) {
    var v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
    return v ? v[2] : null;
  }

  function postJSON(url) {
    fetch(url, {
      method: 'POST',
      headers: {
        'X-CSRFToken': getCookie(CSRF_COOKIE),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'page=' + encodeURIComponent(window.location.pathname),
    });
  }

  function buildBannerCard(ad) {
    var a = document.createElement('a');
    a.className = 'univ-ad-card';
    a.href = '#'; // navigate via click handler
    a.setAttribute('data-ad-id', ad.id);
    a.setAttribute('data-link', ad.link_url);
    a.setAttribute('aria-label', ad.title);

    var imgHtml = ad.image_url
      ? '<img class="univ-ad-card__image" src="' + ad.image_url + '" alt="' + ad.title + '" loading="lazy">'
      : '<div class="univ-ad-card__image univ-ad-skeleton" style="height:160px;"></div>';

    var logoHtml = ad.university_logo
      ? '<img class="univ-ad-card__university-logo" src="' + ad.university_logo + '" alt="">'
      : '';

    a.innerHTML =
      imgHtml +
      '<div class="univ-ad-card__body">' +
        '<div class="univ-ad-card__university">' +
          logoHtml +
          '<span class="univ-ad-card__university-name">' + ad.university_name + '</span>' +
        '</div>' +
        '<p class="univ-ad-card__title">' + ad.title + '</p>' +
        (ad.description ? '<p class="univ-ad-card__desc">' + ad.description + '</p>' : '') +
        '<span class="univ-ad-card__badge">إعلان مموّل</span>' +
      '</div>';

    a.addEventListener('click', function (e) {
      e.preventDefault();
      postJSON(API_BASE + '/ads/' + ad.id + '/click/');
      window.open(ad.link_url, '_blank', 'noopener,noreferrer');
    });

    return a;
  }

  function buildSidebarItem(ad) {
    var a = document.createElement('a');
    a.className = 'univ-ad-sidebar-item';
    a.href = '#';
    a.setAttribute('data-ad-id', ad.id);
    a.setAttribute('aria-label', ad.title);

    var imgHtml = ad.image_url
      ? '<img class="univ-ad-sidebar-item__image" src="' + ad.image_url + '" alt="" loading="lazy">'
      : '<div class="univ-ad-sidebar-item__image univ-ad-skeleton"></div>';

    a.innerHTML =
      imgHtml +
      '<div class="univ-ad-sidebar-item__info">' +
        '<p class="univ-ad-sidebar-item__title">' + ad.title + '</p>' +
        '<span class="univ-ad-sidebar-item__university">' + ad.university_name + '</span>' +
      '</div>';

    a.addEventListener('click', function (e) {
      e.preventDefault();
      postJSON(API_BASE + '/ads/' + ad.id + '/click/');
      window.open(ad.link_url, '_blank', 'noopener,noreferrer');
    });

    return a;
  }

  function trackImpression(adId) {
    postJSON(API_BASE + '/ads/' + adId + '/impression/');
  }

  function loadAds(container, placement, isSidebar) {
    fetch(API_BASE + '/ads/?placement=' + encodeURIComponent(placement))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.ads || !data.ads.length) return;
        data.ads.forEach(function (ad) {
          var el = isSidebar ? buildSidebarItem(ad) : buildBannerCard(ad);
          container.appendChild(el);
          trackImpression(ad.id);
        });
        if (!isSidebar && data.ads.length > 1) {
          var label = document.createElement('p');
          label.className = 'univ-ads-sponsored-label';
          label.textContent = 'إعلانات مموّلة';
          container.parentElement.appendChild(label);
        }
      })
      .catch(function () { /* fail silently */ });
  }

  function init() {
    // Banner containers
    document.querySelectorAll('.univ-ads-banner').forEach(function (banner) {
      var placement = banner.getAttribute('data-placement') || 'dashboard_top';
      var inner = banner.querySelector('[id^="univ-ads-banner-"]');
      if (inner) loadAds(inner, placement, false);
    });

    // Sidebar containers
    document.querySelectorAll('.univ-ads-sidebar').forEach(function (sidebar) {
      var placement = sidebar.getAttribute('data-placement') || 'dashboard_sidebar';
      var list = sidebar.querySelector('[id^="univ-ads-sidebar-"]');
      if (list) loadAds(list, placement, true);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
