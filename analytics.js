/* French with Nelliane — analytics (Google Analytics 4)

   HOW TO TURN IT ON
   1. In Google Analytics create a property and a "Web" data stream for
      https://frenchwithnelliane.co.za  -> copy the Measurement ID (looks like G-ABC123DEF4).
   2. Paste it between the quotes below, save, and upload the site again.
   Until an ID is pasted, this file does nothing: no tracking, no cookies, no requests.

   PRIVACY
   - Names, emails and other personal details are never sent to Google.
   - Visitors who send a "Do Not Track" or "Global Privacy Control" signal are not tracked.
   - IP addresses are anonymised (GA4 does not store them).

   EVENTS RECORDED (visible in Google Analytics > Reports > Engagement > Events)
   booking_open, booking_step, generate_lead (a completed booking request),
   add_to_calendar, contact_click (WhatsApp / email / phone links).
*/
(function () {
  'use strict';
  var GA4_ID = '';   // <-- paste your Measurement ID here, e.g. 'G-ABC123DEF4'

  var id = String(window.FWN_GA4 || GA4_ID || '').trim();
  var nav = navigator;
  var optedOut = nav.doNotTrack === '1' || window.doNotTrack === '1' || nav.globalPrivacyControl === true;
  var on = /^G-[A-Z0-9]{4,}$/.test(id) && !optedOut;

  // Safe to call from anywhere; does nothing when analytics is off.
  window.fwnTrack = function (name, params) {
    if (!on || typeof window.gtag !== 'function') return;
    try { window.gtag('event', name, params || {}); } catch (e) {}
  };
  if (!on) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', id, { anonymize_ip: true, allow_google_signals: false, allow_ad_personalization_signals: false });

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
  document.head.appendChild(s);

  // Contact links (WhatsApp, email, phone) — only the kind of link is recorded.
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var h = a.getAttribute('href') || '';
    var kind = /^https:\/\/wa\.me\//.test(h) ? 'whatsapp' : /^mailto:/i.test(h) ? 'email' : /^tel:/i.test(h) ? 'phone' : '';
    if (kind) window.fwnTrack('contact_click', { method: kind });
  }, true);
})();
