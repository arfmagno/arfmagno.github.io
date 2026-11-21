// Portfolio interactions. Plain JavaScript, no dependencies.
(function () {
  'use strict'
  var root = document.documentElement
  root.classList.add('js')
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  var $ = function (s, el) { return (el || document).querySelector(s) }
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)) }
  var esc = function (s) { return String(s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] }) }
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, reduce ? 0 : ms) }) }

  // ---- theme, email, year ----
  try { var saved = localStorage.getItem('theme'); if (saved) root.setAttribute('data-theme', saved) } catch (e) {}
  $('.theme').addEventListener('click', function () {
    var cur = root.getAttribute('data-theme')
    var dark = cur ? cur === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches
    var next = dark ? 'light' : 'dark'
    root.setAttribute('data-theme', next)
    try { localStorage.setItem('theme', next) } catch (e) {}
  })
  $('#mail').href = 'mailto:' + ['arfmagno', 'gmail.com'].join('@')   // assembled here so simple scrapers miss it
  $('#year').textContent = new Date().getFullYear()

  // ---- scroll progress and active nav link ----
  var bar = $('.progress'), links = $$('.nav nav a')
  function onScroll () {
    var h = document.documentElement
    bar.style.width = (h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight) * 100) + '%'
    var current = ''
    links.forEach(function (a) { var s = $(a.getAttribute('href')); if (s && s.getBoundingClientRect().top < 140) current = a.getAttribute('href') })
    links.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === current) })
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll()

  // ---- reveal on scroll ----
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } })
    }, { rootMargin: '0px 0px -8% 0px' })
    $$('.reveal').forEach(function (el) { io.observe(el) })
  } else $$('.reveal').forEach(function (el) { el.classList.add('in') })

  // ---- hero terminal ----
  var lines = [
    ['<span class="p">$</span> curl -X POST api.example.com/translate -d \'{"text":"Ocean view","to":"fr"}\'', 0],
    ['<span class="c"># provider A timed out, provider B answered</span>', 1],
    ['{', 1],
    ['  <span class="k">"text"</span>: <span class="s">"Vue sur l\'océan"</span>,', 1],
    ['  <span class="k">"to"</span>: <span class="s">"fr"</span>,', 1],
    ['  <span class="k">"fallbackUsed"</span>: <span class="n">true</span>,', 1],
    ['  <span class="k">"ms"</span>: <span class="n">412</span>', 1],
    ['}', 1],
    ['<span class="c"># same response shape, whichever provider answers</span>', 1],
    ['<span class="p">$</span> <span class="caret"></span>', 1]
  ]
  var term = $('#term')
  if (reduce) term.innerHTML = lines.map(function (l) { return l[0] }).join('\n')
  else {
    (async function () {
      var out = ''
      var first = lines[0][0].replace(/<[^>]+>/g, '')
      for (var i = 0; i <= first.length; i++) { term.innerHTML = '<span class="p">$</span>' + esc(first.slice(1, i)) + '<span class="caret"></span>'; await sleep(28) }
      out = lines[0][0]
      for (var j = 1; j < lines.length; j++) { await sleep(130); out += '\n' + lines[j][0]; term.innerHTML = out }
    })()
  }

  // ---- counters ----
  $$('[data-count]').forEach(function (el) {
    if (reduce) return
    var to = +el.dataset.count, pre = el.dataset.prefix || '', t0
    var obs = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return
      obs.disconnect()
      function step (t) { t0 = t0 || t; var k = Math.min(1, (t - t0) / 900); el.textContent = pre + Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step) }
      requestAnimationFrame(step)
    })
    obs.observe(el)
  })

  // ---- screenshot galleries ----
  $$('[data-gallery]').forEach(function (g) {
    var imgs = $$('.shots img', g), tabs = $$('.thumbs button', g), i = 0, timer
    function show (n) {
      i = n
      imgs.forEach(function (im, k) { im.classList.toggle('on', k === n) })
      tabs.forEach(function (b, k) { b.setAttribute('aria-selected', String(k === n)) })
    }
    tabs.forEach(function (b, k) { b.addEventListener('click', function () { clearInterval(timer); show(k) }) })
    if (!reduce) timer = setInterval(function () { show((i + 1) % imgs.length) }, 4500)
  })

  // ---- project filters ----
  $$('.filters:not(.mini) button').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('.filters:not(.mini) button').forEach(function (x) { x.classList.toggle('on', x === b) })
      var f = b.dataset.filter
      $$('#project-cards .card').forEach(function (c) { c.classList.toggle('hide', f !== 'all' && c.dataset.tags.split(' ').indexOf(f) < 0) })
    })
  })

  // ---- Hiyas demo in a phone frame ----
  // The demo's on-device database needs a cross-origin isolated page, which the
  // service worker (sw.js) provides. The first click may reload the page once.
  var pm = $('#phone-modal'), pf = $('#pm-frame'), DEMO = 'https://arfmagno.github.io/jewelry-mgt-mobile-app/'
  var canFrame = 'serviceWorker' in navigator && !!pm.showModal && location.protocol === 'https:'
  if (canFrame) navigator.serviceWorker.register('sw.js').catch(function () { canFrame = false })
  function openPhone () {
    if (!pf.src) pf.src = DEMO
    pm.showModal()
  }
  $$('a[data-phone]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (window.innerWidth < 700 || !canFrame) return   // on a phone (or without support), open the app full screen
      e.preventDefault()
      if (window.crossOriginIsolated) return openPhone()
      navigator.serviceWorker.ready.then(function () {
        try { sessionStorage.setItem('openPhone', '1') } catch (err) {}
        location.reload()
      })
    })
  })
  try { if (sessionStorage.getItem('openPhone')) { sessionStorage.removeItem('openPhone'); if (window.crossOriginIsolated) openPhone(); else window.open(DEMO, '_blank', 'noopener') } } catch (err) {}
  $('#pm-close').addEventListener('click', function () { pm.close() })
  pm.addEventListener('click', function (e) { if (e.target === pm) pm.close() })

  // ---- enforcement ladder ----
  var rungs = [
    ['<b>Remove the capability.</b> The agent is never given the tool, credential or network. Nothing to misuse: an absence, not a rule.', 'Reviewers, the observer and the evaluator get no Write or Edit tool at all. Every agent has an explicit tool allowlist, and a checker proves each list fits its role.'],
    ['<b>A precondition outside the agent.</b> The next step is refused until an external check has passed. The agent cannot skip a gate it does not control.', 'The builder is refused until the contract tests exist and the gate passed. Hard call limits per role stop a runaway agent.'],
    ['<b>Validate at write time.</b> A write that breaks a rule is rejected, however it was produced.', 'The tester may only write test files and the builder only application code, decided by the file path on every write. A PR comment is refused unless it passes a relevance gate.'],
    ['<b>Detect afterwards and force a redo.</b> An independent sensor reads the harness\'s own record and sends the work back.', 'The observer replays every tool call from the transcripts and HALTs on scope creep, workarounds or stale evidence. A report without tested counter-arguments is re-run.'],
    ['<b>Ask in a prompt.</b> "Please do not…" is documentation of intent. Useful, never a control.', 'Only low-risk preferences stay here (plain language, read the manifest first), and they are labelled as prompt-only in the audit.']
  ]
  var rung = $('#rung')
  function showRung (k) {
    $$('.ladder button').forEach(function (b, i) { b.setAttribute('aria-selected', String(i === k)) })
    rung.innerHTML = '<p>' + rungs[k][0] + '</p><p class="eg">In the squad: ' + rungs[k][1] + '</p>'
  }
  $$('.ladder button').forEach(function (b, i) { b.addEventListener('click', function () { showRung(i) }) })
  showRung(0)

  // ---- roster ----
  var roster = [
    ['Scout', 'haiku', 'Finds the repos, files and past work'],
    ['Investigator', 'sonnet', 'Fetches the ticket and checks every claim against the code'],
    ['Architect', 'opus', 'Compares designs and runs failure stories, only when hard'],
    ['Challenger', 'opus', 'Steelmans, then attacks claims with evidence'],
    ['Tester', 'sonnet', 'Failing contract tests first, then mutation checks'],
    ['Builder', 'sonnet', 'Smallest change that makes the tests pass'],
    ['Verifier', 'sonnet', 'Re-runs everything itself, with a negative control'],
    ['Reviewer', 'sonnet', 'Fresh, read-only review; stronger model on risky diffs'],
    ['Security reviewer', 'opus', 'Authorization, secrets, schema and one-way doors'],
    ['Evaluator', 'opus', 'Audits evidence per criterion: PASS, FAIL or ESCALATE'],
    ['Observer', 'sonnet', 'Judges scope creep and claims against actions'],
    ['Triager', 'sonnet', 'Decides every PR comment: fix, reject, defer, answer'],
    ['CI watcher', 'haiku', 'Tracks the build and classifies failures'],
    ['Metrics', 'sonnet', 'Efficiency judgement and improvement proposals'],
    ['Scribe', 'haiku', 'Summaries and records. No new facts'],
    ['Curator', 'sonnet', 'Grows the knowledge base']
  ]
  var tierName = { haiku: 'fast', sonnet: 'mid', opus: 'strongest' }
  $('#roster').innerHTML = roster.map(function (r) { return '<li data-tier="' + r[1] + '"><span class="tier ' + r[1] + '">' + tierName[r[1]] + '</span><b>' + r[0] + '</b><span>' + r[2] + '</span></li>' }).join('')
  $$('.filters.mini button').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('.filters.mini button').forEach(function (x) { x.classList.toggle('on', x === b) })
      $$('#roster li').forEach(function (li) { li.classList.toggle('dim', b.dataset.tier !== 'all' && li.dataset.tier !== b.dataset.tier) })
    })
  })

  // ---- pipeline simulator ----
  var steps = $$('#pipe li').map(function (li) { return li.dataset.step })
  var notes = {
    scout: 'scout: found 2 repos and 3 related files  <span class="m">(fast tier)</span>',
    investigator: 'investigator: 4 acceptance criteria, each claim checked against the code',
    challenge1: 'challenger: 3 counter-arguments with evidence, all answered on evidence',
    G1: '<span class="g">G1 passed</span>: investigation, decisions and a ruled challenge exist',
    tester: 'tester: 6 contract tests written first, all failing (no code yet)',
    builder: 'builder: smallest change, 6/6 tests pass',
    verifier: 'verifier: re-ran typecheck, lint and tests itself; logs newer than the last change',
    G2: '<span class="g">G2 passed</span>: negative control OK, new tests fail on the base commit',
    reviewers: 'reviewers: two fresh passes, findings fixed and re-verified',
    G3: '<span class="g">G3 passed</span>: mutations run 8, caught 8; reviews after the last change',
    evaluator: 'evaluator: every criterion has evidence, VERDICT: PASS (then the challenger attacks the PASS)',
    observer: 'observer: replayed every tool call from the transcripts, FLOW: CONTINUE',
    G4: '<span class="g">G4 passed</span>: verdict fresh, security review not needed',
    pr: 'orchestrator: pushed the ticket branch, opened a DRAFT PR; CI green, 2 bot comments handled',
    G5: '<span class="g">G5 passed</span>: every comment decided and replied to, PR still a draft',
    human: '<span class="b">you are notified: review the PR last</span>'
  }
  var scenarios = {
    happy: {},
    'test-edit': { at: 'builder', kind: 'stop', msg: '<span class="r">TENANCY DENIED</span>: builder may write application code only; "quote.spec.ts" is a test file <span class="m">(rung 3: validated at write time)</span>\nbuilder reports NEEDS_DECISION instead of bending the test' },
    'reviewer-write': { at: 'reviewers', kind: 'stop', msg: '<span class="r">no Edit tool</span>: the reviewer was never given one, so there is nothing to bypass <span class="m">(rung 1: capability removed)</span>\nreviewer reports the finding; the builder fixes it' },
    'weak-tests': { at: 'G2', kind: 'redo', msg: '<span class="y">G2 BLOCKED</span>: the new tests also pass on the base commit, so they prove nothing <span class="m">(negative control)</span>\n→ back to the tester for tests that fail without the change', back: 'tester' },
    challenge: { at: 'challenge1', kind: 'redo', msg: '<span class="y">challenger UPHELD</span>: "the cache is per-process" (cites cache.ts:42); the design assumed it was shared\n→ investigation revised, challenge round 2 resolved on evidence', back: 'investigator' },
    push: { at: 'pr', kind: 'stop', msg: '<span class="r">observer HALT</span>: unauthorized-outward: push to main (only the ticket branch is allowed)\n<span class="m">detected from the harness transcript (rung 4)</span>; flow stops for a human' }
  }
  var running = false, slog = $('#sim-log')
  $('#sim-run').addEventListener('click', async function () {
    if (running) return
    running = true; this.disabled = true
    var sc = scenarios[$('#scenario').value], out = [], redone = false
    var lis = $$('#pipe li')
    lis.forEach(function (li) { li.className = li.className.replace(/\b(run|done|stop|redo)\b/g, '').trim() })
    var say = function (s) { out.push(s); slog.innerHTML = out.join('\n'); slog.scrollTop = slog.scrollHeight }
    for (var i = 0; i < steps.length; i++) {
      var li = lis[i], st = steps[i]
      li.classList.add('run'); await sleep(320)
      li.classList.remove('run')
      if (sc.at === st && !redone) {
        li.classList.add(sc.kind); say(sc.msg)
        if (sc.kind === 'stop') { say('<span class="b">→ decision pack sent to you: one question, everything else already analysed</span>'); break }
        redone = true
        var back = steps.indexOf(sc.back)
        await sleep(700)
        for (var k = back; k <= i; k++) lis[k].classList.remove('done', 'redo')
        i = back - 1
        continue
      }
      li.classList.add('done'); say(notes[st])
    }
    running = false; this.disabled = false
  })
})()
