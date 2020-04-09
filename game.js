const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 800,
  heigth: 640,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: {
    preload,
    create,
    update,
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: true,
      gravity: { y: 500 },
    },
  }
};

const game = new Phaser.Game(config);
const tileSize = 64
var inventory = {};
var inventoryText;

function preload() {
  // Image layers from Tiled can't be exported to Phaser 3 (as yet)
  // So we add the background image separately
  this.load.image('background', 'assets/images/background.png');
  // Load the tileset image file, needed for the map to know what
  // tiles to draw on the screen
  this.load.image('tiles', 'assets/tilesets/tiles_spritesheet.png');
  // Even though we load the tilesheet with the spike image, we need to
  // load the Spike image separately for Phaser 3 to render it
  this.load.image('green_mushroom', 'assets/images/green_mushroom.png');
  this.load.image('red_mushroom', 'assets/images/red_mushroom.png');
  this.load.image('wasteland_left', 'assets/images/wasteland_left.png');
  // Load the export Tiled JSON
  this.load.tilemapTiledJSON('map', 'assets/tilemaps/level1.json');
  // Load player animations from the player spritesheet and atlas JSON
  this.load.atlas('player', 'assets/images/kenney_player.png',
    'assets/images/kenney_player_atlas.json');
}

function create() {
  // Create a tile map, which is used to bring our level in Tiled
  // to our game world in Phaser
  const map = this.make.tilemap({ key: 'map' });
  // Add the tileset to the map so the images would load correctly in Phaser
  const tileset = map.addTilesetImage('tiles_spritesheet', 'tiles');
  // Place the background image in our game world
  const backgroundImage = this.add.image(0, 0, 'background').setOrigin(0, 0);
  // Scale the image to better match our game's resolution
  backgroundImage.setScale(2, 0.8);
  // Score info
  inventoryText = this.add.text(16, 16, '', { fontSize: '12px', fill: '#000' });


  // Add the platform layer as a static group, the player would be able
  // to jump on platforms like world collisions but they shouldn't move
  const platforms = map.createStaticLayer('Platforms', tileset, 0, 200);
  // There are many ways to set collision between tiles and players
  // As we want players to collide with all of the platforms, we tell Phaser to
  // set collisions for every tile in our platform layer whose index isn't -1.
  // Tiled indices can only be >= 0, therefore we are colliding with all of
  // the platform layer
  platforms.setCollisionByExclusion(-1, true);

  // Add the player to the game world
  this.player = this.physics.add.sprite(50, 300, 'player');
  this.player.body.setSize(this.player.width - 30, this.player.height - 26).setOffset(14, 26);
  this.player.setBounce(0.1); // our player will bounce from items
  this.player.setCollideWorldBounds(true); // don't go out of the map
  this.physics.add.collider(this.player, platforms);

  // Create the walking animation using the last 2 frames of
  // the atlas' first row
  this.anims.create({
    key: 'walk',
    frames: this.anims.generateFrameNames('player', {
      prefix: 'robo_player_',
      start: 2,
      end: 3,
    }),
    frameRate: 10,
    repeat: -1
  });

  // Create an idle animation i.e the first frame
  this.anims.create({
    key: 'idle',
    frames: [{ key: 'player', frame: 'robo_player_0' }],
    frameRate: 10,
  });

  // Use the second frame of the atlas for jumping
  this.anims.create({
    key: 'jump',
    frames: [{ key: 'player', frame: 'robo_player_1' }],
    frameRate: 10,
  });

  // Enable user input via cursor keys
  this.cursors = this.input.keyboard.createCursorKeys();

  // Create the mushrooms
  this.mushrooms = this.physics.add.group();

  for (i = 0; i < 3; i++) {
    // Add new spikes to our sprite group
    let mushroom = this.mushrooms.create(
        (tileSize * 10) - (i * tileSize * i),
        (tileSize * 6.75),
        'green_mushroom'
      ).setName("green mushroom");
    mushroom.body.setSize(mushroom.width - 30, mushroom.height - 26).setOffset(14, 26);
  };
  for (i = 0; i < 0; i++) {
    // Add new spikes to our sprite group
    let mushroom = this.mushrooms.create(
        (tileSize * 10) - (i * tileSize * i)+tileSize,
        (tileSize * 6.75),
        'red_mushroom'
      ).setName("red mushroom");
    mushroom.body.setSize(mushroom.width - 30, mushroom.height - 26).setOffset(14, 26);
  };
  this.physics.add.collider(platforms, this.mushrooms);  
  this.physics.add.overlap(this.player, this.mushrooms, collectItem, null, this);


  this.wasteland = this.add.sprite((tileSize * 9), (tileSize * 10.75), 'wasteland_left');
  // this.wasteland.body.setSize(land.width - 30, land.height - 26).setOffset(14, 26);

  this.teleporters = this.physics.add.group()
  teleporter = this.teleporters.create(220, 326, 'red_mushroom').setName("red teleporter");
  this.physics.add.collider(platforms, this.teleporters);  
  this.physics.add.overlap(this.player, this.teleporters, collectItem, null, this);

}

function update() {
   // this.mushrooms.forEach(function (mushroom) {
   //      mushroom.update();
   //  });
  // Control the player with left or right keys
  if (this.cursors.left.isDown) {
    this.player.setVelocityX(-200);
    if (this.player.body.onFloor()) {
      this.player.play('walk', true);
    }
  } else if (this.cursors.right.isDown) {
    this.player.setVelocityX(200);
    if (this.player.body.onFloor()) {
      this.player.play('walk', true);
    }
  } else {
    // If no keys are pressed, the player keeps still
    this.player.setVelocityX(0);
    // Only show the idle animation if the player is footed
    // If this is not included, the player would look idle while jumping
    if (this.player.body.onFloor()) {
      this.player.play('idle', true);
    }
  }

  // if (this.cursors.right.isDown)
  //   {
  //       this.cameras.main.scrollX -= 0.5;

  //       if (this.cameras.main.scrollX <= 0)
  //       {
  //           d = 0;
  //       }
  //   }
  //   else
  //   {
  //       this.cameras.main.scrollX += 0.5;

  //       if (this.cameras.main.scrollX >= 800)
  //       {
  //           d = 1;
  //       }
  //   }

  // Player can jump while walking any direction by pressing the space bar
  // or the 'UP' arrow
  if ((this.cursors.space.isDown || this.cursors.up.isDown) && this.player.body.onFloor()) {
    this.player.setVelocityY(-350);
    this.player.play('jump', true);
  }

  // If the player is moving to the right, keep them facing forward
  if (this.player.body.velocity.x > 0) {
    this.player.setFlipX(false);
  } else if (this.player.body.velocity.x < 0) {
    // otherwise, make them face the other side
    this.player.setFlipX(true);
  }
}

/**
 * collectItem does what it says on the tin. item is added to the inventory
 * @param {*} player - player sprite
 * @param {*} item - item player collided with
 */

function collectItem(player, item) {
  player.setVelocity(0, 0);
  item.disableBody(true, true);
  if (!inventory[item.name]) {
    inventory[item.name] = 1;
  } else {
    inventory[item.name] += 1;
  }
  inventoryList = ""
  Object.entries(inventory).forEach(([key, value]) => {
    inventoryList += key + ": " + value + "\n";
  });
  inventoryText.setText('Inventory:\n' + inventoryList);
}

function generateMushrooms(mushrooms) {

  mushrooms.children.iterate(function (child) {

      child.setBounceY(Phaser.Math.FloatBetween(0.2, 0.1));
      child.body.setSize(child.width - 30, child.height - 26).setOffset(14, 26);

  });
}
