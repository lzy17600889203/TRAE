(function () {
  'use strict';

  // ─── Constants ─────────────────────────────────────────────
  var STAFF_SPACING = 12;
  var NOTE_WIDTH = 48;
  var NOTE_X_PAD = 24;
  var DIATONIC_ORDER = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  var SVG_NS = 'http://www.w3.org/2000/svg';

  // ─── State ─────────────────────────────────────────────────
  var state = {
    score: emptyScore(),
    issues: [],
    playbackIndex: -1,
    selectedDuration: 'quarter',
    selectedAlter: '',
    selectedVoice: 0,
    saving: false,
    saveMsg: '',
    playing: false,
    playTimer: null,
    justAddedKey: null,
    lastPlaybackIndex: -1,
    resolutionActive: false,
    presets: [],
    activePreset: ''
  };

  function emptyScore() {
    return {
      id: '',
      title: '未命名乐谱',
      key: { fifths: 0, mode: 'major' },
      time: { beats: 4, beatType: 4 },
      clefs: ['treble', 'bass'],
      roleOrder: [0, 1],
      voices: [
        { name: '高音声部', notes: [] },
        { name: '低音声部', notes: [] }
      ]
    };
  }

  // ─── Helpers ───────────────────────────────────────────────
  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (k === 'class') e.className = attrs[k];
        else if (k === 'html') e.innerHTML = attrs[k];
        else if (k === 'text') e.textContent = attrs[k];
        else if (k === 'value') e.value = attrs[k];
        else if (k === 'checked') e.checked = attrs[k];
        else if (k === 'selected') e.selected = attrs[k];
        else if (k === 'disabled') e.disabled = attrs[k];
        else if (k === 'for') e.setAttribute('for', attrs[k]);
        else if (k === 'type') e.type = attrs[k];
        else if (k === 'min') e.min = attrs[k];
        else if (k === 'max') e.max = attrs[k];
        else if (k === 'style') e.setAttribute('style', attrs[k]);
        else if (k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]);
        else e.setAttribute(k, attrs[k]);
      }
    }
    if (children) {
      if (!Array.isArray(children)) children = [children];
      children.forEach(function (c) {
        if (c == null) return;
        if (typeof c === 'string') e.appendChild(document.createTextNode(c));
        else e.appendChild(c);
      });
    }
    return e;
  }

  function svgEl(tag, attrs) {
    var e = document.createElementNS(SVG_NS, tag);
    if (attrs) {
      for (var k in attrs) {
        if (k === 'class') e.setAttribute('class', attrs[k]);
        else e.setAttribute(k, attrs[k]);
      }
    }
    return e;
  }

  function fetchJSON(url, opts) {
    return fetch(url, opts || {}).then(function (r) { return r.json(); });
  }

  function postJSON(url, body) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (r) { return r.json(); });
  }

  function diatonicIndex(n) {
    return n.octave * 7 + DIATONIC_ORDER.indexOf(n.step);
  }

  function yForNote(n, clef) {
    var topIndex = clef === 'bass'
      ? 3 * 7 + DIATONIC_ORDER.indexOf('A')
      : 5 * 7 + DIATONIC_ORDER.indexOf('F');
    var idx = diatonicIndex(n);
    return (topIndex - idx) * (STAFF_SPACING / 2);
  }

  function alterGlyph(a) {
    switch (a) {
      case '#': return '♯';
      case '##': return '𝄪';
      case 'b': return '♭';
      case 'bb': return '𝄫';
      case 'n': return '♮';
      default: return '';
    }
  }

  function keySignatureText(fifths) {
    if (fifths === 0) return '';
    if (fifths > 0) return '♯'.repeat(fifths);
    return '♭'.repeat(-fifths);
  }

  function maxIndex() {
    return state.score.voices.reduce(function (m, v) {
      return Math.max(m, v.notes.length - 1);
    }, -1);
  }

  function ruleLabel(rule) {
    switch (rule) {
      case 'parallel-perfect': return '平行纯五/八度';
      case 'hidden-perfect': return '隐伏纯五/八度';
      case 'voice-crossing': return '声部交叉';
      case 'augmented-melodic': return '增音程未解决';
      default: return rule;
    }
  }

  // ─── API Calls ─────────────────────────────────────────────
  function analyze() {
    return postJSON('/api/analyze', state.score).then(function (r) {
      state.issues = r.issues || [];
      render();
    });
  }

  function loadPreset(id) {
    state.activePreset = id;
    return fetchJSON('/api/presets/' + id).then(function (s) {
      state.score = s;
      state.issues = [];
      state.playbackIndex = -1;
      analyze();
    });
  }

  function saveScore() {
    state.saving = true;
    state.saveMsg = '';
    render();
    postJSON('/api/scores', state.score).then(function (r) {
      state.saving = false;
      state.saveMsg = '已保存 (id=' + r.id.slice(0, 8) + '...)';
      state.issues = r.issues || [];
      setTimeout(function () { state.saveMsg = ''; render(); }, 3000);
      render();
    }).catch(function () {
      state.saving = false;
      state.saveMsg = '保存失败';
      render();
    });
  }

  // ─── Render: App Shell ─────────────────────────────────────
  function render() {
    var app = document.getElementById('app');
    app.innerHTML = '';

    app.appendChild(renderHeader());
    app.appendChild(renderPresets());

    var workspace = el('div', { class: 'workspace' }, [
      renderStaffEditor(),
      renderSidePanel()
    ]);
    app.appendChild(workspace);
  }

  function renderHeader() {
    return el('header', { class: 'app-header' }, [
      el('h1', { text: '严格对位五线谱编辑器' }),
      el('div', { class: 'score-title' }, [
        el('label', { text: '标题', for: 'title-input' }),
        el('input', {
          id: 'title-input',
          value: state.score.title,
          oninput: function (e) { state.score.title = e.target.value; }
        }),
        el('button', {
          text: '保存',
          disabled: state.saving,
          onclick: saveScore
        }),
        state.saveMsg ? el('span', { class: 'save-msg', text: state.saveMsg }) : null
      ])
    ]);
  }

  function renderPresets() {
    var btns = state.presets.map(function (p) {
      return el('button', {
        text: p.title,
        class: state.activePreset === p.id ? 'active' : '',
        onclick: function () { loadPreset(p.id); }
      });
    });
    return el('div', { class: 'presets' }, [
      el('span', { class: 'label', text: '预设场景：' })
    ].concat(btns));
  }

  // ─── Render: Side Panel ────────────────────────────────────
  function renderSidePanel() {
    return el('aside', { class: 'side-panel' }, [
      renderPlaybackControls(),
      renderIssuesPanel(),
      renderEditorActions()
    ]);
  }

  function renderPlaybackControls() {
    var mi = maxIndex();
    return el('section', { class: 'panel' }, [
      el('header', {}, [el('h3', { text: '播放控制' })]),
      el('div', { class: 'controls' }, [
        el('button', {
          text: state.playing ? '⏸ 暂停' : '▶ 播放',
          onclick: togglePlay
        }),
        el('button', { text: '◀', onclick: function () { seek(-1); } }),
        el('button', { text: '▶', onclick: function () { seek(1); } }),
        el('button', { text: '■ 重置', onclick: resetPlayback })
      ]),
      el('div', { class: 'slider' }, [
        el('input', {
          type: 'range',
          min: '-1',
          max: String(mi),
          value: String(state.playbackIndex),
          oninput: function (e) {
            state.playbackIndex = parseInt(e.target.value, 10);
            render();
          }
        }),
        el('span', {
          class: 'idx',
          text: (state.playbackIndex < 0 ? '-' : state.playbackIndex + 1) + ' / ' + (mi + 1)
        })
      ])
    ]);
  }

  function renderIssuesPanel() {
    var errorCount = state.issues.filter(function (i) { return i.severity === 'error'; }).length;
    var items = state.issues.map(function (iss) {
      return el('li', { class: 'issue-item ' + iss.severity }, [
        el('div', { class: 'issue-title' }, [
          el('span', { class: 'issue-badge', text: iss.severity === 'error' ? '错误' : '警告' }),
          el('span', { class: 'issue-rule', text: ruleLabel(iss.rule) })
        ]),
        el('p', { class: 'issue-msg', text: iss.message }),
        iss.suggestions && iss.suggestions.length
          ? el('ul', { class: 'issue-sugg' },
              iss.suggestions.map(function (s) { return el('li', { text: s }); })
            )
          : null,
        el('button', {
          class: 'issue-goto',
          text: '定位',
          onclick: function () {
            if (iss.positions && iss.positions.length) {
              state.playbackIndex = iss.positions[0].index;
              render();
            }
          }
        })
      ]);
    });

    var listContent = items.length
      ? items
      : [el('li', { class: 'empty', text: '暂无违规。继续创作吧。' })];

    return el('section', { class: 'panel' }, [
      el('header', {}, [
        el('h3', { text: '规则引擎报告' }),
        el('span', {
          class: 'count' + (errorCount > 0 ? ' has-errors' : ''),
          text: state.issues.length + ' 条'
        })
      ]),
      el('ul', { class: 'issue-list' }, listContent)
    ]);
  }

  function renderEditorActions() {
    return el('section', { class: 'editor-actions' }, [
      el('h3', { text: '手动编辑' }),
      el('p', { text: '在五线谱上点击对应位置即可添加音符，点击已有音符可删除。' }),
      el('button', {
        class: 'primary',
        text: '运行规则引擎',
        onclick: analyze
      })
    ]);
  }

  // ─── Render: Staff Editor ──────────────────────────────────
  function renderStaffEditor() {
    var toolbar = el('div', { class: 'toolbar' }, [
      el('label', { text: '时值' }),
      buildSelect(['whole', 'half', 'quarter', 'eighth', '16th'],
        ['全音符', '二分', '四分', '八分', '十六分'],
        state.selectedDuration,
        function (v) { state.selectedDuration = v; }),
      el('label', { text: '升降' }),
      buildSelect(['', '#', 'b', 'n'],
        ['自然', '升', '降', '还原'],
        state.selectedAlter,
        function (v) { state.selectedAlter = v; }),
      el('label', { text: '声部' }),
      buildVoiceSelect(),
      el('span', { class: 'hint', text: '点击五线谱加音，点击音符删除' })
    ]);

    var scoreArea = el('div', { class: 'score-area' });
    var svg = buildStaffSVG();
    scoreArea.appendChild(svg);

    var clickLayer = el('div', { class: 'click-layer' });
    clickLayer.addEventListener('click', onAddClick);
    scoreArea.appendChild(clickLayer);

    var glow = el('div', {
      class: 'resolution-glow' + (state.resolutionActive ? ' active' : '')
    });

    return el('div', { class: 'staff-editor' }, [toolbar, scoreArea, glow]);
  }

  function buildSelect(values, labels, selected, onChange) {
    var sel = el('select', {
      onchange: function (e) { onChange(e.target.value); }
    });
    values.forEach(function (v, i) {
      var opt = el('option', { value: v, text: labels[i] });
      if (v === selected) opt.selected = true;
      sel.appendChild(opt);
    });
    return sel;
  }

  function buildVoiceSelect() {
    var sel = el('select', {
      onchange: function (e) { state.selectedVoice = parseInt(e.target.value, 10); }
    });
    state.score.voices.forEach(function (v, i) {
      var opt = el('option', { value: String(i), text: v.name });
      if (i === state.selectedVoice) opt.selected = true;
      sel.appendChild(opt);
    });
    return sel;
  }

  function buildStaffSVG() {
    var width = 1200;
    var height = 420;
    var svg = svgEl('svg', {
      viewBox: '0 0 ' + width + ' ' + height,
      class: 'staff-svg',
      preserveAspectRatio: 'xMinYMin meet',
      width: '100%',
      height: '420'
    });
    svg.appendChild(svgEl('rect', { x: 0, y: 0, width: width, height: height, fill: '#ffffff' }));

    var systems = buildSystems(width);
    systems.forEach(function (s) {
      // Staff lines
      s.lines.forEach(function (line) {
        svg.appendChild(svgEl('line', {
          x1: line.x1, y1: line.y, x2: line.x2, y2: line.y,
          stroke: '#111', 'stroke-width': 1
        }));
      });
      // Clef
      var clefText = svgEl('text', {
        x: s.clefX, y: s.clefY, 'font-size': 46, 'font-family': 'serif'
      });
      clefText.textContent = s.clef === 'bass' ? '𝄢' : '𝄞';
      svg.appendChild(clefText);
      // Key sig
      var keyText = svgEl('text', {
        x: s.keyX, y: s.keyY, 'font-size': 24, 'font-family': 'serif'
      });
      keyText.textContent = keySignatureText(state.score.key.fifths);
      svg.appendChild(keyText);
      // Time sig
      var timeText = svgEl('text', {
        x: s.timeX, y: s.timeY, 'font-size': 22, 'font-family': 'serif'
      });
      timeText.textContent = state.score.time.beats + '/' + state.score.time.beatType;
      svg.appendChild(timeText);
      // Bar lines
      s.bars.forEach(function (bx) {
        svg.appendChild(svgEl('line', {
          x1: bx, y1: s.topY, x2: bx, y2: s.bottomY,
          stroke: '#111', 'stroke-width': 1
        }));
      });
    });

    // Build note views
    var noteData = buildNoteViews(systems);

    // Ties
    noteData.ties.forEach(function (t) {
      svg.appendChild(svgEl('path', { d: t.path, class: 'tie-path' }));
    });

    // Notes
    noteData.views.forEach(function (nv) {
      // Ledger lines
      nv.ledgerLines.forEach(function (ly) {
        svg.appendChild(svgEl('line', {
          x1: nv.x - 9, y1: ly, x2: nv.x + 9, y2: ly,
          stroke: '#111', 'stroke-width': 1
        }));
      });

      // Alter
      if (nv.note.alter) {
        var alterText = svgEl('text', {
          x: nv.x - 18, y: nv.y + 5,
          'font-size': 20, 'font-family': 'serif',
          class: nv.alterWrong ? 'alter-wrong' : ''
        });
        alterText.textContent = alterGlyph(nv.note.alter);
        svg.appendChild(alterText);
      }

      // Note head
      var headClasses = ['note-head'];
      if (nv.note.duration === 'whole') headClasses.push('note-head-whole');
      if (nv.errored) headClasses.push('errored-note');
      else if (nv.warned) headClasses.push('warned-note');
      if (nv.justAdded) headClasses.push('just-added');
      if (nv.playback) headClasses.push('playback-note');

      var ellipse = svgEl('ellipse', {
        cx: nv.x, cy: nv.y, rx: 7, ry: 5,
        class: headClasses.join(' '),
        transform: 'rotate(-20, ' + nv.x + ', ' + nv.y + ')'
      });
      ellipse.addEventListener('click', function (e) {
        e.stopPropagation();
        onNoteClick(nv);
      });
      svg.appendChild(ellipse);

      // Stem
      if (nv.note.duration !== 'whole') {
        svg.appendChild(svgEl('line', {
          x1: nv.x + 6, y1: nv.y,
          x2: nv.x + 6, y2: nv.stemY,
          stroke: '#111', 'stroke-width': 1.5
        }));
      }
    });

    // Playback cursor
    if (state.playbackIndex >= 0 && noteData.cursors.length) {
      var sysT = systems[0].topY;
      var sysB = systems[systems.length - 1].bottomY;
      svg.appendChild(svgEl('line', {
        x1: noteData.cursors[0], y1: sysT,
        x2: noteData.cursors[0], y2: sysB,
        stroke: '#2563eb', 'stroke-width': 2,
        class: 'playback-cursor'
      }));
    }

    return svg;
  }

  function buildSystems(width) {
    var voices = state.score.voices || [];
    var maxLen = voices.reduce(function (m, v) { return Math.max(m, v.notes.length); }, 0);
    var sysCount = Math.max(1, Math.ceil(maxLen / 12));
    var notesPerSys = Math.max(8, Math.ceil(maxLen / sysCount));
    var systemHeight = 280;
    var systems = [];

    for (var s = 0; s < sysCount; s++) {
      var topY = 40 + s * systemHeight;
      systems.push({
        id: s,
        topY: topY,
        bottomY: topY + systemHeight - 60,
        clef: state.score.clefs[0] || 'treble',
        clefX: 40, clefY: topY + 55,
        keyX: 88, keyY: topY + 48,
        timeX: 130, timeY: topY + 48,
        lines: buildStaffLines(topY, width),
        bars: buildBars(topY, notesPerSys),
        startNoteIdx: s * notesPerSys,
        endNoteIdx: Math.min(maxLen, (s + 1) * notesPerSys) - 1,
        startX: 170,
        endX: width - 40,
        notesPerSys: notesPerSys
      });
    }
    return systems;
  }

  function buildStaffLines(topY, width) {
    var lines = [];
    for (var i = 0; i < 5; i++) {
      lines.push({ x1: 40, x2: width - 20, y: topY + i * STAFF_SPACING });
    }
    return lines;
  }

  function buildBars(topY, notesPerSys) {
    var bars = [];
    var startX = 170;
    for (var i = 1; i <= Math.floor(notesPerSys / 4); i++) {
      bars.push(startX + i * 4 * NOTE_WIDTH);
    }
    bars.push(1200 - 20);
    return bars;
  }

  function buildNoteViews(systems) {
    var errorSet = {};
    var warnSet = {};
    (state.issues || []).forEach(function (iss) {
      iss.positions.forEach(function (p) {
        var key = p.voice + '-' + p.index;
        if (iss.severity === 'error') errorSet[key] = true;
        else warnSet[key] = true;
      });
    });

    var views = [];
    var ties = [];
    var cursors = [];
    var voices = state.score.voices || [];

    voices.forEach(function (v, vi) {
      var prevNoteView = null;
      v.notes.forEach(function (n, i) {
        if (!n) return;
        var sys = null;
        for (var s = 0; s < systems.length; s++) {
          if (i >= systems[s].startNoteIdx && i <= systems[s].endNoteIdx) {
            sys = systems[s];
            break;
          }
        }
        if (!sys) return;

        var localIdx = i - sys.startNoteIdx;
        var x = sys.startX + localIdx * NOTE_WIDTH + NOTE_X_PAD;
        var y = sys.topY + 30 + yForNote(n, sys.clef);
        var key = vi + '-' + i;
        var stemDir = y < sys.topY + 40 ? 1 : -1;
        var stemY = y + stemDir * 34;

        var nv = {
          x: x, y: y, note: n, index: i, voice: vi,
          errored: !!errorSet[key],
          warned: !!warnSet[key],
          justAdded: state.justAddedKey === key,
          playback: state.playbackIndex === i,
          ledgerLines: ledgerLinesFor(y, sys.topY + 30),
          stemY: stemY,
          alterWrong: isAlterDisplayWrong(n, i)
        };
        views.push(nv);

        // Tie from previous
        if (prevNoteView && Math.abs(x - prevNoteView.x) < 400) {
          var midY = (prevNoteView.y + y) / 2 - 10;
          ties.push({
            path: 'M ' + (prevNoteView.x + 6) + ' ' + prevNoteView.y +
                  ' Q ' + ((prevNoteView.x + x) / 2) + ' ' + (midY - 12) +
                  ' ' + (x - 6) + ' ' + y
          });
        }
        prevNoteView = nv;
      });
    });

    // Playback cursor positions
    if (state.playbackIndex >= 0) {
      systems.forEach(function (s) {
        if (state.playbackIndex >= s.startNoteIdx && state.playbackIndex <= s.endNoteIdx) {
          cursors.push(s.startX + (state.playbackIndex - s.startNoteIdx) * NOTE_WIDTH + NOTE_X_PAD);
        }
      });
    }

    return { views: views, ties: ties, cursors: cursors };
  }

  function ledgerLinesFor(y, topLineY) {
    var lines = [];
    var check = topLineY - STAFF_SPACING;
    while (y < check + 2) {
      if (Math.abs(y - check) < 3) lines.push(check);
      check -= STAFF_SPACING;
      if (check < topLineY - 200) break;
    }
    var bottom = topLineY + 4 * STAFF_SPACING;
    check = bottom + STAFF_SPACING;
    while (y > check - 2) {
      if (Math.abs(y - check) < 3) lines.push(check);
      check += STAFF_SPACING;
      if (check > bottom + 200) break;
    }
    return lines;
  }

  function isAlterDisplayWrong(n, i) {
    if (!n.alter) return false;
    var kc = state.score.keyChangeAt;
    if (kc && i >= kc.index) return true;
    var fifths = state.score.key.fifths;
    var sharps = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
    var flats = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];
    if (n.alter === '#' && fifths > 0 && sharps.slice(0, fifths).indexOf(n.step) >= 0) return true;
    if (n.alter === 'b' && fifths < 0 && flats.slice(0, -fifths).indexOf(n.step) >= 0) return true;
    return false;
  }

  // ─── Event Handlers ────────────────────────────────────────
  function onNoteClick(nv) {
    var v = state.score.voices[nv.voice];
    v.notes.splice(nv.index, 1);
    analyze();
  }

  function onAddClick(event) {
    var hostEl = event.currentTarget.parentElement;
    var svg = hostEl.querySelector('svg');
    if (!svg) return;
    var rect = svg.getBoundingClientRect();
    var vb = svg.viewBox.baseVal;
    var x = ((event.clientX - rect.left) / rect.width) * vb.width + vb.x;
    var y = ((event.clientY - rect.top) / rect.height) * vb.height + vb.y;

    var systems = buildSystems(1200);
    var sys = null;
    for (var s = 0; s < systems.length; s++) {
      if (y >= systems[s].topY && y <= systems[s].bottomY + 30) {
        sys = systems[s];
        break;
      }
    }
    if (!sys) return;

    var localIdx = Math.max(0, Math.floor((x - sys.startX - NOTE_X_PAD + NOTE_WIDTH / 2) / NOTE_WIDTH));
    var voice = state.selectedVoice;
    var clef = state.score.clefs[voice] || sys.clef;

    var topIndex = clef === 'bass'
      ? 3 * 7 + DIATONIC_ORDER.indexOf('A')
      : 5 * 7 + DIATONIC_ORDER.indexOf('F');
    var idx = topIndex - Math.round((y - (sys.topY + 30)) / (STAFF_SPACING / 2));
    var octave = Math.floor(idx / 7);
    var step = DIATONIC_ORDER[((idx % 7) + 7) % 7];

    var note = {
      step: step,
      octave: octave,
      alter: state.selectedAlter,
      duration: state.selectedDuration
    };

    var v = state.score.voices[voice];
    while (v.notes.length <= localIdx) v.notes.push(null);
    v.notes[localIdx] = note;

    state.justAddedKey = voice + '-' + localIdx;
    var justKey = state.justAddedKey;
    analyze();
    setTimeout(function () {
      if (state.justAddedKey === justKey) {
        state.justAddedKey = null;
        render();
      }
    }, 600);
  }

  // ─── Playback ──────────────────────────────────────────────
  function togglePlay() {
    state.playing = !state.playing;
    if (state.playing) {
      if (state.playbackIndex < 0) state.playbackIndex = 0;
      state.playTimer = setInterval(function () {
        if (state.playbackIndex >= maxIndex()) {
          clearInterval(state.playTimer);
          state.playing = false;
          render();
          return;
        }
        var oldIdx = state.playbackIndex;
        state.playbackIndex++;
        if (state.playbackIndex > oldIdx) {
          state.resolutionActive = true;
          render();
          setTimeout(function () {
            state.resolutionActive = false;
            render();
          }, 900);
        } else {
          render();
        }
      }, 450);
    } else {
      clearInterval(state.playTimer);
    }
    render();
  }

  function seek(delta) {
    var mi = maxIndex();
    var next = Math.min(Math.max(-1, state.playbackIndex + delta), mi);
    if (next > state.playbackIndex && next !== state.playbackIndex) {
      state.resolutionActive = true;
      setTimeout(function () { state.resolutionActive = false; render(); }, 900);
    }
    state.playbackIndex = next;
    state.lastPlaybackIndex = next;
    render();
  }

  function resetPlayback() {
    state.playing = false;
    clearInterval(state.playTimer);
    state.playbackIndex = -1;
    state.lastPlaybackIndex = -1;
    render();
  }

  // ─── Init ──────────────────────────────────────────────────
  function init() {
    fetchJSON('/api/presets').then(function (r) {
      state.presets = r.presets || [];
      render();
    });
    state.score = emptyScore();
    render();
  }

  init();
})();
