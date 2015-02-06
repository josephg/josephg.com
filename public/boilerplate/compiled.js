(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/josephg/src/b/boilerplate/examples/compiled.coffee":[function(require,module,exports){
var Boilerplate, bp, el, grid, isEmpty, loadGrid, playpausebutton, populate, reset, running, save, setRunning, stepbutton, timer, worldLabel, worldList, worldName, _ref;

Boilerplate = require('../lib/boilerplate.coffee');

isEmpty = function(obj) {
  var k;
  for (k in obj) {
    return false;
  }
  return true;
};

el = document.getElementById('bp');

worldLabel = document.getElementById('worldlabel');

playpausebutton = document.getElementById('playpause');

stepbutton = document.getElementById('step');

worldList = document.getElementById('worldlist');

(populate = function() {
  var i, k, m, name, option, r, _i, _ref, _results;
  while (worldList.firstChild) {
    worldList.removeChild(worldList.firstChild);
  }
  r = /^world (.*)$/;
  _results = [];
  for (i = _i = 0, _ref = localStorage.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
    k = localStorage.key(i);
    m = r.exec(k);
    if (!m) {
      continue;
    }
    name = m[1];
    option = document.createElement('option');
    option.value = name;
    _results.push(worldList.appendChild(option));
  }
  return _results;
})();

worldName = null;

loadGrid = function(name) {
  var grid, gridStr;
  worldName = name;
  console.log("loading " + worldName);
  location.hash = "#" + worldName;
  worldLabel.value = worldName;
  populate();
  gridStr = localStorage.getItem("world " + worldName);
  if (gridStr !== '') {
    try {
      grid = JSON.parse(gridStr);
      if (grid) {
        console.log('loaded', worldName);
      }
    } catch (_error) {}
  }
  return grid || {};
};

running = false;

timer = null;

setRunning = function(v) {
  if (running === v) {
    return;
  }
  running = v;
  if (v) {
    timer = setInterval((function(_this) {
      return function() {
        return bp.step();
      };
    })(this), 200);
  } else {
    clearInterval(timer);
  }
  return document.getElementById('panel').className = v ? 'running' : 'stopped';
};

setRunning(true);

grid = loadGrid(((_ref = location.hash) != null ? _ref.slice(1) : void 0) || 'boilerplate');

bp = window.bp = new Boilerplate(el, {
  grid: grid,
  animTime: 200,
  useWebGL: false
});

el.focus();

bp.addKeyListener(window);

bp.draw();

reset = function(grid) {
  bp.setGrid(grid);
  bp.resetView();
  return setRunning(true);
};

bp.onEditFinish = save = function() {
  grid = bp.getGrid();
  if (isEmpty(grid)) {
    return localStorage.removeItem("world " + worldName);
  } else {
    return localStorage.setItem("world " + worldName, JSON.stringify(grid));
  }
};

setInterval(save, 5000);

window.addEventListener('keypress', function(e) {
  switch (e.keyCode) {
    case 32:
      return setRunning(!running);
    case 13:
      return bp.step();
  }
});

worldLabel.onkeydown = function(e) {
  if (e.keyCode === 27) {
    worldLabel.value = worldName;
    return worldLabel.blur();
  }
};

worldLabel.onchange = function(e) {
  return worldLabel.blur();
};

worldLabel.oninput = function(e) {
  return reset(loadGrid(worldLabel.value));
};

worldLabel.onkeydown = function(e) {
  return e.cancelBubble = true;
};

window.onhashchange = function() {
  var hash;
  hash = location.hash;
  if (hash) {
    worldName = hash.slice(1);
  }
  return reset(loadGrid(worldName));
};

window.onresize = function() {
  console.log('resize');
  return bp.resizeTo(window.innerWidth, window.innerHeight);
};

playpausebutton.onclick = function(e) {
  return setRunning(!running);
};

stepbutton.onclick = function(e) {
  return bp.step();
};

(function() {
  var panel, selected;
  panel = document.getElementsByClassName('toolpanel')[0];
  selected = null;
  panel.onclick = function(e) {
    var element;
    element = e.target;
    if (element === panel) {
      return;
    }
    return bp.changeTool(element.id);
  };
  bp.onToolChanged = function(newTool) {
    var e;
    if (selected) {
      selected.className = '';
    }
    e = document.getElementById(newTool || 'solid');
    if (!e) {
      return;
    }
    e.className = 'selected';
    return selected = e;
  };
  return bp.onToolChanged(bp.activeTool);
})();



},{"../lib/boilerplate.coffee":"/Users/josephg/src/b/boilerplate/lib/boilerplate.coffee"}],"/Users/josephg/src/b/boilerplate/lib/boilerplate.coffee":[function(require,module,exports){
var Boilerplate, KEY, WebGLContext, compile, compiler, lerp, moveShuttle, parseXY, _ref,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

compiler = require('boilerplate-compiler');

_ref = compiler.util, parseXY = _ref.parseXY, moveShuttle = _ref.moveShuttle;

WebGLContext = require('./gl').WebGLContext;

KEY = {
  up: 1,
  right: 2,
  down: 4,
  left: 8
};

compile = function(grid) {
  var ast, buffer, code, end, f, module, start, stream;
  buffer = [];
  stream = {
    write: function(str) {
      return buffer.push(str);
    },
    end: function() {}
  };
  start = Date.now();
  ast = compiler.compileGrid(grid, {
    stream: stream,
    module: 'bare',
    debug: false,
    fillMode: 'all',
    extraFns: true
  });
  code = buffer.join('');
  f = new Function(code);
  module = f();
  end = Date.now();
  console.log("Compiled to " + code.length + " bytes of js in " + (end - start) + " ms");
  module.ast = ast;
  module.grid = grid;
  return module;
};

lerp = function(t, x, y) {
  return (1 - t) * x + t * y;
};

module.exports = Boilerplate = (function() {
  var clamp, enclosingRect, fill, line;

  fill = function(initial_square, f) {
    var hmm, n, ok, to_explore, visited;
    visited = {};
    visited["" + initial_square.x + "," + initial_square.y] = true;
    to_explore = [initial_square];
    hmm = function(x, y) {
      var k;
      k = "" + x + "," + y;
      if (!visited[k]) {
        visited[k] = true;
        return to_explore.push({
          x: x,
          y: y
        });
      }
    };
    while (n = to_explore.shift()) {
      ok = f(n.x, n.y, hmm);
      if (ok) {
        hmm(n.x + 1, n.y);
        hmm(n.x - 1, n.y);
        hmm(n.x, n.y + 1);
        hmm(n.x, n.y - 1);
      }
    }
  };

  Boilerplate.colors = {
    bridge: 'hsl(203, 67%, 51%)',
    negative: 'hsl(16, 68%, 50%)',
    nothing: 'hsl(0, 0%, 100%)',
    positive: 'hsl(120, 52%, 58%)',
    shuttle: 'hsl(283, 65%, 45%)',
    solid: 'hsl(184, 49%, 7%)',
    thinshuttle: 'hsl(283, 89%, 75%)',
    thinsolid: 'hsl(0, 0%, 71%)'
  };

  line = function(x0, y0, x1, y1, f) {
    var dx, dy, e, e1, e2, i, ix, iy, _i, _ref1;
    dx = Math.abs(x1 - x0);
    dy = Math.abs(y1 - y0);
    ix = x0 < x1 ? 1 : -1;
    iy = y0 < y1 ? 1 : -1;
    e = 0;
    for (i = _i = 0, _ref1 = dx + dy; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
      f(x0, y0);
      e1 = e + dy;
      e2 = e - dx;
      if (Math.abs(e1) < Math.abs(e2)) {
        x0 += ix;
        e = e1;
      } else {
        y0 += iy;
        e = e2;
      }
    }
  };

  enclosingRect = function(a, b) {
    return {
      tx: Math.min(a.tx, b.tx),
      ty: Math.min(a.ty, b.ty),
      tw: Math.abs(b.tx - a.tx) + 1,
      th: Math.abs(b.ty - a.ty) + 1
    };
  };

  clamp = function(x, min, max) {
    return Math.max(Math.min(x, max), min);
  };

  Boilerplate.prototype.changeTool = function(newTool) {
    this.activeTool = newTool === 'solid' ? null : newTool;
    if (typeof this.onToolChanged === "function") {
      this.onToolChanged(this.activeTool);
    }
    return this.updateCursor();
  };

  Boilerplate.prototype.addKeyListener = function(el) {
    el.addEventListener('keydown', (function(_this) {
      return function(e) {
        var kc, newTool, _ref1;
        kc = e.keyCode;
        newTool = {
          49: 'nothing',
          50: 'thinsolid',
          51: 'solid',
          52: 'positive',
          53: 'negative',
          54: 'shuttle',
          55: 'thinshuttle',
          56: 'bridge',
          80: 'positive',
          78: 'negative',
          83: 'shuttle',
          65: 'thinshuttle',
          69: 'nothing',
          71: 'thinsolid',
          68: 'solid',
          66: 'bridge'
        }[kc];
        if (newTool) {
          _this.selection = _this.selectOffset = null;
          _this.changeTool(newTool);
        }
        if ((37 <= (_ref1 = e.keyCode) && _ref1 <= 40)) {
          _this.lastKeyScroll = Date.now();
        }
        switch (kc) {
          case 37:
            _this.keysPressed |= KEY.left;
            break;
          case 39:
            _this.keysPressed |= KEY.right;
            break;
          case 38:
            _this.keysPressed |= KEY.up;
            break;
          case 40:
            _this.keysPressed |= KEY.down;
            break;
          case 16:
            _this.imminent_select = true;
            break;
          case 27:
          case 192:
            if (_this.selection) {
              _this.selection = _this.selectOffset = null;
            } else {
              _this.changeTool('move');
            }
            break;
          case 88:
            if (_this.selection) {
              _this.flip('x');
            }
            break;
          case 89:
            if (_this.selection) {
              _this.flip('y');
            }
            break;
          case 77:
            if (_this.selection) {
              _this.mirror();
            }
        }
        return _this.draw();
      };
    })(this));
    el.addEventListener('keyup', (function(_this) {
      return function(e) {
        var _ref1;
        if ((37 <= (_ref1 = e.keyCode) && _ref1 <= 40)) {
          _this.lastKeyScroll = Date.now();
        }
        switch (e.keyCode) {
          case 16:
            _this.imminent_select = false;
            return _this.draw();
          case 37:
            return _this.keysPressed &= ~KEY.left;
          case 39:
            return _this.keysPressed &= ~KEY.right;
          case 38:
            return _this.keysPressed &= ~KEY.up;
          case 40:
            return _this.keysPressed &= ~KEY.down;
        }
      };
    })(this));
    el.addEventListener('blur', (function(_this) {
      return function() {
        _this.mouse.mode = null;
        _this.imminent_select = false;
        return _this.draw();
      };
    })(this));
    el.addEventListener('copy', (function(_this) {
      return function(e) {
        return _this.copy(e);
      };
    })(this));
    return el.addEventListener('paste', (function(_this) {
      return function(e) {
        return _this.paste(e);
      };
    })(this));
  };

  Boilerplate.prototype.screenToWorld = function(px, py) {
    var tx, ty;
    if (px == null) {
      return {
        tx: null,
        ty: null
      };
    }
    px += Math.floor(this.scroll_x * this.size);
    py += Math.floor(this.scroll_y * this.size);
    tx = Math.floor(px / this.size);
    ty = Math.floor(py / this.size);
    return {
      tx: tx,
      ty: ty
    };
  };

  Boilerplate.prototype.worldToScreen = function(tx, ty) {
    if (tx == null) {
      return {
        px: null,
        py: null
      };
    }
    return {
      px: tx * this.size - Math.floor(this.scroll_x * this.size),
      py: ty * this.size - Math.floor(this.scroll_y * this.size)
    };
  };

  Boilerplate.prototype.zoomBy = function(diff) {
    this.zoomLevel += diff;
    this.zoomLevel = clamp(this.zoomLevel, 1 / 20, 5);
    return this.size = Math.floor(20 * this.zoomLevel);
  };


  /*
  get: (tx, ty) ->
    k = "#{tx},#{ty}"
    sid = @compiled.ast.shuttleGrid[k]
    if sid?
      state = @compiled.states[sid]
      shuttle = @compiled.ast.shuttles[sid]
      {dx,dy} = shuttle.states[state]
      return shuttle.points["#{tx-dx},#{ty-dy}"] || 'nothing'
    else
      @compiled.grid[k]
   */

  Boilerplate.prototype.getGrid = function() {
    return this.compiled.grid;
  };

  Boilerplate.prototype.setGrid = function(grid) {
    this.grid = grid;
    this.compile(true);
    return this.draw();
  };

  Boilerplate.prototype.resetView = function(options) {
    this.zoomLevel = 1;
    this.zoomBy(0);
    this.scroll_x = (options != null ? options.initialX : void 0) || 0;
    return this.scroll_y = (options != null ? options.initialY : void 0) || 0;
  };

  function Boilerplate(el, options) {
    var _ref1;
    this.el = el;
    this.keysPressed = 0;
    this.lastKeyScroll = 0;
    this.activeTool = 'move';
    this.setGrid(options.grid);
    this.resetView(options);
    this.canScroll = (_ref1 = options.canScroll) != null ? _ref1 : true;
    this.animTime = options.animTime || 0;
    this.useWebGL = options.useWebGL || false;
    if (this.el.tabIndex === -1) {
      this.el.tabIndex = 0;
    }
    this.canvas = this.el.appendChild(document.createElement('canvas'));
    this.canvas.className = 'draw';
    this.el.boilerplate = this;
    if (this.useWebGL) {
      this.ctx = new WebGLContext(this.canvas);
      console.log("using webgl");
    } else {
      console.log("using canvas");
    }
    this.resizeTo(el.offsetWidth, el.offsetHeight);
    this.mouse = {
      x: null,
      y: null,
      mode: null
    };
    this.imminent_select = false;
    this.selectedA = this.selectedB = null;
    this.selectOffset = null;
    this.selection = null;
    this.draw();
    this.el.onmousemove = (function(_this) {
      return function(e) {
        var tx, ty, _ref2, _ref3, _ref4;
        _this.imminent_select = !!e.shiftKey;
        if (e.button && !_this.mouse.mode) {
          _this.el.onmousedown(e);
        }
        _this.mouse.from = {
          tx: _this.mouse.tx,
          ty: _this.mouse.ty
        };
        _this.mouse.x = clamp((_ref2 = e.offsetX) != null ? _ref2 : e.layerX, 0, _this.el.offsetWidth - 1);
        _this.mouse.y = clamp((_ref3 = e.offsetY) != null ? _ref3 : e.layerY, 0, _this.el.offsetHeight - 1);
        _ref4 = _this.screenToWorld(_this.mouse.x, _this.mouse.y), tx = _ref4.tx, ty = _ref4.ty;
        if (tx !== _this.mouse.tx || ty !== _this.mouse.ty) {
          _this.mouse.tx = tx;
          _this.mouse.ty = ty;
          switch (_this.mouse.mode) {
            case 'paint':
              _this.paint();
              break;
            case 'select':
              _this.selectedB = _this.screenToWorld(_this.mouse.x, _this.mouse.y);
          }
          _this.dragShuttleTo(tx, ty);
          _this.updateCursor();
          return _this.draw();
        }
      };
    })(this);
    this.el.onmousedown = (function(_this) {
      return function(e) {
        var dx, dy, shuttle, sid, v, _ref2;
        if (e.shiftKey) {
          _this.mouse.mode = 'select';
          _this.selection = _this.selectOffset = null;
          _this.selectedA = _this.screenToWorld(_this.mouse.x, _this.mouse.y);
          _this.selectedB = _this.selectedA;
        } else if (_this.selection) {
          _this.stamp();
        } else {
          if (_this.activeTool === 'move') {
            v = _this.compiled.grid["" + _this.mouse.tx + "," + _this.mouse.ty];
            if (v === 'shuttle' || v === 'thinshuttle') {
              if (_this.needsCompile) {
                _this.compile();
              }
              sid = _this.compiled.ast.shuttleGrid[[_this.mouse.tx, _this.mouse.ty]];
              shuttle = _this.compiled.ast.shuttles[sid];
              if (!shuttle.immobile) {
                _ref2 = shuttle.states[_this.compiled.states[sid]], dx = _ref2.dx, dy = _ref2.dy;
                _this.draggedShuttle = {
                  sid: sid,
                  heldPoint: {
                    x: _this.mouse.tx - dx,
                    y: _this.mouse.ty - dy
                  }
                };
              }
            }
          } else {
            _this.mouse.mode = 'paint';
            _this.mouse.from = {
              tx: _this.mouse.tx,
              ty: _this.mouse.ty
            };
            _this.paint();
          }
        }
        _this.updateCursor();
        return _this.draw();
      };
    })(this);
    this.el.onmouseup = (function(_this) {
      return function() {
        _this.draggedShuttle = null;
        if (_this.needsCompile) {
          _this.compile();
        }
        if (_this.mouse.mode === 'select') {
          _this.selection = _this.copySubgrid(enclosingRect(_this.selectedA, _this.selectedB));
          _this.selectOffset = {
            tx: _this.selectedB.tx - Math.min(_this.selectedA.tx, _this.selectedB.tx),
            ty: _this.selectedB.ty - Math.min(_this.selectedA.ty, _this.selectedB.ty)
          };
        }
        _this.mouse.mode = null;
        _this.imminent_select = false;
        _this.updateCursor();
        _this.draw();
        return typeof _this.onEditFinish === "function" ? _this.onEditFinish() : void 0;
      };
    })(this);
    this.el.onmouseout = (function(_this) {
      return function(e) {
        _this.el.onmousemove(e);
        _this.mouse.x = _this.mouse.y = _this.mouse.from = _this.mouse.tx = _this.mouse.ty = null;
        _this.mouse.mode = null;
        return _this.draw();
      };
    })(this);
    this.el.onmouseenter = (function(_this) {
      return function(e) {
        if (e.button) {
          _this.el.onmousemove(e);
          return _this.el.onmousedown(e);
        }
      };
    })(this);
    this.el.onwheel = (function(_this) {
      return function(e) {
        var oldsize, _ref2;
        if (!_this.canScroll) {
          return;
        }
        if (e.shiftKey) {
          oldsize = _this.size;
          _this.zoomBy(-e.deltaY / 400);
          _this.scroll_x += _this.mouse.x / oldsize - _this.mouse.x / _this.size;
          _this.scroll_y += _this.mouse.y / oldsize - _this.mouse.y / _this.size;
        } else {
          _this.scroll_x += e.deltaX / _this.size;
          _this.scroll_y += e.deltaY / _this.size;
        }
        _ref2 = _this.screenToWorld(_this.mouse.x, _this.mouse.y), _this.mouse.tx = _ref2.tx, _this.mouse.ty = _ref2.ty;
        e.preventDefault();
        _this.updateCursor();
        return _this.draw();
      };
    })(this);
  }

  Boilerplate.prototype.updateCursor = function() {
    var _ref1;
    return this.canvas.style.cursor = this.activeTool === 'move' && !this.imminent_select ? this.draggedShuttle != null ? '-webkit-grabbing' : (_ref1 = this.compiled.grid["" + this.mouse.tx + "," + this.mouse.ty]) === 'shuttle' || _ref1 === 'thinshuttle' ? '-webkit-grab' : 'default' : 'crosshair';
  };

  Boilerplate.prototype.resizeTo = function(width, height) {
    if (this.useWebGL) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.ctx.resizeTo(width, height);
    } else {
      this.canvas.width = width * devicePixelRatio;
      this.canvas.height = height * devicePixelRatio;
      this.canvas.style.width = width + 'px';
      this.canvas.style.height = height + 'px';
      this.ctx = this.canvas.getContext('2d');
      this.ctx.scale(devicePixelRatio, devicePixelRatio);
    }
    return this.draw();
  };

  Boilerplate.prototype.paint = function() {
    var fromtx, fromty, tx, ty, _ref1, _ref2;
    if (this.activeTool === 'move') {
      throw 'Invalid placing';
    }
    _ref1 = this.mouse, tx = _ref1.tx, ty = _ref1.ty;
    _ref2 = this.mouse.from, fromtx = _ref2.tx, fromty = _ref2.ty;
    if (fromtx == null) {
      fromtx = tx;
    }
    if (fromty == null) {
      fromty = ty;
    }
    line(fromtx, fromty, tx, ty, (function(_this) {
      return function(x, y) {
        if (_this.activeTool != null) {
          _this.compiled.grid[[x, y]] = _this.activeTool;
        } else {
          delete _this.compiled.grid[[x, y]];
        }
        return typeof _this.onEdit === "function" ? _this.onEdit(x, y, _this.activeTool) : void 0;
      };
    })(this));
    return this.gridChanged();
  };

  Boilerplate.prototype.compile = function(force) {
    var e, k, s, v, x, y, _i, _len, _ref1, _ref2, _ref3;
    if (!force && !this.needsCompile) {
      return;
    }
    this.needsCompile = false;
    this.compiled = compile(this.grid);
    _ref1 = this.compiled.ast.shuttles;
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      s = _ref1[_i];
      s.edges = {};
      _ref2 = s.points;
      for (k in _ref2) {
        v = _ref2[k];
        _ref3 = parseXY(k), x = _ref3.x, y = _ref3.y;
        e = 0;
        if (!s.points["" + x + "," + (y - 1)]) {
          e = e | 1;
        }
        if (!s.points["" + (x + 1) + "," + y]) {
          e = e | 2;
        }
        if (!s.points["" + x + "," + (y + 1)]) {
          e = e | 4;
        }
        if (!s.points["" + (x - 1) + "," + y]) {
          e = e | 8;
        }
        s.edges[k] = e;
      }
    }
    this.compiled.calcPressure();
    this.prevStates = new this.compiled.states.constructor(this.compiled.states);
    this.states = this.compiled.states;
    return this.draw();
  };

  Boilerplate.prototype.gridChanged = function() {
    this.needsCompile = true;
    return this.draw();
  };

  Boilerplate.prototype.step = function() {
    var anythingChanged, sid, v, _i, _j, _len, _len1, _ref1, _ref2;
    if (this.needsCompile) {
      return;
    }
    anythingChanged = false;
    _ref1 = this.states;
    for (sid = _i = 0, _len = _ref1.length; _i < _len; sid = ++_i) {
      v = _ref1[sid];
      this.prevStates[sid] = this.states[sid];
    }
    this.compiled.updateShuttles();
    if (this.draggedShuttle != null) {
      this.states[this.draggedShuttle.sid] = this.prevStates[this.draggedShuttle.sid];
    }
    _ref2 = this.states;
    for (sid = _j = 0, _len1 = _ref2.length; _j < _len1; sid = ++_j) {
      v = _ref2[sid];
      if (this.prevStates[sid] !== v) {
        anythingChanged = true;
        this.moveShuttle(sid, this.prevStates[sid], v);
      }
    }
    this.lastStepAt = Date.now();
    if (anythingChanged) {
      this.compiled.calcPressure();
      this.draw();
      return this.updateCursor();
    }
  };

  Boilerplate.prototype.moveShuttle = function(sid, from, to) {
    return moveShuttle(this.compiled.grid, this.compiled.ast.shuttles, sid, from, to);
  };

  Boilerplate.prototype.dragShuttleTo = function(tx, ty) {
    var bestState, d, dist2, dx, dy, heldPoint, minDist, shuttle, sid, state, _i, _len, _ref1, _ref2, _ref3;
    if (this.draggedShuttle == null) {
      return;
    }
    if (this.needsCompile) {
      return;
    }
    _ref1 = this.draggedShuttle, sid = _ref1.sid, heldPoint = _ref1.heldPoint;
    shuttle = this.compiled.ast.shuttles[sid];
    dist2 = function(_arg, _arg1) {
      var dx, dy, x1, x2, y1, y2;
      x1 = _arg.x, y1 = _arg.y;
      x2 = _arg1.x, y2 = _arg1.y;
      dx = x2 - x1;
      dy = y2 - y1;
      return dx * dx + dy * dy;
    };
    minDist = null;
    bestState = this.compiled.states[sid];
    _ref2 = shuttle.states;
    for (state = _i = 0, _len = _ref2.length; _i < _len; state = ++_i) {
      _ref3 = _ref2[state], dx = _ref3.dx, dy = _ref3.dy;
      if ((d = dist2({
        x: heldPoint.x + dx,
        y: heldPoint.y + dy
      }, {
        x: tx,
        y: ty
      })) < minDist || (minDist == null)) {
        bestState = state;
        minDist = d;
      }
    }
    if (this.states[sid] !== bestState) {
      this.moveShuttle(sid, this.states[sid], bestState);
      this.states[sid] = this.prevStates[sid] = bestState;
      this.compiled.calcPressure();
      return this.draw();
    }
  };

  Boilerplate.prototype.copySubgrid = function(rect) {
    var s, subgrid, th, tw, tx, ty, x, y, _i, _j, _ref1, _ref2;
    tx = rect.tx, ty = rect.ty, tw = rect.tw, th = rect.th;
    subgrid = {
      tw: tw,
      th: th
    };
    for (y = _i = ty, _ref1 = ty + th; ty <= _ref1 ? _i < _ref1 : _i > _ref1; y = ty <= _ref1 ? ++_i : --_i) {
      for (x = _j = tx, _ref2 = tx + tw; tx <= _ref2 ? _j < _ref2 : _j > _ref2; x = tx <= _ref2 ? ++_j : --_j) {
        if (s = this.compiled.grid[[x, y]]) {
          subgrid[[x - tx, y - ty]] = s;
        }
      }
    }
    return subgrid;
  };

  Boilerplate.prototype.flip = function(dir) {
    var k, new_selection, th, tw, tx, tx_, ty, ty_, v, _ref1, _ref2;
    if (!this.selection) {
      return;
    }
    new_selection = {
      tw: tw = this.selection.tw,
      th: th = this.selection.th
    };
    _ref1 = this.selection;
    for (k in _ref1) {
      v = _ref1[k];
      if (!(k !== 'tw' && k !== 'th')) {
        continue;
      }
      _ref2 = parseXY(k), tx = _ref2.x, ty = _ref2.y;
      tx_ = __indexOf.call(dir, 'x') >= 0 ? tw - 1 - tx : tx;
      ty_ = __indexOf.call(dir, 'y') >= 0 ? th - 1 - ty : ty;
      new_selection[[tx_, ty_]] = v;
    }
    return this.selection = new_selection;
  };

  Boilerplate.prototype.mirror = function() {
    var k, new_selection, th, tw, tx, ty, v, _ref1, _ref2;
    if (!this.selection) {
      return;
    }
    new_selection = {
      tw: tw = this.selection.th,
      th: th = this.selection.tw
    };
    _ref1 = this.selection;
    for (k in _ref1) {
      v = _ref1[k];
      if (!(k !== 'tw' && k !== 'th')) {
        continue;
      }
      _ref2 = parseXY(k), tx = _ref2.x, ty = _ref2.y;
      new_selection[[ty, tx]] = v;
    }
    return this.selection = new_selection;
  };

  Boilerplate.prototype.stamp = function() {
    var changed, mtx, mty, s, tx, ty, x, y, _i, _j, _ref1, _ref2, _ref3;
    if (!this.selection) {
      throw new Error('tried to stamp without a selection');
    }
    _ref1 = this.screenToWorld(this.mouse.x, this.mouse.y), mtx = _ref1.tx, mty = _ref1.ty;
    mtx -= this.selectOffset.tx;
    mty -= this.selectOffset.ty;
    changed = false;
    for (y = _i = 0, _ref2 = this.selection.th; 0 <= _ref2 ? _i < _ref2 : _i > _ref2; y = 0 <= _ref2 ? ++_i : --_i) {
      for (x = _j = 0, _ref3 = this.selection.tw; 0 <= _ref3 ? _j < _ref3 : _j > _ref3; x = 0 <= _ref3 ? ++_j : --_j) {
        tx = mtx + x;
        ty = mty + y;
        if ((s = this.selection[[x, y]]) !== this.compiled.grid[[tx, ty]]) {
          changed = true;
          if (s != null) {
            this.compiled.grid[[tx, ty]] = s;
          } else {
            delete this.compiled.grid[[tx, ty]];
          }
          if (typeof this.onEdit === "function") {
            this.onEdit(tx, ty, s);
          }
        }
      }
    }
    if (changed) {
      return this.gridChanged();
    }
  };

  Boilerplate.prototype.copy = function(e) {
    if (this.selection) {
      e.clipboardData.setData('text', JSON.stringify(this.selection));
      console.log(JSON.stringify(this.selection));
    }
    return e.preventDefault();
  };

  Boilerplate.prototype.paste = function(e) {
    var data, k, th, tw, v, x, y, _ref1, _ref2;
    data = e.clipboardData.getData('text');
    if (data) {
      try {
        this.selection = JSON.parse(data);
        tw = th = 0;
        _ref1 = this.selection;
        for (k in _ref1) {
          v = _ref1[k];
          _ref2 = parseXY(k), x = _ref2.x, y = _ref2.y;
          if (x >= tw) {
            tw = x + 1;
          }
          if (y >= th) {
            th = y + 1;
          }
        }
        this.selection.tw = tw;
        this.selection.th = th;
        return this.selectOffset = {
          tx: 0,
          ty: 0
        };
      } catch (_error) {}
    }
  };

  Boilerplate.prototype.draw = function() {
    if (this.needsDraw) {
      return;
    }
    this.needsDraw = true;
    return requestAnimationFrame((function(_this) {
      return function() {
        var amt, now;
        _this.needsDraw = false;
        if (_this.keysPressed && _this.canScroll) {
          now = Date.now();
          amt = 0.5 * Math.min(now - _this.lastKeyScroll, 300);
          if (_this.keysPressed & KEY.up) {
            _this.scroll_y -= amt / _this.size;
          }
          if (_this.keysPressed & KEY.right) {
            _this.scroll_x += amt / _this.size;
          }
          if (_this.keysPressed & KEY.down) {
            _this.scroll_y += amt / _this.size;
          }
          if (_this.keysPressed & KEY.left) {
            _this.scroll_x -= amt / _this.size;
          }
          _this.lastKeyScroll = now;
        }
        _this.drawFrame();
        if (_this.keysPressed) {
          return _this.draw();
        }
      };
    })(this));
  };

  Boilerplate.prototype.drawFrame = function() {
    var _base;
    this.ctx.fillStyle = Boilerplate.colors['solid'];
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawGrid();
    this.drawOverlay();
    return typeof (_base = this.ctx).flush === "function" ? _base.flush() : void 0;
  };

  Boilerplate.prototype.drawShuttle = function(t, sid) {
    var b, drawnAnything, dx, dy, e, k, k2, moving, p, prevstate, prevstateid, px, px2, py, py2, rid, shuttle, sizex, sizey, state, stateid, v, x, y, _ref1, _ref2, _ref3, _ref4;
    shuttle = this.compiled.ast.shuttles[sid];
    drawnAnything = false;
    moving = false;
    if (!shuttle.immobile) {
      stateid = this.states[sid];
      state = shuttle.states[stateid];
      dx = state.dx;
      dy = state.dy;
      if (t < 1) {
        prevstateid = this.prevStates[sid];
        prevstate = shuttle.states[prevstateid];
        if (stateid !== prevstateid) {
          moving = true;
          if (dx !== prevstate.dx) {
            dx = lerp(t, prevstate.dx, dx);
          } else if (dy !== prevstate.dy) {
            dy = lerp(t, prevstate.dy, dy);
          }
        }
      }
    } else {
      dx = dy = 0;
      t = 1;
    }
    _ref1 = shuttle.points;
    for (k in _ref1) {
      v = _ref1[k];
      _ref2 = parseXY(k), x = _ref2.x, y = _ref2.y;
      _ref3 = this.worldToScreen(x + dx, y + dy), px = _ref3.px, py = _ref3.py;
      if (px + this.size >= 0 && px < this.canvas.width && py + this.size >= 0 && py < this.canvas.height) {
        drawnAnything = true;
        this.ctx.fillStyle = Boilerplate.colors[v];
        px2 = px;
        py2 = py;
        sizex = sizey = this.size;
        e = shuttle.edges[k];
        if (e) {
          b = v === 'shuttle' ? this.size * 0.04 : this.size * 0.25;
          b = (b + 1) | 0;
          if (e & 1) {
            py2 += b;
            sizey -= b;
          }
          if (e & 2) {
            sizex -= b;
          }
          if (e & 4) {
            sizey -= b;
          }
          if (e & 8) {
            px2 += b;
            sizex -= b;
          }
        }
        this.ctx.fillRect(px2, py2, sizex, sizey);
        this.ctx.fillStyle = Boilerplate.colors.nothing;
        if ((e & 0x9) === 0 && !shuttle.points["" + (x - 1) + "," + (y - 1)]) {
          this.ctx.fillRect(px, py, b, b);
        }
        if ((e & 0x3) === 0 && !shuttle.points["" + (x + 1) + "," + (y - 1)]) {
          this.ctx.fillRect(px + this.size - b, py, b, b);
        }
        if ((e & 0x6) === 0 && !shuttle.points["" + (x + 1) + "," + (y + 1)]) {
          this.ctx.fillRect(px + this.size - b, py + this.size - b, b, b);
        }
        if ((e & 0xc) === 0 && !shuttle.points["" + (x - 1) + "," + (y + 1)]) {
          this.ctx.fillRect(px, py + this.size - b, b, b);
        }
        if (v === 'thinshuttle') {
          k2 = state ? "" + (x + state.dx) + "," + (y + state.dy) : k;
          rid = (_ref4 = shuttle.adjacentTo[k2]) != null ? _ref4[stateid || 0] : void 0;
          if (rid != null) {
            p = this.compiled.getPressure(rid);
            if (p !== 0) {
              this.ctx.fillStyle = p < 0 ? 'rgba(255,0,0,0.2)' : 'rgba(0,255,0,0.15)';
              this.ctx.fillRect(px, py, this.size, this.size);
            }
          }
        }
      }
    }
    return drawnAnything && moving;
  };

  Boilerplate.prototype.getRegionId = function(k) {
    var shuttle, sid, v, _ref1, _ref2, _ref3;
    if (!this.compiled) {
      return;
    }
    v = this.compiled.grid[k];
    if (!v) {
      return;
    }
    if (v === 'bridge') {
      return [this.compiled.ast.edgeGrid["" + k + ",true"], this.compiled.ast.edgeGrid["" + k + ",false"]];
    } else if (v) {
      if ((sid = this.compiled.ast.shuttleGrid[k]) != null) {
        shuttle = this.compiled.ast.shuttles[sid];
        return (_ref1 = (_ref2 = shuttle.adjacentTo[k]) != null ? _ref2[this.states[sid]] : void 0) != null ? _ref1 : (_ref3 = shuttle.adjacentTo[k]) != null ? _ref3[this.prevStates[sid]] : void 0;
      } else {
        return this.compiled.ast.regionGrid[k];
      }
    }
  };

  Boilerplate.prototype.drawGrid = function() {
    var b, exact, getShadeColor, hoverSid, hoverZone, hoverZone2, k, leftColor, mtx, mty, mx, my, needsRedraw, now, px, py, rid, rids, shadeColor, sid, t, topColor, tx, ty, v, _, _i, _len, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6;
    needsRedraw = false;
    t = this.animTime && this.lastStepAt ? (now = Date.now(), exact = Math.min(1, (now - this.lastStepAt) / this.animTime), ((exact * this.size) | 0) / this.size) : 1;
    mx = this.mouse.x;
    my = this.mouse.y;
    _ref1 = this.screenToWorld(mx, my), mtx = _ref1.tx, mty = _ref1.ty;
    if (!this.needsCompile && this.activeTool === 'move' && !this.selection && !this.imminent_select) {
      k = "" + mtx + "," + mty;
      rids = this.getRegionId(k);
      if (Array.isArray(rids)) {
        hoverZone = this.compiled.getZone(rids[0]);
        hoverZone2 = this.compiled.getZone(rids[1]);
      } else {
        hoverZone = (rids != null) && this.compiled.getZone(rids);
      }
      hoverSid = this.draggedShuttle ? this.draggedShuttle.sid : (_ref2 = this.compiled.grid[k]) === 'shuttle' || _ref2 === 'thinshuttle' ? this.compiled.ast.shuttleGrid[k] : void 0;
    }
    getShadeColor = (function(_this) {
      return function(rid) {
        var pressure, zone;
        zone = _this.compiled.getZone(rid);
        pressure = _this.compiled.getPressure(rid);
        if (zone >= 0 && (zone === hoverZone || zone === hoverZone2)) {
          if (pressure < 0) {
            return 'hsla(16,68%,50%,0.8)';
          } else if (pressure > 0) {
            return 'hsla(120,52%,58%,0.8)';
          } else {
            return 'rgba(0,0,0,0.5)';
          }
        }
        if (pressure) {
          if (pressure < 0) {
            return 'rgba(255,0,0,0.2)';
          } else {
            return 'rgba(0,255,0,0.15)';
          }
        }
      };
    })(this);
    _ref3 = this.compiled.grid;
    for (k in _ref3) {
      v = _ref3[k];
      _ref4 = parseXY(k), tx = _ref4.x, ty = _ref4.y;
      _ref5 = this.worldToScreen(tx, ty), px = _ref5.px, py = _ref5.py;
      if (px + this.size >= 0 && px < this.canvas.width && py + this.size >= 0 && py < this.canvas.height) {
        this.ctx.fillStyle = !this.needsCompile && (v === 'shuttle' || v === 'thinshuttle') ? Boilerplate.colors.nothing : Boilerplate.colors[v] || 'red';
        this.ctx.fillRect(px, py, this.size, this.size);
        if (!this.compiled) {
          continue;
        }
        if (v === 'bridge') {
          topColor = getShadeColor(this.compiled.ast.edgeGrid["" + k + ",true"]);
          b = (this.size / 4 + 1) | 0;
          if (topColor) {
            this.ctx.fillStyle = topColor;
            this.ctx.fillRect(px + b, py, this.size - 2 * b, this.size);
          }
          leftColor = getShadeColor(this.compiled.ast.edgeGrid["" + k + ",false"]);
          if (leftColor) {
            this.ctx.fillStyle = leftColor;
            this.ctx.fillRect(px, py + b, this.size, this.size - 2 * b);
          }
        } else if (v) {
          if ((hoverSid != null) && this.compiled.ast.shuttleGrid[k] === hoverSid) {
            this.ctx.fillStyle = Boilerplate.colors.thinshuttle;
            this.ctx.fillRect(px, py, this.size, this.size);
          } else {
            rid = this.getRegionId(k);
            if ((rid != null) && (shadeColor = getShadeColor(rid))) {
              this.ctx.fillStyle = shadeColor;
              this.ctx.fillRect(px, py, this.size, this.size);
            }
          }
        }
      }
    }
    if (!this.needsCompile) {
      _ref6 = this.compiled.ast.shuttles;
      for (sid = _i = 0, _len = _ref6.length; _i < _len; sid = ++_i) {
        _ = _ref6[sid];
        if (this.drawShuttle(t, sid)) {
          needsRedraw = true;
        }
      }
    }
    if (t !== 1 && needsRedraw) {
      this.draw();
    }
  };

  Boilerplate.prototype.drawOverlay = function() {
    var mpx, mpy, mtx, mty, mx, my, px, py, sa, sb, th, tw, tx, ty, v, x, y, _i, _j, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8;
    mx = this.mouse.x;
    my = this.mouse.y;
    _ref1 = this.screenToWorld(mx, my), mtx = _ref1.tx, mty = _ref1.ty;
    _ref2 = this.worldToScreen(mtx, mty), mpx = _ref2.px, mpy = _ref2.py;
    if (this.mouse.mode === 'select') {
      sa = this.selectedA;
      sb = this.selectedB;
    } else if (this.imminent_select) {
      sa = sb = {
        tx: mtx,
        ty: mty
      };
    }
    this.ctx.lineWidth = 1;
    if (this.mouse.tx !== null) {
      if (sa) {
        _ref3 = enclosingRect(sa, sb), tx = _ref3.tx, ty = _ref3.ty, tw = _ref3.tw, th = _ref3.th;
        _ref4 = this.worldToScreen(tx, ty), px = _ref4.px, py = _ref4.py;
        this.ctx.fillStyle = 'rgba(0,0,255,0.5)';
        this.ctx.fillRect(px, py, tw * this.size, th * this.size);
        this.ctx.strokeStyle = 'rgba(0,255,255,0.5)';
        this.ctx.strokeRect(px, py, tw * this.size, th * this.size);
      } else if (this.selection) {
        this.ctx.globalAlpha = 0.8;
        for (y = _i = 0, _ref5 = this.selection.th; 0 <= _ref5 ? _i < _ref5 : _i > _ref5; y = 0 <= _ref5 ? ++_i : --_i) {
          for (x = _j = 0, _ref6 = this.selection.tw; 0 <= _ref6 ? _j < _ref6 : _j > _ref6; x = 0 <= _ref6 ? ++_j : --_j) {
            _ref7 = this.worldToScreen(x + mtx - this.selectOffset.tx, y + mty - this.selectOffset.ty), px = _ref7.px, py = _ref7.py;
            if (px + this.size >= 0 && px < this.canvas.width && py + this.size >= 0 && py < this.canvas.height) {
              v = this.selection[[x, y]];
              this.ctx.fillStyle = v ? Boilerplate.colors[v] : Boilerplate.colors['solid'];
              this.ctx.fillRect(px, py, this.size, this.size);
            }
          }
        }
        this.ctx.strokeStyle = 'rgba(0,255,255,0.5)';
        this.ctx.strokeRect(mpx - this.selectOffset.tx * this.size, mpy - this.selectOffset.ty * this.size, this.selection.tw * this.size, this.selection.th * this.size);
        this.ctx.globalAlpha = 1;
      } else if (mpx != null) {
        if (this.activeTool !== 'move') {
          this.ctx.fillStyle = Boilerplate.colors[(_ref8 = this.activeTool) != null ? _ref8 : 'solid'];
          this.ctx.fillRect(mpx + this.size / 4, mpy + this.size / 4, this.size / 2, this.size / 2);
          this.ctx.strokeStyle = this.compiled.grid["" + mtx + "," + mty] ? 'black' : 'white';
          this.ctx.strokeRect(mpx + 1, mpy + 1, this.size - 2, this.size - 2);
        }
      }
    }
  };

  return Boilerplate;

})();



},{"./gl":"/Users/josephg/src/b/boilerplate/lib/gl.coffee","boilerplate-compiler":"/Users/josephg/src/b/boilerplate/node_modules/boilerplate-compiler/index.js"}],"/Users/josephg/src/b/boilerplate/lib/gl.coffee":[function(require,module,exports){
var WebGLContext;

WebGLContext = (function() {
  var cssColorToRGB, fragSource, loadProgram, loadShader, vertSource;

  vertSource = "attribute vec2 a_position;\nattribute vec4 a_color;\nvarying lowp vec4 v_color;\n\nuniform vec2 u_resolution;\n\nvoid main() {\n   // convert the rectangle from pixels to 0.0 to 1.0\n   vec2 zeroToOne = a_position / u_resolution;\n\n   // convert from 0->1 to 0->2\n   vec2 zeroToTwo = zeroToOne * 2.0;\n\n   // convert from 0->2 to -1->+1 (clipspace)\n   vec2 clipSpace = zeroToTwo - 1.0;\n\n   gl_Position = vec4(clipSpace * vec2(1,-1), 0, 1);\n   v_color = a_color;\n}";

  fragSource = "varying lowp vec4 v_color;\nvoid main() {\n  gl_FragColor = v_color;\n}";

  loadShader = function(gl, shaderSource, shaderType, opt_errorCallback) {
    var compiled, lastError, shader;
    shader = gl.createShader(shaderType);
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);
    compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!compiled) {
      lastError = gl.getShaderInfoLog(shader);
      console.error("*** Error compiling shader '" + shader + "':" + lastError);
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };

  loadProgram = function(gl, shaders, opt_attribs, opt_locations) {
    var attrib, i, lastError, linked, program, s, _i, _j, _len, _len1;
    program = gl.createProgram();
    for (_i = 0, _len = shaders.length; _i < _len; _i++) {
      s = shaders[_i];
      gl.attachShader(program, s);
    }
    if (opt_attribs) {
      for (i = _j = 0, _len1 = opt_attribs.length; _j < _len1; i = ++_j) {
        attrib = opt_attribs[i];
        gl.bindAttribLocation(program, opt_locations ? opt_locations[i] : i, attrib);
      }
    }
    gl.linkProgram(program);
    linked = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!linked) {
      lastError = gl.getProgramInfoLog(program);
      console.error("Error in program linking:" + lastError);
      gl.deleteProgram(program);
      return null;
    }
    return program;
  };

  cssColorToRGB = (function() {
    var cache, s;
    s = document.createElement('span');
    s.id = '-color-converter';
    s.style.position = 'absolute';
    s.style.left = '-9999px';
    s.style.top = '-9999px';
    document.body.appendChild(s);
    cache = {};
    return function(cssColor) {
      var a, b, g, m, r, rgb;
      if (cache[cssColor]) {
        return cache[cssColor];
      }
      s.style.backgroundColor = cssColor;
      rgb = getComputedStyle(s).backgroundColor;
      m = /^rgb\((\d+), (\d+), (\d+)\)$/.exec(rgb);
      if (!m) {
        m = /^rgba\((\d+), (\d+), (\d+), ([\d.]+)\)$/.exec(rgb);
      }
      r = parseInt(m[1]);
      g = parseInt(m[2]);
      b = parseInt(m[3]);
      a = m[4] ? parseFloat(m[4]) : 1.0;
      return cache[cssColor] = [r / 255, g / 255, b / 255, a];
    };
  })();

  function WebGLContext(canvas) {
    var fragmentShader, program, vertexShader;
    this.gl = canvas.getContext('webgl');
    vertexShader = loadShader(this.gl, vertSource, this.gl.VERTEX_SHADER);
    fragmentShader = loadShader(this.gl, fragSource, this.gl.FRAGMENT_SHADER);
    program = loadProgram(this.gl, [vertexShader, fragmentShader]);
    this.gl.useProgram(program);
    this.positionLocation = this.gl.getAttribLocation(program, "a_position");
    this.colorLocation = this.gl.getAttribLocation(program, "a_color");
    this.resolutionLocation = this.gl.getUniformLocation(program, "u_resolution");
    this.vbuf = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbuf);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, 4 * 1000000 * 4, this.gl.STATIC_DRAW);
    this.cbuf = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cbuf);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, 4 * 1000000 * 6, this.gl.STATIC_DRAW);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    this.gl.enable(this.gl.BLEND);
    this.tris = [];
    this.colors = [];
    this.fillStyle = 'rgba(0,255,0,1.0)';
    this.strokeStyle = 'rgba(0,255,0,1.0)';
  }

  WebGLContext.prototype.resizeTo = function(width, height) {
    this.gl.viewport(0, 0, width * devicePixelRatio, height * devicePixelRatio);
    return this.gl.uniform2f(this.resolutionLocation, width, height);
  };

  WebGLContext.prototype.fillRect = function(l, t, w, h) {
    var a, b, g, r, _ref;
    r = l + w;
    b = t + h;
    this.tris.push.apply(this.tris, [l, t, r, t, l, b, l, b, r, t, r, b]);
    _ref = cssColorToRGB(this.fillStyle), r = _ref[0], g = _ref[1], b = _ref[2], a = _ref[3];
    return this.colors.push.apply(this.colors, [r, g, b, a, r, g, b, a, r, g, b, a, r, g, b, a, r, g, b, a, r, g, b, a]);
  };

  WebGLContext.prototype.strokeRect = function(l, t, w, h) {
    var oldFill;
    oldFill = this.fillStyle;
    this.fillStyle = this.strokeStyle;
    this.fillRect(l, t, w, 1);
    this.fillRect(l, t + 1, 1, h - 1);
    this.fillRect(l + w - 1, t + 1, 1, h - 1);
    this.fillRect(l + 1, t + h - 1, w - 2, 1);
    return this.fillStyle = oldFill;
  };

  WebGLContext.prototype.flush = function() {
    var i, max, subData, _i, _j, _ref, _ref1;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbuf);
    max = 20000 * 6;
    for (i = _i = 0, _ref = (this.tris.length / max) | 0; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
      subData = new Float32Array(this.tris.slice(i * max, (i + 1) * max));
      this.gl.bufferSubData(this.gl.ARRAY_BUFFER, i * max * 4, subData);
    }
    this.gl.enableVertexAttribArray(this.positionLocation);
    this.gl.vertexAttribPointer(this.positionLocation, 2, this.gl.FLOAT, false, 0, 0);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cbuf);
    for (i = _j = 0, _ref1 = (this.colors.length / max) | 0; 0 <= _ref1 ? _j <= _ref1 : _j >= _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
      subData = new Float32Array(this.colors.slice(i * max, (i + 1) * max));
      this.gl.bufferSubData(this.gl.ARRAY_BUFFER, i * max * 4, subData);
    }
    this.gl.enableVertexAttribArray(this.colorLocation);
    this.gl.vertexAttribPointer(this.colorLocation, 4, this.gl.FLOAT, false, 0, 0);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.tris.length / 2);
    this.tris.length = 0;
    return this.colors.length = 0;
  };

  return WebGLContext;

})();

