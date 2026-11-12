/*
 * TEST HARNESS — sets a fixed set of first-party cookies so a CookieYes scan finds them.
 * Used to reproduce the CPG audit-table language behaviour (Romanian banner, English policy).
 * Set unconditionally, without waiting for consent, on purpose: the scanner must see them.
 * Remove when the test is done.
 *
 * Known names (expected to match the CookieYes cookie dictionary):
 *   _fbp, _hjSessionUser_<id>, _clck
 * Custom names (unknown to the dictionary, so they behave like hand-added cookies):
 *   pulse_session, pulse_ui_theme, pulse_ab_bucket
 */
(function () {
  var DAY = 24 * 60 * 60;

  function set(name, value, maxAgeSeconds) {
    var cookie = name + '=' + encodeURIComponent(value) + '; path=/; SameSite=Lax';
    if (maxAgeSeconds) cookie += '; max-age=' + maxAgeSeconds;
    if (location.protocol === 'https:') cookie += '; Secure';
    document.cookie = cookie;
  }

  function rand() {
    return Math.floor(Math.random() * 1e10).toString();
  }

  var now = Date.now();

  // Advertisement — Meta Pixel browser id
  set('_fbp', 'fb.1.' + now + '.' + rand(), 90 * DAY);
  // Analytics — Hotjar returning-visitor id
  set('_hjSessionUser_3712345', JSON.stringify({ id: rand(), created: now, existing: true }), 365 * DAY);
  // Analytics — Microsoft Clarity user id
  set('_clck', rand() + '|2|f0|0|1', 365 * DAY);

  // Custom, unknown to the dictionary
  set('pulse_session', rand());                      // session cookie (no max-age)
  set('pulse_ui_theme', 'light', 30 * DAY);
  set('pulse_ab_bucket', Math.random() < 0.5 ? 'a' : 'b', 7 * DAY);
})();
