var Bullet = function (game, key) {

  Phaser.Sprite.call(this, game, 0, 0, key);

  this.texture.baseTexture.scaleMode = PIXI.scaleModes.NEAREST;

  this.anchor.set(0.5);

  this.checkWorldBounds = true;
  this.outOfBoundsKill = true;
  this.exists = false;

  this.tracking = false;
  this.scaleSpeed = 0;

};

Bullet.prototype = Object.create(Phaser.Sprite.prototype);
Bullet.prototype.constructor = Bullet;

Bullet.prototype.fire = function (x, y, angle, speed, gx, gy) {

  gx = gx || 0;
  gy = gy || 0;

  this.reset(x, y);
  this.scale.set(1);

  this.game.physics.arcade.velocityFromAngle(angle, speed, this.body.velocity);

  this.angle = angle;

  this.body.gravity.set(gx, gy);

};

Bullet.prototype.update = function () {

  if (this.tracking)
  {
    this.rotation = Math.atan2(this.body.velocity.y, this.body.velocity.x);
  }

  if (this.scaleSpeed > 0)
  {
    this.scale.x += this.scaleSpeed;
    this.scale.y += this.scaleSpeed;
  }

};

////////////////////////////////////////////////////
//  A single bullet is fired in front of the ship //
////////////////////////////////////////////////////

SingleBullet = function (game) {

    Phaser.Group.call(this, game, game.world, 'Single Bullet', false, true, Phaser.Physics.ARCADE);

    this.nextFire = 0;
    this.bulletSpeed = 600;
    this.fireRate = 100;

    for (var i = 0; i < 64; i++)
    {
        this.add(new Bullet(game, 'bullet1'), true);
    }

    return this;

};

SingleBullet.prototype = Object.create(Phaser.Group.prototype);
SingleBullet.prototype.constructor = SingleBullet;

SingleBullet.prototype.fire = function (source) {

    if (this.game.time.time < this.nextFire) { return; }

    var x = source.x + 10;
    var y = source.y + 10;

    this.getFirstExists(false).fire(x, y, 0, this.bulletSpeed, 0, 0);

    this.nextFire = this.game.time.time + this.fireRate;

};
function Player(game_state, x, y) {
  Phaser.Sprite.call(this, game_state.game, x, y, 'hero');
  this.game_state = game_state;

  this.facing = 'left';
  this.lifes = 3;
  this.isAlive = false;
  this.name = 'Player';
  this.currState = 'IDLE';
  this.respawnPoint = {
    x: 40, y: 4
  };

  console.log('Add player');

  this.animations.add('idle', [1], 0);
  this.animations.add('walk', [0, 1], 6, true);
  this.animations.add('jump', [7], 0);
  this.animations.play('idle');

  this.game_state.game.physics.arcade.enable(this);
  this.body.collideWorldBounds = true;
  this.anchor.setTo(0.5, 0.5);

  this.cursors = this.game_state.game.input.keyboard.createCursorKeys();
  this.jumpButton = this.game_state.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

  var key = this.game.input.keyboard.addKey(Phaser.Keyboard.X);
  key.onDown.add(function(key)
  {
    var bullet = new SingleBullet(this.game_state.game);
    console.log(bullet);

    //bullet.fire(this);
  }, this);
}

Player.prototype = Object.create(Phaser.Sprite.prototype);
Player.prototype.constructor = Player;

Player.prototype.spawn = function() {
  this.reset(this.respawnPoint.x, this.respawnPoint.y);
};

Player.prototype.changeState = function(newState) {
  if (newState === this.currState) {
    return;
  }

  this.currState = newState;
  console.log('Change state', newState);

  switch(newState) {
    case 'IDLE':
      this.animations.play('idle');
      break;
    case 'WALKING':
      this.animations.play('walk');
      break;
    case 'JUMPING':
      this.animations.play('jump');
      break;
  }
};

Player.prototype.update = function() {
  if (this.game_state.layerSolid) {
    this.game_state.game.physics.arcade.collide(this, this.game_state.layerSolid);
    this.game_state.game.physics.arcade.collide(this, this.game_state.layerHazard, function(player) {
      player.kill();
      player.spawn();
    });
  }

  if (this.cursors.left.isDown) {
      this.scale.x = 1;
      this.body.velocity.x = -200;
  }

  if (this.cursors.right.isDown) {
      this.scale.x = -1;
      this.body.velocity.x = 200;
  }

  if (this.cursors.right.isDown || this.cursors.left.isDown) {
    if (this.body.onFloor()) {
      this.changeState('WALKING');
    }
  } else {
    this.body.velocity.x = 0;
    if (this.body.onFloor()) {
      this.changeState('IDLE');
    }
  }

  if (this.jumpButton.isDown && this.body.onFloor()) {
      this.body.velocity.y = -500;
      this.changeState('JUMPING');
  }
};
function GameState() {
  Phaser.State.call(this);
}

GameState.prototype = Object.create(Phaser.State.prototype);
GameState.prototype.constructor = GameState;

GameState.prototype.preload = function() {
  'use strict';
  this.game.load.tilemap('map', 'static/map1.json', null, Phaser.Tilemap.TILED_JSON);
  this.game.load.image('tiles', 'static/tiles.png');
  this.game.load.spritesheet('hero', 'static/hero.png', 34, 38, 14);
  this.game.load.image('background', 'static/map1.png');
  this.game.load.image('bullet1', 'static/bullet1.png');
};

GameState.prototype.create = function () {
  'use strict';
  console.log('create');

  // start physics system
  this.game.physics.startSystem(Phaser.Physics.ARCADE);
  this.game.world.setBounds(0, 0, 6400, 640);

  this.game.physics.arcade.gravity.y = 1000;

  var map = this.game.add.tilemap('map');
  map.addTilesetImage('tiles1', 'tiles');

  this.game.add.sprite(0, 0, 'background');

  this.layerSolid = map.createLayer('solid');
  //this.layerSolid.debug = true;
  this.layerSolid.resizeWorld();

  this.layerHazard = map.createLayer('hazard');
  //this.layerHazard.debug = true;
  this.layerHazard.resizeWorld();

  map.setCollisionBetween(1, 640, true, 'solid', true);
  map.setCollisionBetween(1, 640, true, 'hazard', true);

  this.player = new Player(this, 40, 4);
  this.add.game.add.existing(this.player);
  this.game.camera.follow(this.player);
};

GameState.prototype.update = function() {
  'use strict';
};

GameState.prototype.render = function() {
  'use strict';
  //this.game.debug.bodyInfo(this.player, 16, 24);
};
(function() {
  var game = new Phaser.Game(800, 600, Phaser.WEBGL, 'content');
  game.state.add('GameState', new GameState());
  game.state.start('GameState');
})();