exports.WebGLContext = WebGLContext;



},{}],"/Users/josephg/src/b/boilerplate/node_modules/boilerplate-compiler/index.js":[function(require,module,exports){
// Generated by CoffeeScript 1.8.0
(function() {
  var gen, parse, parseFile, _ref;

  exports.util = require('./util');

  _ref = require('./parser'), parse = _ref.parse, parseFile = _ref.parseFile;

  gen = require('./js-codegen').gen;

  exports.parse = parse;

  exports.parseFile = parseFile;

  exports.genJS = gen;

  exports.compileFile = function(filename, opts) {
    var ast;
    ast = parseFile(filename, opts);
    gen(ast, opts.stream, opts);
    return ast;
  };

  exports.compileGrid = function(grid, opts) {
    var ast;
    ast = parse(grid, opts);
    gen(ast, opts.stream, opts);
    return ast;
  };

}).call(this);

//# sourceMappingURL=index.js.map

},{"./js-codegen":"/Users/josephg/src/b/boilerplate/node_modules/boilerplate-compiler/js-codegen.js","./parser":"/Users/josephg/src/b/boilerplate/node_modules/boilerplate-compiler/parser.js","./util":"/Users/josephg/src/b/boilerplate/node_modules/boilerplate-compiler/util.js"}],"/Users/josephg/src/b/boilerplate/node_modules/boilerplate-compiler/js-codegen.js":[function(require,module,exports){
(function (process){
// Generated by CoffeeScript 1.8.0
(function() {
  var data, emitForceExpr, emitRegionCalcBody, filename, gen, indentedStream, intArray, parseFile, shuttleInAnyState, shuttleInRangeExpr, uintArray, util,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  util = require('./util');

  indentedStream = function(stream) {
    var W;
    W = function(str) {
      var l, lines, _i, _j, _len, _ref, _results;
      if (str == null) {
        str = '';
      }
      lines = str.split('\n');
      _results = [];
      for (_i = 0, _len = lines.length; _i < _len; _i++) {
        l = lines[_i];
        for (_j = 0, _ref = W.indentation; 0 <= _ref ? _j < _ref : _j > _ref; 0 <= _ref ? _j++ : _j--) {
          stream.write('  ');
        }
        _results.push(stream.write(l + '\n'));
      }
      return _results;
    };
    W.indentation = 0;
    W.block = function(f) {
      W.indentation++;
      f();
      return W.indentation--;
    };
    return W;
  };

  uintArray = function(max) {
    if (max < 256) {
      return 'Uint8Array';
    } else if (max < Math.pow(2, 16)) {
      return 'Uint16Array';
    } else {
      return 'Uint32Array';
    }
  };

  intArray = function(max) {
    if (max < 127) {
      return 'Int8Array';
    } else if (max < Math.pow(2, 15)) {
      return 'Int16Array';
    } else {
      return 'Int32Array';
    }
  };

  shuttleInRangeExpr = function(dest, numStates, stateExpr, base, distance) {
    var end;
    if (distance === 1 && numStates > 0) {
      dest.push("" + stateExpr + " === " + base);
    } else {
      end = base + distance;
      if (base && base > 0) {
        dest.push("" + stateExpr + " >= " + base);
      }
      if (end < numStates) {
        dest.push("" + stateExpr + " < " + end);
      }
    }
    return dest;
  };

  shuttleInAnyState = function(stateExpr, stateList) {
    var ands, end, i, numTrue, orClauses, region, s, _i, _j, _len, _ref;
    numTrue = 0;
    for (_i = 0, _len = stateList.length; _i < _len; _i++) {
      s = stateList[_i];
      if (s) {
        numTrue++;
      }
    }
    if (numTrue === stateList.length) {
      return;
    }
    orClauses = [];
    region = null;
    for (i = _j = 0, _ref = stateList.length; 0 <= _ref ? _j <= _ref : _j >= _ref; i = 0 <= _ref ? ++_j : --_j) {
      if (i >= stateList.length || !stateList[i]) {
        if (region) {
          end = region.base + region.distance;
          if (region.distance === 1 || (region.distance === 2 && (region.base !== 0 && end !== stateList.length))) {
            orClauses.push("" + stateExpr + " === " + region.base);
            if (region.distance === 2) {
              orClauses.push("" + stateExpr + " === " + (region.base + 1));
            }
          } else {
            ands = [];
            if (region.base > 0) {
              ands.push("" + stateExpr + " >= " + region.base);
            }
            if (end < stateList.length) {
              ands.push("" + stateExpr + " < " + end);
            }
            orClauses.push(ands.join(' && '));
          }
          region = null;
        }
      } else {
        if (region) {
          region.distance++;
        } else {
          region = {
            base: i,
            distance: 1
          };
        }
      }
    }
    return orClauses;
  };

  emitRegionCalcBody = function(W, parserData, rid, nonExclusiveMap, opts) {
    var ands, c, e, eid, engines, exclusivePressure, inStateOrs, key, keys, path, r, r2, regions, shuttles, wasCalculated, zoneIdxExpr, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2;
    path = opts.path, zoneIdxExpr = opts.zoneIdxExpr, wasCalculated = opts.wasCalculated;
    if (path) {
      path.push(rid);
    } else {
      path = opts.path = [rid];
    }
    if (wasCalculated) {
      wasCalculated[rid] = true;
    }
    regions = parserData.regions, shuttles = parserData.shuttles, engines = parserData.engines;
    r = regions[rid];
    W("regionZone[" + rid + "] = z;");
    exclusivePressure = 0;
    _ref = r.engines;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      eid = _ref[_i];
      e = engines[eid];
      if (e.exclusive) {
        exclusivePressure += e.pressure;
      }
    }
    if (opts.setBasePressure) {
      W("zonePressure[" + zoneIdxExpr + "] = " + exclusivePressure + ";");
      opts.setBasePressure = false;
    } else if (exclusivePressure > 0) {
      W("zonePressure[" + zoneIdxExpr + "] += " + exclusivePressure + ";");
    } else if (exclusivePressure < 0) {
      W("zonePressure[" + zoneIdxExpr + "] -= " + (-exclusivePressure) + ";");
    }
    _ref1 = r.engines;
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      eid = _ref1[_j];
      e = engines[eid];
      if (!e.exclusive) {
        W("addEngine(z, " + nonExclusiveMap[eid] + ", " + e.pressure + ");");
      }
    }
    W();
    keys = Object.keys(r.connections).sort(function(a, b) {
      a = r.connections[a];
      b = r.connections[b];
      if (a.rid !== b.rid) {
        return a.rid - b.rid;
      } else {
        return a.sid - b.sid;
      }
    });
    for (_k = 0, _len2 = keys.length; _k < _len2; _k++) {
      key = keys[_k];
      c = r.connections[key];
      r2 = regions[c.rid];
      if (r2.used === 'primaryOnly' || (_ref2 = c.rid, __indexOf.call(path, _ref2) >= 0)) {
        continue;
      }
      ands = [];
      if (!wasCalculated || wasCalculated[c.rid]) {
        ands.push("regionZone[" + c.rid + "] !== z");
      }
      inStateOrs = shuttleInAnyState("shuttleState[" + c.sid + "]", c.inStates);
      if (inStateOrs) {
        if (inStateOrs.length === 0) {
          continue;
        }
        ands.push(inStateOrs.length === 1 ? inStateOrs[0] : "(" + (inStateOrs.join(' || ')) + ")");
      }
      if (r2.inline) {
        if (ands.length) {
          W("if (" + (ands.join(' && ')) + ") {");
          W.indentation++;
        }
        emitRegionCalcBody(W, parserData, c.rid, nonExclusiveMap, opts);
        if (ands.length) {
          W.indentation--;
          W("}");
        }
      } else {
        W("if (" + (ands.join(' && ')) + ") calc" + c.rid + "(z);");
        if (wasCalculated) {
          util.fillRegions(regions, c.rid, function(rid) {
            if (wasCalculated[rid]) {
              return false;
            }
            wasCalculated[rid] = true;
            return true;
          });
        }
      }
    }
    return path.pop();
  };

  emitForceExpr = function(W, parserData, opts, sid, s, d) {
    var byState, elseForce, emitTernary, emittedOne, exhaustive, forceExpr, global, i, isAlreadySet, numSmallConditions, pressureExpr, regions, stateforce, writeForceExpr, writeForceStatement, _i, _j, _k, _len, _len1, _len2;
    if (!s.moves[d]) {
      throw 'Shuttle does not move in direction!';
    }
    regions = parserData.regions;
    global = [];
    byState = [];
    exhaustive = true;
    elseForce = null;
    (function() {
      var elseDistance, elseIdx, key, lastForce, lastKey, mult, p, state, stateforce, stateid, used, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2;
      elseIdx = -1;
      elseDistance = 0;
      _ref = s.pushedBy;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        p = _ref[_i];
        mult = p["m" + d];
        if (mult && regions[p.rid].used) {
          global.push({
            rid: p.rid,
            mult: mult
          });
        }
      }
      lastForce = null;
      lastKey = null;
      _ref1 = s.states;
      for (stateid = _j = 0, _len1 = _ref1.length; _j < _len1; stateid = ++_j) {
        state = _ref1[stateid];
        stateforce = {
          base: stateid,
          distance: 1,
          list: []
        };
        key = "";
        _ref2 = state.pushedBy;
        for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
          p = _ref2[_k];
          mult = p["m" + d];
          if (!mult) {
            continue;
          }
          used = regions[p.rid].used;
          if (!used) {
            continue;
          }
          stateforce.list.push({
            rid: p.rid,
            mult: mult
          });
          key += "" + p.rid + " " + mult + " ";
        }
        if (stateforce.list.length === 0) {
          lastKey = null;
          exhaustive = false;
        } else {
          if (lastKey === key) {
            lastForce.distance++;
          } else {
            lastKey = key;
            lastForce = stateforce;
            byState.push(stateforce);
          }
          if (lastForce.distance >= elseDistance) {
            elseDistance = lastForce.distance;
            elseIdx = byState.length - 1;
          }
        }
      }
      if (exhaustive) {
        return elseForce = byState[elseIdx];
      }
    })();
    if (!global.length && !byState.length) {
      return false;
    }
    W("\n// Calculating force for shuttle " + sid + " (" + s.type + ") with " + s.states.length + " states");
    pressureExpr = function(rid) {
      var used;
      used = parserData.regions[rid].used;
      if (opts.fillMode === 'engines' && used !== 'primaryOnly') {
        return "(z = regionZone[" + rid + "] - base, z < 0 ? 0 : zonePressure[z])";
      } else {
        return "zonePressure[regionZone[" + rid + "] - base]";
      }
    };
    forceExpr = function(mult, rid) {
      var multExpr;
      multExpr = mult === 1 ? '+' : mult === -1 ? '-' : "+ " + mult + "*";
      return "" + multExpr + " " + (pressureExpr(rid));
    };
    writeForceExpr = function(list) {
      return W.block(function() {
        var mult, printedAny, rid, _i, _len, _ref;
        printedAny = false;
        for (_i = 0, _len = list.length; _i < _len; _i++) {
          _ref = list[_i], rid = _ref.rid, mult = _ref.mult;
          if (!regions[rid].used) {
            continue;
          }
          printedAny = true;
          W("" + (forceExpr(mult, rid)));
        }
        if (!printedAny) {
          return W("0");
        }
      });
    };
    writeForceStatement = function(list, isAlreadySet) {
      W("force " + (isAlreadySet ? '+=' : '='));
      writeForceExpr(list);
      return W(";");
    };
    isAlreadySet = global.length ? (writeForceStatement(global), true) : false;
    if (s.type !== 'shuttle' || byState.length > 0) {
      W("state = shuttleState[" + sid + "];");
    }
    if (byState.length === 0) {
      return true;
    }
    numSmallConditions = 0;
    for (_i = 0, _len = byState.length; _i < _len; _i++) {
      stateforce = byState[_i];
      if (stateforce.distance < 2) {
        numSmallConditions++;
      }
    }
    emitTernary = function(stateforce) {
      var cond;
      cond = shuttleInRangeExpr([], s.states.length, "state", stateforce.base, stateforce.distance);
      W("(" + (cond.join('&&')) + ") ? (");
      writeForceExpr(stateforce.list);
      return W(") :");
    };
    if (numSmallConditions <= 2) {
      W("force " + (isAlreadySet ? '+=' : '='));
      W.block(function() {
        var i, _j, _len1;
        for (i = _j = 0, _len1 = byState.length; _j < _len1; i = ++_j) {
          stateforce = byState[i];
          if (stateforce !== elseForce) {
            emitTernary(stateforce);
          }
        }
        if (elseForce) {
          if (elseForce.distance > 1) {
            W("  // States " + elseForce.base + " to " + (elseForce.base + elseForce.distance - 1));
          } else {
            W("  // State " + elseForce.base);
          }
          writeForceExpr(elseForce.list, isAlreadySet);
          return W(";");
        } else {
          return W("0;");
        }
      });
    } else {
      emittedOne = false;
      for (_j = 0, _len1 = byState.length; _j < _len1; _j++) {
        stateforce = byState[_j];
        if (!(stateforce.distance > 2 && stateforce !== elseForce)) {
          continue;
        }
        if (!emittedOne) {
          W("force " + (isAlreadySet ? '+=' : '='));
          W.indentation++;
        }
        for (i = _k = 0, _len2 = byState.length; _k < _len2; i = ++_k) {
          stateforce = byState[i];
          if (stateforce !== elseForce) {
            emitTernary(stateforce);
          }
        }
        emittedOne = true;
        stateforce.done = true;
      }
      if (emittedOne) {
        W("0;");
        W.indentation--;
      }
      W("switch(state) {");
      W.block(function() {
        var _l, _len3, _m, _ref, _ref1;
        for (_l = 0, _len3 = byState.length; _l < _len3; _l++) {
          stateforce = byState[_l];
          if (!(!stateforce.done && stateforce !== elseForce)) {
            continue;
          }
          for (sid = _m = _ref = stateforce.base, _ref1 = stateforce.base + stateforce.distance; _ref <= _ref1 ? _m < _ref1 : _m > _ref1; sid = _ref <= _ref1 ? ++_m : --_m) {
            W("case " + sid + ":");
          }
          W.block(function() {
            writeForceStatement(stateforce.list, isAlreadySet);
            return W("break;");
          });
        }
        if (elseForce) {
          W("default:");
          return W.block(function() {
            return writeForceStatement(elseForce.list, isAlreadySet);
          });
        }
      });
      W("}");
    }
    return true;
  };

  gen = exports.gen = function(parserData, stream, opts) {
    var W, edgeGrid, engines, extents, grid, nonExclusiveMap, regions, shuttles, successorPtrs, _ref;
    if (opts == null) {
      opts = {};
    }
    shuttles = parserData.shuttles, regions = parserData.regions, engines = parserData.engines;
    W = indentedStream(stream);
    if (opts.fillMode) {
      if ((_ref = opts.fillMode) !== 'all' && _ref !== 'shuttles' && _ref !== 'engines') {
        throw Error('fillMode must be all, shuttles or engines');
      }
    } else {
      opts.fillMode = shuttles.length > engines.length ? 'shuttles' : 'engines';
    }
    if (opts.module == null) {
      opts.module = 'node';
    }
    W("// Generated from boilerplate-compiler v1 in fill mode '" + opts.fillMode + "'");
    W("// " + shuttles.length + " shuttles, " + regions.length + " regions and " + engines.length + " engines");
    if (opts.debug || ((opts.debug == null) && regions.length < 20)) {
      W("/* Compiled grid\n");
      extents = parserData.extents, grid = parserData.grid, edgeGrid = parserData.edgeGrid;
      extents || (extents = util.gridExtents(grid));
      util.printGrid(extents, grid, stream);
      util.printEdges(extents, grid, edgeGrid, stream);
      W("*/\n");
    }
    if (opts.module !== 'bare') {
      W("(function(){");
    }
    successorPtrs = null;
    (function() {
      var initialStates, maxStates, s, sid, state, successorData, v, _i, _j, _k, _len, _len1, _len2, _ref1, _ref2;
      maxStates = 0;
      initialStates = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = shuttles.length; _i < _len; _i++) {
          s = shuttles[_i];
          if (s.states.length > maxStates) {
            maxStates = s.states.length;
          }
          _results.push(s.initial);
        }
        return _results;
      })();
      W("var shuttleState = new " + (uintArray(maxStates)) + "([" + (initialStates.join(',')) + "]);\nvar regionZone = new Uint32Array(" + regions.length + ");\nvar base = 1, extent = 1;\n\nvar zonePressure = new " + (intArray(engines.length)) + "(" + regions.length + ");");
      if (opts.extraFns) {
        W("function getZone(rid) {\n  return regionZone[rid] - base;\n}\n\nfunction getPressure(rid) {\n  var z = regionZone[rid];\n  return z < base ? 0 : zonePressure[z-base];\n}\n");
      }
      W("function step() {\n  calcPressure();\n  updateShuttles();\n}");
      successorData = [];
      for (sid = _i = 0, _len = shuttles.length; _i < _len; sid = ++_i) {
        s = shuttles[sid];
        if (!(s.type === 'statemachine')) {
          continue;
        }
        successorPtrs || (successorPtrs = {});
        successorPtrs[sid] = successorData.length;
        _ref1 = s.states;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          state = _ref1[_j];
          _ref2 = state.successors;
          for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
            v = _ref2[_k];
            successorData.push(v);
          }
        }
      }
      if (successorData.length) {
        W("var successors = [" + (successorData.join(',')) + "];");
      }
      return W();
    })();
    nonExclusiveMap = {};
    (function() {
      var e, eid, num, _i, _len;
      num = 0;
      for (eid = _i = 0, _len = engines.length; _i < _len; eid = ++_i) {
        e = engines[eid];
        if (!e.exclusive) {
          nonExclusiveMap[eid] = num++;
        }
      }
      if (num) {
        return W("var engineLastUsedBy = new Uint32Array(" + num + ");\n\n// Only used for exclusive engines\nfunction addEngine(zone, engine, engineValue) {\n  if (engineLastUsedBy[engine] != zone) {\n    zonePressure[zone - base] += engineValue;\n    engineLastUsedBy[engine] = zone;\n  }\n}\n");
      }
    })();
    (function() {
      var e, fillFromRegion, k, numConnections, r, rid, s, state, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _len6, _len7, _m, _n, _o, _p, _q, _ref1, _ref2, _ref3, _ref4, _ref5;
      fillFromRegion = function(rid) {
        var r;
        r = regions[rid];
        if (r.neutral && opts.fillMode !== 'all') {
          return;
        }
        if (!r.used) {
          r.used = 'primaryOnly';
        } else {
          r.used = 'primary';
        }
        return util.fillRegions(regions, rid, function(rid2, trace) {
          r = regions[rid2];
          r.used || (r.used = 'transitive');
          return true;
        });
      };
      switch (opts.fillMode) {
        case 'all':
          for (rid = _i = 0, _ref1 = regions.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; rid = 0 <= _ref1 ? ++_i : --_i) {
            fillFromRegion(rid);
          }
          break;
        case 'shuttles':
          for (_j = 0, _len = shuttles.length; _j < _len; _j++) {
            s = shuttles[_j];
            _ref2 = s.pushedBy;
            for (_k = 0, _len1 = _ref2.length; _k < _len1; _k++) {
              k = _ref2[_k];
              fillFromRegion(k.rid);
            }
            _ref3 = s.states;
            for (_l = 0, _len2 = _ref3.length; _l < _len2; _l++) {
              state = _ref3[_l];
              _ref4 = state.pushedBy;
              for (_m = 0, _len3 = _ref4.length; _m < _len3; _m++) {
                k = _ref4[_m];
                fillFromRegion(k.rid);
              }
            }
          }
          break;
        case 'engines':
          for (_n = 0, _len4 = engines.length; _n < _len4; _n++) {
            e = engines[_n];
            _ref5 = e.regions;
            for (_o = 0, _len5 = _ref5.length; _o < _len5; _o++) {
              rid = _ref5[_o];
              fillFromRegion(rid);
            }
          }
          break;
        default:
          throw Error("Invalid fillMode " + opts.fillMode);
      }
      for (_p = 0, _len6 = regions.length; _p < _len6; _p++) {
        r = regions[_p];
        numConnections = util.numKeys(r.connections);
        r.inline = (function() {
          switch (r.used) {
            case 'primaryOnly':
              return true;
            case 'primary':
              return numConnections <= 1;
            case 'transitive':
              return numConnections <= 2;
            default:
              return false;
          }
        })();
      }
      for (rid = _q = 0, _len7 = regions.length; _q < _len7; rid = ++_q) {
        r = regions[rid];
        if (!(r.used && !r.inline)) {
          continue;
        }
        W("function calc" + rid + "(z) {");
        W.block(function() {
          return emitRegionCalcBody(W, parserData, rid, nonExclusiveMap, {
            zoneIdxExpr: 'z - base'
          });
        });
        W("}");
      }
      return W();
    })();
    (function() {
      W("function calcPressure() {");
      W.block(function() {
        var alreadyZoned, r, rid, varzSet, wasCalculated, zoneIdx, zoneIdxExpr, _i, _len, _ref1, _results;
        W("base = extent;");
        alreadyZoned = new Array(regions.length);
        zoneIdx = 0;
        varzSet = false;
        wasCalculated = {};
        _results = [];
        for (rid = _i = 0, _len = regions.length; _i < _len; rid = ++_i) {
          r = regions[rid];
          if (!((_ref1 = r.used) === 'primary' || _ref1 === 'primaryOnly')) {
            continue;
          }
          W("// Calculating zone for region " + rid);
          if (r.used === 'primary') {
            zoneIdx = -1;
            W("if (regionZone[" + rid + "] < base) {");
            W.indentation++;
          }
          zoneIdxExpr = zoneIdx === -1 ? r.inline ? "z - base" : "extent - base" : "" + (zoneIdx++);
          if (r.inline) {
            if (!varzSet) {
              W("var z;");
              varzSet = true;
            }
            W("z = extent++;");
            emitRegionCalcBody(W, parserData, rid, nonExclusiveMap, {
              zoneIdxExpr: zoneIdxExpr,
              setBasePressure: true,
              wasCalculated: wasCalculated
            });
          } else {
            W("zonePressure[" + zoneIdxExpr + "] = 0;");
            W("calc" + rid + "(extent++);");
          }
          if (r.used === 'primary') {
            W.indentation--;
            W("}");
            _results.push(W());
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      });
      W("}");
      return W();
    })();
    (function() {
      W("function updateShuttles() {");
      W.block(function() {
        var d, isForce, isXForce, isYForce, s, sid, successorPtr, _i, _len, _results;
        W("// *** Calculating forces & updating shuttle states");
        if (successorPtrs) {
          W("var force, state, successor, z;");
        } else {
          W("var force, state, z;");
        }
        _results = [];
        for (sid = _i = 0, _len = shuttles.length; _i < _len; sid = ++_i) {
          s = shuttles[sid];
          if (!s.immobile) {
            switch (s.type) {
              case 'switch':
              case 'track':
                _results.push((function() {
                  var _j, _len1, _ref1, _results1;
                  _ref1 = ['x', 'y'];
                  _results1 = [];
                  for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
                    d = _ref1[_j];
                    if (!s.moves[d]) {
                      continue;
                    }
                    isForce = emitForceExpr(W, parserData, opts, sid, s, d);
                    if (!isForce) {
                      continue;
                    }
                    if (s.type === 'switch') {
                      _results1.push(W("if (force) shuttleState[" + sid + "] = force < 0 ? 0 : 1;"));
                    } else if (s.type === 'track') {
                      W("if (force < 0 && state > 0) --shuttleState[" + sid + "];");
                      _results1.push(W("else if (force > 0 && state < " + (s.states.length - 1) + ") ++shuttleState[" + sid + "];"));
                    } else {
                      _results1.push(void 0);
                    }
                  }
                  return _results1;
                })());
                break;
              case 'statemachine':
                W("// Y direction:");
                isYForce = emitForceExpr(W, parserData, opts, sid, s, 'y');
                successorPtr = successorPtrs[sid];
                if (isYForce) {
                  W("successor = force === 0 ? state : successors[(force > 0 ? " + (1 + successorPtr) + " : " + successorPtr + ") + 4 * state];");
                  W("if (successor === state) {");
                  W.indentation++;
                }
                W("// X direction:");
                isXForce = emitForceExpr(W, parserData, opts, sid, s, 'x');
                if (isXForce) {
                  W("successor = force === 0 ? state : successors[(force > 0 ? " + (3 + successorPtr) + " : " + (2 + successorPtr) + ") + 4 * state];");
                }
                if (isYForce) {
                  W.indentation--;
                  W("}");
                }
                if (isXForce || isYForce) {
                  _results.push(W("shuttleState[" + sid + "] = successor;"));
                } else {
                  _results.push(void 0);
                }
                break;
              default:
                _results.push(void 0);
            }
          }
        }
        return _results;
      });
      return W("}\n");
    })();
    if (opts.module === 'node') {
      W("module.exports = {");
    } else {
      W("return {");
    }
    if (opts.extraFns) {
      W("getPressure:getPressure, getZone: getZone, ");
    }
    W("  states:shuttleState, step:step, calcPressure:calcPressure, updateShuttles:updateShuttles");
    W("};");
    W();
    if (opts.module !== 'bare') {
      W("})();");
    }
    if (stream !== process.stdout) {
      return stream.end();
    }
  };

  if (require.main === module) {
    parseFile = require('./parser').parseFile;
    filename = process.argv[2];
    if (!filename) {
      throw 'Missing file argument';
    }
    data = parseFile(filename);
    gen(data, process.stdout, {
      module: 'node',
      extraFns: true,
      fillMode: 'all'
    });
  }

}).call(this);

