const tileSize = 64;
const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: tileSize * 79,
  height: tileSize * 16,
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
  this.load.tilemapTiledJSON('map', 'assets/tilemaps/level_1.json');
  // Load player animations from the player spritesheet and atlas JSON
  this.load.atlas('player', 'assets/images/kenney_player.png',
    'assets/images/kenney_player_atlas.json');
}

function addPlayer(scene, platforms) {
  // Add the player to the game world
  scene.player = scene.physics.add.sprite(tileSize*2, tileSize*10, 'player');
  scene.player.body.setSize(scene.player.width - 30, scene.player.height - 26).setOffset(14, 26);
  scene.player.setBounce(0.1); // our player will bounce from items
  scene.player.setCollideWorldBounds(true); // don't go out of the map
  scene.physics.add.collider(scene.player, platforms);

  // Create the walking animation using the last 2 frames of
  // the atlas' first row
  scene.anims.create({
    key: 'walk',
    frames: scene.anims.generateFrameNames('player', {
      prefix: 'robo_player_',
      start: 2,
      end: 3,
    }),
    frameRate: 10,
    repeat: -1
  });

  // Create an idle animation i.e the first frame
  scene.anims.create({
    key: 'idle',
    frames: [{ key: 'player', frame: 'robo_player_0' }],
    frameRate: 10,
  });

  // Use the second frame of the atlas for jumping
  scene.anims.create({
    key: 'jump',
    frames: [{ key: 'player', frame: 'robo_player_1' }],
    frameRate: 10,
  });

}
function create() {
  scene = this;
  // Create a tile map, which is used to bring our level in Tiled
  // to our game world in Phaser
  const map = scene.make.tilemap({ key: 'map' });
  // Add the tileset to the map so the images would load correctly in Phaser
  const tileset = map.addTilesetImage('EcoWarrior', 'tiles');
  // Place the background image in our game world
  // const backgroundImage = scene.add.image(0, 0, 'background').setOrigin(0, 0);
  // // Scale the image to better match our game's resolution
  // backgroundImage.setScale(2, 2);
  var background = this.add.tileSprite(0, 0, config.width, config.height, "background").setOrigin(0, 0);
  // Align the camera
  scene.cameras.main.setViewport(200, 50, tileSize*16, tileSize*10);
  scene.cameras.main.setScroll(0, tileSize*6);
  // scene.cameras.main.setSize(config.width, config.height);
  console.log(scene.cameras.main)
  let softEdgeX = tileSize * 3;
  let softEdgeY = tileSize * 2;
  // Score info
  inventoryText = scene.add.text(16, 16, '', { fontSize: '12px', fill: '#000' });
  inventoryText.fixedToCamera = true;


  // Add the platform layer as a static group, the player would be able
  // to jump on platforms like world collisions but they shouldn't move
  const scenery = map.createStaticLayer('Scenery', tileset, 0, 0);
  const platforms = map.createStaticLayer('Platforms', tileset, 0, 0);
  // const objects = map.createStaticLayer('Objects', tileset, 0, 0);
  // There are many ways to set collision between tiles and players
  // As we want players to collide with all of the platforms, we tell Phaser to
  // set collisions for every tile in our platform layer whose index isn't -1.
  // Tiled indices can only be >= 0, therefore we are colliding with all of
  // the platform layer
  platforms.setCollisionByExclusion(-1, true);

  // Add the player to the game world
  addPlayer(scene, platforms);

  // Enable user input via cursor keys
  scene.cursors = scene.input.keyboard.createCursorKeys();

  // Create the mushrooms
  scene.mushrooms = scene.physics.add.group();

  for (i = 0; i < 3; i++) {
    // Add new spikes to our sprite group
    let mushroom = scene.mushrooms.create(
        (tileSize * 10) - (i * tileSize * i),
        (tileSize * 13.5),
        'green_mushroom'
      ).setName("green mushroom");
    mushroom.body.setSize(mushroom.width - 30, mushroom.height - 26).setOffset(14, 26);
  };
  for (i = 0; i < 0; i++) {
    // Add new spikes to our sprite group
    let mushroom = scene.mushrooms.create(
        (tileSize * 10) - (i * tileSize * i)+tileSize,
        (tileSize * 13.5),
        'red_mushroom'
      ).setName("red mushroom");
    mushroom.body.setSize(mushroom.width - 30, mushroom.height - 26).setOffset(14, 26);
  };
  scene.physics.add.collider(platforms, scene.mushrooms);  
  scene.physics.add.overlap(scene.player, scene.mushrooms, collectItem, null, scene);


  // scene.wasteland = scene.add.sprite((tileSize * 9), (tileSize * 10.75), 'wasteland_left');
  // scene.wasteland.body.setSize(land.width - 30, land.height - 26).setOffset(14, 26);

  scene.teleporters = scene.physics.add.group()
  teleporter = scene.teleporters.create(tileSize*3.5, tileSize*12.5, 'red_mushroom').setName("red teleporter");
  scene.physics.add.collider(platforms, scene.teleporters);  
  scene.physics.add.overlap(scene.player, scene.teleporters, collectItem, null, scene);
  var rect = new Phaser.Geom.Rectangle(scene.cameras.main.x, scene.cameras.main.y, config.width - softEdgeX, config.height - softEdgeY)
  var graphics = scene.add.graphics();
  graphics.fillRectShape(rect);
}

function update() {
  // // Move camera with arrow keys
  // if (this.cursors.left.isDown) {
  //   this.cameras.main.scrollX += 15;
  // } else if (this.cursors.right.isDown) {
  //   this.cameras.main.scrollX -= 15;
  // } else if (this.cursors.up.isDown) {
  //   this.cameras.main.scrollY -= 15;
  // } else if (this.cursors.down.isDown) {
  //   this.cameras.main.scrollY += 15;
  // }


  // Control the player with left or right keys
  if (this.cursors.left.isDown) {
    this.player.setVelocityX(-200);
    console.log('scene.cameras.main.x', scene.cameras.main.x)

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
    // {
    //     this.cameras.main.scrollX -= 0.5;

    //     if (this.cameras.main.scrollX <= 0)
    //     {
    //         d = 0;
    //     }
    // }
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
