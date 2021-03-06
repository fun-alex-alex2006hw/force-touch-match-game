(function ftgame() {
  'use strict';
  var context,
    touch,
    sounds = {
      'sword': {
        'src': 'sound/sword.mp3'
      },
      'swing': {
        'src': 'sound/swing.mp3'
      },
      'userhit': {
        'src': 'sound/userhit.mp3'
      },
      'enemyhit': {
        'src': 'sound/enemyhit.mp3'
      }
    },
    gamedata = {
      'points': 0,
      'gameOn': false,
      'time': 0,
      'matchValue': null,
      'monsters': ['img/devil.jpg', 'img/dragon.jpg', 'img/goblin.jpg', 'img/orc.jpg', 'img/troll.jpg'],
      'hitpoints': [50, 60, 10, 20, 30],
      'attackSpeed': [2500, 3000, 1000, 1500, 1800],
      'currentAttackSpeed': null,
      'currentHitpoint': null,
      'protection': true
    },
    game;

  try {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    context = new AudioContext();
  } catch (e) {
    throw new Error('Web Audio API not supported.');
  }

  function playSound(buffer) {
    var source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.start(0);
  }

  function loadSoundObj(obj) {
    var request = new XMLHttpRequest();
    request.open('GET', obj.src, true);
    request.responseType = 'arraybuffer';

    request.onload = function onload() {
      context.decodeAudioData(request.response, function reqload(buffer) {
        obj.buffer = buffer;
      }, function reqerr(err) {
        throw new Error(err);
      });
    };
    request.send();
  }

  game = {
    'button': document.getElementById('button'),
    'hitpoints': document.getElementById('hitpoints'),
    'points': document.getElementById('points'),
    'gameinfo': document.getElementById('game-info'),
    'matchbar': document.getElementById('match-bar'),
    'userbar': document.getElementById('user-bar'),
    'userhit': document.getElementById('status'),

    'init': function init() {
      loadSoundObj(sounds.enemyhit);
      loadSoundObj(sounds.sword);
      loadSoundObj(sounds.userhit);
      loadSoundObj(sounds.swing);

      function refreshForceValue() {
        var touchEvent = this,
          forceValue = 0;
        if (touchEvent) {
          forceValue = touchEvent.force || 0;
          setTimeout(refreshForceValue.bind(touch), 10);
        } else {
          forceValue = 0;
        }

        game.updateForce(forceValue * 3);
      }

      function getTouchForce(e) {
        if (e.target.id !== 'button') {
          e.preventDefault();
          if (e.type === 'touchstart' && game.gameOn) {
            playSound(sounds.swing.buffer);
          }
          touch = e.touches[0];
          setTimeout(refreshForceValue.bind(touch), 10);
        }
      }

      document.addEventListener('keydown', function keydown(e) {
        if (e.keyCode === 27 || e.keyCode === 83) {
          game.toggle();
        }
      });
      game.button.addEventListener('click', function gbclick() {
        game.toggle();
      });
      document.addEventListener('webkitmouseforcewillbegin', function mfwb(e) {
        e.preventDefault();
        playSound(sounds.sword.buffer);
        game.updateForce(e.webkitForce);
      });
      document.addEventListener('webkitmouseforcechanged', function wmfc(e) {
        game.updateForce(e.webkitForce);
      });
      document.addEventListener('touchstart', getTouchForce);
      document.addEventListener('touchmove', getTouchForce);
      document.addEventListener('touchend', function te() {
        touch = null;
      });
    },

    'toggle': function toggle() {
      if (game.gameOn) {
        clearInterval(game.timer);
        game.matchbar.style.height = '0px';
        game.gameOn = false;
        game.gameinfo.classList.remove('hide');
        game.button.innerHTML = 'Start';
      } else {
        playSound(sounds.sword.buffer);
        game.gameOn = true;
        game.gameinfo.classList.add('hide');
        game.button.innerHTML = 'Stop';
        game.start();
      }
    },

    'start': function start() {
      gamedata.points = 0;
      gamedata.time = 0;
      gamedata.protection = true;
      game.points.innerHTML = gamedata.points;
      game.timer = setInterval(function gt() {
        gamedata.time += 100;

        // enemy hits
        if (gamedata.points > gamedata.currentHitpoint || !gamedata.protection) {
          if (gamedata.time % gamedata.currentAttackSpeed === 0) {
            game.hit();
          }
        } else {
          if (gamedata.time % 3000 === 0) {
            game.hit();
          }
        }
      }, 100);
      game.setMatch();
    },

    'setMatch': function setMatch() {
      var random = Math.floor(Math.random() * gamedata.monsters.length),
        monster = gamedata.monsters[random];
      gamedata.currentHitpoint = gamedata.hitpoints[random];
      gamedata.currentAttackSpeed = gamedata.attackSpeed[random];
      game.hitpoints.innerHTML = gamedata.currentHitpoint;
      game.matchbar.style.background = '#000 url("' + monster + '") no-repeat center center';
      game.matchbar.style.backgroundSize = '128px';

      game.userbar.style.height = '0%';
      gamedata.time = 0;
      gamedata.matchValue = (Math.random() * (85 - 1) + 1).toFixed(0);
      game.matchbar.style.height = gamedata.matchValue + '%';
      touch = null;
    },

    'updateForce': function updateForce(force) {
      var value,
        validvalue = null,
        currentscore,
        newscore;
      if (game.gameOn) {
        value = force - 1; // normalize value from basic click
        if (value > 0) {
          validvalue = (value * 100 / 2).toFixed(0);
          game.userbar.style.height = validvalue + '%';
        } else {
          game.userbar.style.height = '0%';
        }
        if (validvalue === gamedata.matchValue) {
          game.hit(true);
          currentscore = parseInt(gamedata.points, 10);
          newscore = parseInt((10000 / gamedata.time).toFixed(0), 10);
          if (newscore > 0) {
            gamedata.points = currentscore + newscore;
          }
          if (gamedata.points > 99) {
            // removes limitation to enemy attack speed
            gamedata.protection = false;
          }
          game.points.innerHTML = gamedata.points;
          game.setMatch();
        }
      }
    },

    'hit': function hit(enemyhit) {
      var apply = null;
      if (enemyhit) {
        apply = game.matchbar;
        playSound(sounds.enemyhit.buffer);
      } else {
        apply = document.body;
        playSound(sounds.userhit.buffer);
        gamedata.points -= gamedata.currentHitpoint;
        game.points.innerHTML = gamedata.points;
        if (gamedata.points < 0) {
          game.gameOver();
        }
      }
      apply.classList.add('hit');
      setTimeout(function htimeout() {
        apply.classList.remove('hit');
      }, 200);
    },

    'gameOver': function gameOver() {
      game.gameinfo.innerHTML = '<div class="vertical-center"><h1>Game Over</h1></div>';
      game.toggle();
    }
  };
  game.init();
})();