//# sourceMappingURL=js-codegen.js.map

}).call(this,require('_process'))
},{"./parser":"/Users/josephg/src/b/boilerplate/node_modules/boilerplate-compiler/parser.js","./util":"/Users/josephg/src/b/boilerplate/node_modules/boilerplate-compiler/util.js","_process":"/usr/local/share/npm/lib/node_modules/watchify/node_modules/browserify/node_modules/process/browser.js"}],"/Users/josephg/src/b/boilerplate/node_modules/boilerplate-compiler/parser.js":[function(require,module,exports){
(function (process){
// Generated by CoffeeScript 1.8.0
(function() {
  var Parser, c, data, dirs, edges, filename, fill, fillRegions, graphFile, gridExtents, k, numKeys, numericSort, parse, parseFile, parseXY, printEdges, printGrid, r, regions, rid, s, shuttles, sid, sortedKeys, state, util, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2, _ref3;

  _ref = util = require('./util'), parseXY = _ref.parseXY, numKeys = _ref.numKeys, fill = _ref.fill, fillRegions = _ref.fillRegions, gridExtents = _ref.gridExtents, printGrid = _ref.printGrid, printEdges = _ref.printEdges;

  dirs = {
    up: {
      dx: 0,
      dy: -1
    },
    right: {
      dx: 1,
      dy: 0
    },
    down: {
      dx: 0,
      dy: 1
    },
    left: {
      dx: -1,
      dy: 0
    }
  };

  edges = [
    {
      ex: 0,
      ey: 0,
      isTop: false,
      dx: -1,
      dy: 0
    }, {
      ex: 0,
      ey: 0,
      isTop: true,
      dx: 0,
      dy: -1
    }, {
      ex: 1,
      ey: 0,
      isTop: false,
      dx: 1,
      dy: 0
    }, {
      ex: 0,
      ey: 1,
      isTop: true,
      dx: 0,
      dy: 1
    }
  ];

  numericSort = function(a, b) {
    return (a | 0) - (b | 0);
  };

  sortedKeys = function(obj, fn) {
    if (fn == null) {
      fn = numericSort;
    }
    return Object.keys(obj).sort(fn);
  };

  Parser = (function() {
    function Parser(grid) {
      this.grid = grid;
      this.shuttleGrid = {};
      this.engineGrid = {};
      this.edgeGrid = {};
      this.regionGrid = {};
      this.shuttles = [];
      this.regions = [];
      this.engines = [];
    }

    Parser.prototype.get = function(x, y) {
      return this.grid["" + x + "," + y];
    };

    Parser.prototype.printPoint = function(x, y) {
      this.extents || (this.extents = gridExtents(this.grid));
      return util.printPoint(this.extents, this.grid, x, y);
    };

    Parser.prototype.parse = function(opts) {
      var e, s, sid, _i, _j, _len, _len1, _ref1, _ref2;
      this.opts = opts != null ? opts : {};
      this.debug || (this.debug = this.opts.debug);
      this.opts.expensiveOptimizations = true;
      if (this.opts.debug) {
        this.extents = gridExtents(this.grid);
        printGrid(this.extents, this.grid);
      }
      this.annotateGrid();
      _ref1 = this.shuttles;
      for (sid = _i = 0, _len = _ref1.length; _i < _len; sid = ++_i) {
        s = _ref1[sid];
        if (!s.immobile) {
          this.findShuttleStates(s, sid);
        }
      }
      this.fillRegions();
      this.findRegionConnectionsAndShuttleForce();
      this.findNeutralRegions();
      this.cleanShuttlePush();
      _ref2 = this.engines;
      for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
        e = _ref2[_j];
        this.calculateEngineExclusivity(e);
      }
      if (this.debug) {
        return printEdges(this.extents, this.grid, this.edgeGrid);
      }
    };

    Parser.prototype.annotateGrid = function() {
      var id, k, pressure, s, v, x, y, _ref1, _ref2, _results;
      _ref1 = this.grid;
      _results = [];
      for (k in _ref1) {
        v = _ref1[k];
        if (!(k !== 'tw' && k !== 'th')) {
          continue;
        }
        _ref2 = parseXY(k), x = _ref2.x, y = _ref2.y;
        switch (v) {
          case 'positive':
          case 'negative':
            id = this.engines.length;
            pressure = v === 'positive' ? 1 : -1;
            this.engines.push({
              x: x,
              y: y,
              pressure: pressure,
              regions: []
            });
            _results.push(this.engineGrid["" + x + "," + y] = id);
            break;
          case 'shuttle':
          case 'thinshuttle':
            if (this.shuttleGrid["" + x + "," + y] != null) {
              continue;
            }
            id = this.shuttles.length;
            this.shuttles.push(s = {
              points: {},
              fill: {},
              states: [],
              adjacentTo: {},
              moves: {
                x: false,
                y: false
              },
              immobile: v === 'thinshuttle',
              pushedBy: []
            });
            _results.push(fill({
              x: x,
              y: y
            }, (function(_this) {
              return function(x, y) {
                v = _this.get(x, y);
                if (v === 'shuttle' || v === 'thinshuttle') {
                  if (s.immobile && _this.get(x, y) === 'shuttle') {
                    s.immobile = false;
                  }
                  _this.shuttleGrid["" + x + "," + y] = id;
                  s.points["" + x + "," + y] = v;
                  return true;
                } else {
                  return false;
                }
              };
            })(this)));
            break;
          default:
            _results.push(void 0);
        }
      }
      return _results;
    };

    Parser.prototype.findShuttleStates = function(s, sid) {
      var ds, dx, dy, extents, f, i, k, state, stateGrid, stateid, v, x, y, _base, _i, _len, _ref1, _ref2, _ref3, _x, _y;
      extents = null;
      fill({
        x: 0,
        y: 0
      }, (function(_this) {
        return function(dx, dy) {
          var k, otherSid, x, y, _ref1, _ref2;
          for (k in s.points) {
            _ref1 = parseXY(k), x = _ref1.x, y = _ref1.y;
            k = "" + (x + dx) + "," + (y + dy);
            otherSid = _this.shuttleGrid[k];
            if ((otherSid != null) && otherSid !== sid) {
              console.warn("Potentially overlapping shuttles at " + k);
              return false;
            }
            if ((_ref2 = _this.grid[k]) !== 'nothing' && _ref2 !== 'shuttle' && _ref2 !== 'thinshuttle') {
              return false;
            }
          }
          s.states.push({
            dx: dx,
            dy: dy,
            pushedBy: [],
            tempPushedBy: {}
          });
          if (dx) {
            s.moves.x = true;
          }
          if (dy) {
            s.moves.y = true;
          }
          return true;
        };
      })(this));
      s.states.sort(function(a, b) {
        if (a.dy !== b.dy) {
          return a.dy - b.dy;
        } else {
          return a.dx - b.dx;
        }
      });
      _ref1 = s.states;
      for (stateid = _i = 0, _len = _ref1.length; _i < _len; stateid = ++_i) {
        state = _ref1[stateid];
        dx = state.dx, dy = state.dy;
        if (dx === 0 && dy === 0) {
          s.initial = stateid;
        }
        _ref2 = s.points;
        for (k in _ref2) {
          v = _ref2[k];
          _ref3 = parseXY(k), x = _ref3.x, y = _ref3.y;
          _x = x + dx;
          _y = y + dy;
          k = "" + _x + "," + _y;
          this.shuttleGrid[k] = sid;
          if (v === 'shuttle') {
            f = ((_base = s.fill)[k] != null ? _base[k] : _base[k] = []);
            f[stateid] = true;
          }
        }
      }
      return s.type = (function() {
        var _j, _k, _len1, _len2, _ref4, _ref5, _ref6;
        if (s.states.length === 1) {
          s.immobile = true;
          return 'immobile';
        } else if (s.states.length === 2) {
          s.direction = s.moves.x ? 'x' : 'y';
          return 'switch';
        } else if (!s.moves.x || !s.moves.y) {
          s.direction = s.moves.x ? 'x' : 'y';
          return 'track';
        } else {
          stateGrid = {};
          _ref4 = s.states;
          for (stateid = _j = 0, _len1 = _ref4.length; _j < _len1; stateid = ++_j) {
            _ref5 = _ref4[stateid], dx = _ref5.dx, dy = _ref5.dy;
            stateGrid["" + dx + "," + dy] = stateid;
          }
          ds = [
            {
              dx: 0,
              dy: -1
            }, {
              dx: 0,
              dy: 1
            }, {
              dx: -1,
              dy: 0
            }, {
              dx: 1,
              dy: 0
            }
          ];
          _ref6 = s.states;
          for (stateid = _k = 0, _len2 = _ref6.length; _k < _len2; stateid = ++_k) {
            state = _ref6[stateid];
            state.successors = (function() {
              var _l, _len3, _ref7, _ref8, _results;
              _results = [];
              for (i = _l = 0, _len3 = ds.length; _l < _len3; i = ++_l) {
                _ref7 = ds[i], dx = _ref7.dx, dy = _ref7.dy;
                _results.push((_ref8 = stateGrid["" + (state.dx + dx) + "," + (state.dy + dy)]) != null ? _ref8 : stateid);
              }
              return _results;
            })();
          }
          return 'statemachine';
        }
      })();
    };

    Parser.prototype.makeRegionFrom = function(x, y, isTop) {
      var check, containedEngines, eid, f, hmm, i, k, n, ox, oy, pressure, r, rid, sid, to_explore, v, visited, _i, _len, _ref1;
      k = "" + x + "," + y + "," + isTop;
      rid = this.edgeGrid[k];
      if (rid !== void 0) {
        return this.regions[rid];
      }
      rid = this.regions.length;
      this.regions.push(r = {
        engines: [],
        connections: {},
        size: 0,
        tempEdges: [],
        pressure: 0,
        neutral: true
      });
      to_explore = [];
      visited = {};
      containedEngines = {};
      hmm = (function(_this) {
        return function(x, y, isTop) {
          k = "" + x + "," + y + "," + isTop;
          if (visited[k] === void 0 && _this.edgeGrid[k] === void 0) {
            visited[k] = _this.edgeGrid[k] = rid;
            return to_explore.push({
              x: x,
              y: y,
              isTop: isTop
            });
          }
        };
      })(this);
      hmm(x, y, isTop);
      while (n = to_explore.shift()) {
        x = n.x, y = n.y, isTop = n.isTop;
        check = isTop ? [
          {
            x: x,
            y: y - 1,
            ox: x,
            oy: y - 1,
            f: dirs.up
          }, {
            x: x,
            y: y,
            ox: x,
            oy: y + 1,
            f: dirs.down
          }
        ] : [
          {
            x: x - 1,
            y: y,
            ox: x - 1,
            oy: y,
            f: dirs.left
          }, {
            x: x,
            y: y,
            ox: x + 1,
            oy: y,
            f: dirs.right
          }
        ];
        for (i = _i = 0, _len = check.length; _i < _len; i = ++_i) {
          _ref1 = check[i], x = _ref1.x, y = _ref1.y, ox = _ref1.ox, oy = _ref1.oy, f = _ref1.f;
          k = "" + x + "," + y;
          sid = this.shuttleGrid[k];
          v = this.grid[k];
          if (sid !== void 0) {
            r.tempEdges.push({
              x: x,
              y: y,
              sid: sid,
              f: f
            });
            continue;
          }
          if (v === 'nothing' || v === 'thinsolid' || v === 'thinshuttle' || v === 'bridge') {
            this.regionGrid[k] = rid;
          }
          switch (v) {
            case 'bridge':
              r.size++;
              hmm(ox, oy, isTop);
              break;
            case 'nothing':
            case 'thinsolid':
            case 'thinshuttle':
              r.size++;
              hmm(x, y, true);
              hmm(x, y, false);
              hmm(x, y + 1, true);
              hmm(x + 1, y, false);
              break;
            case 'positive':
            case 'negative':
              containedEngines[this.engineGrid["" + x + "," + y]] = v === 'positive' ? 1 : -1;
          }
        }
      }
      for (eid in containedEngines) {
        pressure = containedEngines[eid];
        eid = eid | 0;
        r.engines.push(eid);
        r.pressure += pressure;
        this.engines[eid].regions.push(rid);
      }
      return r;
    };

    Parser.prototype.fillRegions = function() {
      var dx, dy, ex, ey, isTop, k, letsAirThrough, sid, v, x, y, _ref1, _ref2, _results;
      _ref1 = this.grid;
      _results = [];
      for (k in _ref1) {
        v = _ref1[k];
        _ref2 = parseXY(k), x = _ref2.x, y = _ref2.y;
        sid = this.shuttleGrid[k];
        if (sid !== void 0) {
          continue;
        }
        letsAirThrough = {
          nothing: true,
          thinsolid: true,
          bridge: true,
          thinshuttle: true
        };
        _results.push((function() {
          var _i, _len, _ref3, _results1;
          _results1 = [];
          for (_i = 0, _len = edges.length; _i < _len; _i++) {
            _ref3 = edges[_i], ex = _ref3.ex, ey = _ref3.ey, isTop = _ref3.isTop, dx = _ref3.dx, dy = _ref3.dy;
            if (letsAirThrough[v] || letsAirThrough[this.get(x + dx, y + dy)] || this.shuttleGrid["" + (x + dx) + "," + (y + dy)] !== void 0) {
              _results1.push(this.makeRegionFrom(x + ex, y + ey, isTop));
            }
          }
          return _results1;
        }).call(this));
      }
      return _results;
    };

    Parser.prototype.addConnection = function(rid1, rid2, sid, stateid) {
      var c, numStates, r, _base, _name;
      r = this.regions[rid1];
      numStates = this.shuttles[sid].states.length;
      c = ((_base = r.connections)[_name = "" + rid2 + "," + sid] || (_base[_name] = {
        rid: rid2,
        sid: sid,
        inStates: new Array(numStates)
      }));
      return c.inStates[stateid] = true;
    };

    Parser.prototype.findRegionConnectionsAndShuttleForce = function() {
      var e, f, filledStates, push, r, rid, s, sid, state, stateid, x, y, _base, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref1, _ref2, _ref3, _ref4;
      _ref1 = this.regions;
      for (rid = _i = 0, _len = _ref1.length; _i < _len; rid = ++_i) {
        r = _ref1[rid];
        _ref2 = r.tempEdges;
        for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
          e = _ref2[_j];
          x = e.x, y = e.y, sid = e.sid, f = e.f;
          s = this.shuttles[sid];
          if (this.debug) {
            console.log("temp edge at region " + rid + " shuttle " + sid + " (" + x + "," + y + ") force " + (JSON.stringify(f)));
            this.printPoint(x, y);
          }
          _ref3 = s.states;
          for (stateid = _k = 0, _len2 = _ref3.length; _k < _len2; stateid = ++_k) {
            state = _ref3[stateid];
            filledStates = s.fill["" + x + "," + y];
            push = ((_base = state.tempPushedBy)[rid] || (_base[rid] = {
              mx: 0,
              my: 0
            }));
            if (filledStates && filledStates[stateid]) {
              if (this.debug) {
                console.log('outside push', x, y, f);
              }
              push.mx += f.dx;
              push.my += f.dy;
            } else {
              fill(e, (function(_this) {
                return function(x, y, hmm) {
                  var adjList, dx, dy, ex, ey, isTop, k, rid2, _base1, _l, _len3, _name, _ref4, _ref5;
                  k = "" + x + "," + y;
                  if (_this.shuttleGrid[k] !== sid) {
                    return false;
                  }
                  filledStates = s.fill[k];
                  if (filledStates && filledStates[stateid]) {
                    return false;
                  }
                  adjList = ((_base1 = s.adjacentTo)[_name = "" + x + "," + y] || (_base1[_name] = []));
                  if (adjList[stateid] != null) {
                    return false;
                  }
                  if (_this.debug) {
                    console.log("claiming " + x + "," + y + " for state " + stateid + " in adjacency list with region " + rid);
                    _this.printPoint(x, y);
                  }
                  adjList[stateid] = rid;
                  for (_l = 0, _len3 = edges.length; _l < _len3; _l++) {
                    _ref4 = edges[_l], ex = _ref4.ex, ey = _ref4.ey, isTop = _ref4.isTop, dx = _ref4.dx, dy = _ref4.dy;
                    rid2 = _this.edgeGrid["" + (x + ex) + "," + (y + ey) + "," + isTop];
                    if (rid2 !== void 0 && rid2 !== rid) {
                      _this.addConnection(rid, rid2, sid, stateid);
                      _this.addConnection(rid2, rid, sid, stateid);
                    }
                    if ((_ref5 = s.fill["" + (x + dx) + "," + (y + dy)]) != null ? _ref5[stateid] : void 0) {
                      if (_this.debug) {
                        console.log('inside push', x, y, {
                          dx: dx,
                          dy: dy
                        });
                      }
                      push.mx += dx;
                      push.my += dy;
                    }
                  }
                  return true;
                };
              })(this));
            }
          }
        }
        delete r.tempEdges;
      }
      if (this.opts.debug) {
        _ref4 = this.shuttles;
        for (sid = _l = 0, _len3 = _ref4.length; _l < _len3; sid = ++_l) {
          s = _ref4[sid];
          console.log("shuttle " + sid);
          console.log('adj', s.adjacentTo);
        }
      }

      /*
          for state,stateid in s.states
            util.moveShuttle @grid, @shuttles, sid, s.initial, stateid
            console.log "state #{stateid}"
            util.printCustomGrid @extents, (x, y) =>
              adjList = s.adjacentTo[[x,y]] || []
              adjList[stateid] ? @grid[[x,y]]
            util.moveShuttle @grid, @shuttles, sid, stateid, s.initial
      
      if @opts.debug
        for s,sid in @shuttles
          console.log 'adj', sid
          console.log s.adjacentTo
      
        for r,rid in @regions
          console.log 'region', rid
          console.log 'c', c.rid, c.stateid for k,c of r.connections
       */
    };

    Parser.prototype.findNeutralRegions = function() {
      var e, r, rid, _i, _j, _k, _len, _len1, _len2, _ref1, _ref2, _ref3, _results;
      _ref1 = this.engines;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        e = _ref1[_i];
        _ref2 = e.regions;
        for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
          rid = _ref2[_j];
          fillRegions(this.regions, rid, (function(_this) {
            return function(rid2, trace) {
              var r;
              r = _this.regions[rid2];
              r.neutral = false;
              return true;
            };
          })(this));
        }
      }
      if (this.opts.debug) {
        _ref3 = this.regions;
        _results = [];
        for (rid = _k = 0, _len2 = _ref3.length; _k < _len2; rid = ++_k) {
          r = _ref3[rid];
          if (r.neutral) {
            _results.push(console.log("region " + rid + " neutral"));
          }
        }
        return _results;
      }
    };

    Parser.prototype.cleanShuttlePush = function() {
      var firstPushedBy, movesx, movesy, mx, my, push, pushed, rid, shared, shuttle, state, stateid, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _m, _n, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
      _ref1 = this.shuttles;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        shuttle = _ref1[_i];
        if (!(!shuttle.immobile)) {
          continue;
        }
        _ref2 = shuttle.moves, movesx = _ref2.x, movesy = _ref2.y;
        firstPushedBy = shuttle.states[0].tempPushedBy;
        _ref3 = sortedKeys(firstPushedBy);
        for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
          rid = _ref3[_j];
          if (!(!this.regions[rid].neutral)) {
            continue;
          }
          _ref4 = firstPushedBy[rid], mx = _ref4.mx, my = _ref4.my;
          if (!((mx && movesx) || (my && movesy))) {
            continue;
          }
          shared = true;
          _ref5 = shuttle.states.slice(1);
          for (stateid = _k = 0, _len2 = _ref5.length; _k < _len2; stateid = ++_k) {
            state = _ref5[stateid];
            if (!(shared)) {
              continue;
            }
            push = state.tempPushedBy[rid];
            if (push) {
              if (movesx && push.mx !== mx) {
                shared = false;
              }
              if (movesy && push.my !== my) {
                shared = false;
              }
            } else {
              shared = false;
            }
          }
          if (shared) {
            pushed = {
              rid: +rid
            };
            if (movesx) {
              pushed.mx = mx;
            }
            if (movesy) {
              pushed.my = my;
            }
            shuttle.pushedBy.push(pushed);
            _ref6 = shuttle.states;
            for (_l = 0, _len3 = _ref6.length; _l < _len3; _l++) {
              state = _ref6[_l];
              delete state.tempPushedBy[rid];
            }
          }
        }
        _ref7 = shuttle.states;
        for (_m = 0, _len4 = _ref7.length; _m < _len4; _m++) {
          state = _ref7[_m];
          _ref8 = sortedKeys(state.tempPushedBy);
          for (_n = 0, _len5 = _ref8.length; _n < _len5; _n++) {
            rid = _ref8[_n];
            if (!(!this.regions[rid].neutral)) {
              continue;
            }
            _ref9 = state.tempPushedBy[rid], mx = _ref9.mx, my = _ref9.my;
            pushed = {
              rid: +rid
            };
            if (movesx) {
              pushed.mx = mx;
            }
            if (movesy) {
              pushed.my = my;
            }
            if (pushed.mx || pushed.my) {
              state.pushedBy.push(pushed);
            }
          }
          delete state.tempPushedBy;
        }
      }
    };

    Parser.prototype.calculateEngineExclusivity = function(e) {
      var danger, rid, _i, _j, _len, _len1, _ref1, _ref2, _results;
      e.exclusive = true;
      if (e.regions.length <= 1) {
        return;
      }
      if (!this.opts.expensiveOptimizations) {
        return e.exclusive = false;
      }
      danger = {};
      _ref1 = e.regions;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        rid = _ref1[_i];
        danger[rid] = true;
      }
      _ref2 = e.regions.slice(1);
      _results = [];
      for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
        rid = _ref2[_j];
        if (e.exclusive) {
          _results.push(fillRegions(this.regions, rid, (function(_this) {
            return function(testRid, trace) {
              if (testRid !== rid && danger[testRid]) {
                e.exclusive = false;
              }
              return e.exclusive;
            };
          })(this)));
        }
      }
      return _results;
    };

    return Parser;

  })();

  parse = exports.parse = function(grid, opts) {
    var parser;
    parser = new Parser(grid);
    parser.parse(opts);
    return parser;
  };

  parseFile = exports.parseFile = function(filename, opts) {
    var data, fs;
    fs = require('fs');
    data = JSON.parse(fs.readFileSync(filename, 'utf8').split('\n')[0]);
    delete data.tw;
    delete data.th;
    return parse(data, opts);
  };

  if (require.main === module) {
    filename = process.argv[2];
    if (!filename) {
      throw Error('Missing file argument');
    }
    _ref1 = data = parseFile(filename, {
      debug: true
    }), shuttles = _ref1.shuttles, regions = _ref1.regions;
    for (sid = _i = 0, _len = shuttles.length; _i < _len; sid = ++_i) {
      s = shuttles[sid];
      console.log("shuttle " + sid + " (" + s.type + "):");
      console.log('pushedby', s.pushedBy);
      _ref2 = s.states;
      for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
        state = _ref2[_j];
        console.log(state);
      }
    }
    console.log();
    for (rid = _k = 0, _len2 = regions.length; _k < _len2; rid = ++_k) {
      r = regions[rid];
      console.log("region " + rid);
      console.log(r);
      _ref3 = r.connections;
      for (k in _ref3) {
        c = _ref3[k];
        console.log(c);
      }
    }
    graphFile = filename.split('.')[0] + '.svg';
    util.drawRegionGraph(data, graphFile);
  }

}).call(this);

//# sourceMappingURL=parser.js.map

}).call(this,require('_process'))
},{"./util":"/Users/josephg/src/b/boilerplate/node_modules/boilerplate-compiler/util.js","_process":"/usr/local/share/npm/lib/node_modules/watchify/node_modules/browserify/node_modules/process/browser.js","fs":"/usr/local/share/npm/lib/node_modules/watchify/node_modules/browserify/lib/_empty.js"}],"/Users/josephg/src/b/boilerplate/node_modules/boilerplate-compiler/util.js":[function(require,module,exports){
(function (process){
// Generated by CoffeeScript 1.8.0
(function() {
  var chars, intersectListOrNull, numKeys, parseXY, printCustomGrid,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  chars = {
    positive: '+',
    negative: '-',
    nothing: ' ',
    thinsolid: 'x',
    shuttle: 'S',
    thinshuttle: 's',
    bridge: 'b'
  };

  parseXY = exports.parseXY = function(k) {
    var x, y, _ref;
    _ref = k.split(','), x = _ref[0], y = _ref[1];
    return {
      x: x | 0,
      y: y | 0
    };
  };

  numKeys = exports.numKeys = function(obj) {
    var k, num;
    num = 0;
    for (k in obj) {
      num++;
    }
    return num;
  };

  exports.fill = function(initial_square, f) {
    var hmm, n, ok, to_explore, visited;
    visited = {};
    visited["" + initial_square.x + "," + initial_square.y] = true;
    to_explore = [initial_square];
    hmm = function(x, y) {
      var k;
      k = "" + x + "," + y;
      if (!visited[k]) {
        visited[k] = true;
        return to_explore.push({
          x: x,
          y: y
        });
      }
    };
    while (n = to_explore.shift()) {
      ok = f(n.x, n.y, hmm);
      if (ok) {
        hmm(n.x + 1, n.y);
        hmm(n.x - 1, n.y);
        hmm(n.x, n.y + 1);
        hmm(n.x, n.y - 1);
      }
    }
  };

  intersectListOrNull = function(list1, list2) {
    var i, intersection, s, _i, _len;
    intersection = null;
    for (i = _i = 0, _len = list1.length; _i < _len; i = ++_i) {
      s = list1[i];
      if (!(s && list2[i])) {
        continue;
      }
      intersection || (intersection = []);
      intersection[i] = true;
    }
    return intersection;
  };

  exports.fillRegions = function(regions, initialRid, f) {
    var expand;
    expand = (function(_this) {
      return function(rid, trace) {
        var inStates, intersect, k, nextRid, prevStates, region, shouldExpand, sid, _ref, _ref1, _results;
        region = regions[rid];
        shouldExpand = f(rid, trace);
        if (!shouldExpand) {
          return;
        }
        _ref = region.connections;
        _results = [];
        for (k in _ref) {
          _ref1 = _ref[k], nextRid = _ref1.rid, sid = _ref1.sid, inStates = _ref1.inStates;
          if (__indexOf.call(trace.path, nextRid) >= 0) {
            continue;
          }
          prevStates = trace.shuttleStates[sid];
          if (!prevStates) {
            trace.shuttleStates[sid] = inStates;
          } else {
            intersect = intersectListOrNull(prevStates, inStates);
            if (!intersect) {
              continue;
            }
            trace.shuttleStates[sid] = intersect;
          }
          trace.path.push(nextRid);
          expand(nextRid, trace);
          trace.path.pop();
          if (!prevStates) {
            _results.push(delete trace.shuttleStates[sid]);
          } else {
            _results.push(trace.shuttleStates[sid] = prevStates);
          }
        }
        return _results;
      };
    })(this);
    return expand(initialRid, {
      path: [initialRid],
      shuttleStates: {}
    });
  };

  exports.gridExtents = function(grid) {
    var bottom, k, left, right, top, v, x, y, _ref;
    top = left = bottom = right = null;
    for (k in grid) {
      v = grid[k];
      _ref = parseXY(k), x = _ref.x, y = _ref.y;
      if (left === null || x < left) {
        left = x;
      }
      if (right === null || x > right) {
        right = x;
      }
      if (top === null || y < top) {
        top = y;
      }
      if (bottom === null || y > bottom) {
        bottom = y;
      }
    }
    return {
      top: top,
      left: left,
      bottom: bottom,
      right: right
    };
  };

  exports.printCustomGrid = printCustomGrid = function(_arg, getFn, stream) {
    var bottom, left, right, top, v, x, y, _i, _j, _ref, _ref1, _ref2, _ref3, _results;
    top = _arg.top, left = _arg.left, bottom = _arg.bottom, right = _arg.right;
    if (stream == null) {
      stream = process.stdout;
    }
    _results = [];
    for (y = _i = _ref = top - 1, _ref1 = bottom + 1; _ref <= _ref1 ? _i <= _ref1 : _i >= _ref1; y = _ref <= _ref1 ? ++_i : --_i) {
      stream.write('');
      for (x = _j = _ref2 = left - 1, _ref3 = right + 1; _ref2 <= _ref3 ? _j <= _ref3 : _j >= _ref3; x = _ref2 <= _ref3 ? ++_j : --_j) {
        v = getFn(x, y);
        stream.write(chars[v] || (v != null ? ("" + v)[0] : ';'));
      }
      _results.push(stream.write('\n'));
    }
    return _results;
  };

  exports.printGrid = function(extents, grid, stream) {
    if (stream == null) {
      stream = process.stdout;
    }
    return printCustomGrid(extents, (function(x, y) {
      return grid[[x, y]];
    }), stream);
  };

  exports.printPoint = function(extents, grid, px, py) {
    var get;
    get = function(x, y) {
      if (x === px && y === py) {
        return '%';
      } else {
        return grid[[x, y]];
      }
    };
    return printCustomGrid(extents, get);
  };

  exports.printEdges = function(_arg, grid, edgeGrid, stream) {
    var bottom, edgeChar, left, right, top, x, y, _i, _j, _k, _ref, _ref1;
    top = _arg.top, left = _arg.left, bottom = _arg.bottom, right = _arg.right;
    if (stream == null) {
      stream = process.stdout;
    }
    edgeChar = function(x, y, isTop) {
      var e;
      e = edgeGrid["" + x + "," + y + "," + isTop];
      if (e != null) {
        return e % 10;
      } else {
        return ' ';
      }
    };
    for (y = _i = top, _ref = bottom + 1; top <= _ref ? _i <= _ref : _i >= _ref; y = top <= _ref ? ++_i : --_i) {
      for (x = _j = left; left <= right ? _j <= right : _j >= right; x = left <= right ? ++_j : --_j) {
        stream.write(" " + (edgeChar(x, y, true)));
      }
      stream.write('\n');
      if (y <= bottom) {
        for (x = _k = left, _ref1 = right + 1; left <= _ref1 ? _k <= _ref1 : _k >= _ref1; x = left <= _ref1 ? ++_k : --_k) {
          stream.write("" + (edgeChar(x, y, false)));
          if (x <= right) {
            stream.write(chars[grid[[x, y]]] || ';');
          }
        }
        stream.write('\n');
      }
    }
    return stream.write('\n');
  };

  exports.drawRegionGraph = function(parserData, filename) {
    var addEdge, addRegion, allowedStates, c, drawnRegions, edge, edges, g, k, node, p, r, regions, rid, s, shuttles, sid, state, stateList, stateid, v, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _len6, _m, _n, _o, _ref, _ref1, _ref2, _ref3, _ref4;
    shuttles = parserData.shuttles, regions = parserData.regions;
    g = require('graphviz').graph('regions');
    g.set('layout', 'fdp');
    g.set('K', '1.1');
    drawnRegions = {};
    addRegion = function(rid) {
      var color, label, node, r;
      r = regions[rid];
      if (drawnRegions[rid]) {
        return;
      }
      drawnRegions[rid] = true;
      color = void 0;
      label = "r" + rid;
      if (r.pressure > 0) {
        label += "(+" + r.pressure + ")";
        color = 'green';
      } else if (r.pressure < 0) {
        label += "(" + r.pressure + ")";
        color = 'red';
      }
      node = g.addNode("r" + rid, {
        shape: 'box',
        color: color
      });
      return node.set('label', label);
    };
    for (rid = _i = 0, _len = regions.length; _i < _len; rid = ++_i) {
      r = regions[rid];
      if (numKeys(r.connections)) {
        addRegion(rid);
      }
    }
    for (sid = _j = 0, _len1 = shuttles.length; _j < _len1; sid = ++_j) {
      s = shuttles[sid];
      node = g.addNode("s" + sid, {
        shape: 'oval',
        style: 'filled',
        fillcolor: 'plum1'
      });
      node.set('label', "S" + sid + " " + s.type);
      edges = {};
      addEdge = function(_arg) {
        var color, edge, mx, my, pressure, rid;
        rid = _arg.rid, mx = _arg.mx, my = _arg.my;
        edge = edges[rid];
        if (edge) {
          return edge;
        }
        addRegion(rid);
        pressure = (mx || 0) + (my || 0);
        color = pressure < 0 ? 'red' : pressure > 0 ? 'green' : 'black';
        edges[rid] = edge = g.addEdge("r" + rid, "s" + sid);
        edge.set('color', color);
        edge.set('penwidth', 2);
        edge.set("dir", "forward");
        return edge;
      };
      _ref = s.pushedBy;
      for (_k = 0, _len2 = _ref.length; _k < _len2; _k++) {
        p = _ref[_k];
        addEdge(p);
      }
      _ref1 = s.states;
      for (stateid = _l = 0, _len3 = _ref1.length; _l < _len3; stateid = ++_l) {
        state = _ref1[stateid];
        _ref2 = state.pushedBy;
        for (_m = 0, _len4 = _ref2.length; _m < _len4; _m++) {
          p = _ref2[_m];
          edge = addEdge(p);
        }
      }
    }
    for (rid = _n = 0, _len5 = regions.length; _n < _len5; rid = ++_n) {
      r = regions[rid];
      if (numKeys(r.connections)) {
        _ref3 = r.connections;
        for (k in _ref3) {
          c = _ref3[k];
          if (!(c.rid > rid)) {
            continue;
          }
          edge = g.addEdge("r" + rid, "r" + c.rid);
          allowedStates = [];
          _ref4 = c.inStates;
          for (stateid = _o = 0, _len6 = _ref4.length; _o < _len6; stateid = ++_o) {
            v = _ref4[stateid];
            if (v) {
              allowedStates.push(stateid);
            }
          }
          stateList = allowedStates.length <= 3 ? " (" + (allowedStates.join(',')) + ")" : "x" + allowedStates.length;
          edge.set('label', "S" + c.sid + stateList);
        }
      }
    }
    g.output(filename.split('.')[1], filename);
    return console.log("generated " + filename);
  };

  exports.moveShuttle = function(grid, shuttles, sid, from, to) {
    var dx, dy, k, s, v, x, y, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _results;
    if (from === to) {
      return;
    }
    s = shuttles[sid];
    _ref = s.states[from], dx = _ref.dx, dy = _ref.dy;
    _ref1 = s.points;
    for (k in _ref1) {
      v = _ref1[k];
      _ref2 = parseXY(k), x = _ref2.x, y = _ref2.y;
      k = "" + (x + dx) + "," + (y + dy);
      if (grid[k] !== v) {
        throw 'Shuttle not in state';
      }
      grid[k] = 'nothing';
    }
    _ref3 = s.states[to], dx = _ref3.dx, dy = _ref3.dy;
    _ref4 = s.points;
    _results = [];
    for (k in _ref4) {
      v = _ref4[k];
      _ref5 = parseXY(k), x = _ref5.x, y = _ref5.y;
      k = "" + (x + dx) + "," + (y + dy);
      _results.push(grid[k] = v);
    }
    return _results;
  };

}).call(this);

//# sourceMappingURL=util.js.map

}).call(this,require('_process'))
},{"_process":"/usr/local/share/npm/lib/node_modules/watchify/node_modules/browserify/node_modules/process/browser.js","graphviz":"/usr/local/share/npm/lib/node_modules/watchify/node_modules/browserify/lib/_empty.js"}],"/usr/local/share/npm/lib/node_modules/watchify/node_modules/browserify/lib/_empty.js":[function(require,module,exports){

},{}],"/usr/local/share/npm/lib/node_modules/watchify/node_modules/browserify/node_modules/process/browser.js":[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}]},{},["/Users/josephg/src/b/boilerplate/examples/compiled.coffee"]);
