"use strict";

const GRAVITY = 0.05;
const VX = 1 ;


/*
Learn how to make a ship bounce around the canvas
with gravity, friction and mass.
*/

//Create a new Hexi instance, and start it.
var g = hexi(1280, 768, setup, ["images/star.png"]);

//Set the background color and scale the canvas
g.backgroundColor = 0x142a4f;
g.scaleToWindow();

//Declare variables used in more than one function
var ship = undefined;
var blocks = undefined;
var graph = undefined;
var targetAltitudeGraph = undefined;
var speedGraph = undefined;
var targetAltitude = undefined;
var prevX = undefined;
var prevY = undefined;
var prevVy = undefined;
var message = undefined;
var particleStream = undefined;
var space = g.tilingSprite(
	"images/space.jpg",
	g.canvas.width,
	g.canvas.height
	);

var ws = undefined;
var remoteCMD = "off";

let pauseDone = false;
let sendSync = false;
//If you 're not loading any files, start Hexi after
//you've decalred your global variables
g.start();

//The `setup` function to initialize your application



function setup() {
	
    // create the tiles 

    var accDist = 0;
    blocks = g.group();
    blocks.x = 0;
    blocks.y = 0;

	var makeBlock = function makeBlock()
	{
		var pos = g.randomInt(1,768);
		var block = g.sprite(["images/meteorite.png"]);
		block.pivotX = block.width/2;
		block.pivotY = block.height/2;
		accDist += g.randomInt(0,500);
		block.x = g.canvas.width+accDist;
		block.y = pos;
		blocks.addChild(block);
	}
	
	for(var i = 1; i<= 15; i++)
	{
		makeBlock();
	}
	
    /*var holePos = (g.randomInt(1,10)*64);
    while (tileHeight < g.canvas.height) {
      var block = g.sprite(["images/meteorite.png"]);
		block.pivotX = block.width/2;
		block.pivotY = block.height/2;

      if (tileHeight == holePos) { 
		block.x = g.canvas.width - 128;
		block.y = tileHeight;
		blocks.addChild(block);}  // create a block 
      tileHeight += 64
    }*/
	

    //targetAltitude = holePos+32;
    //targetAltitudeGraph.drawPolygon(0, targetAltitude, g.canvas.width, targetAltitude);

  ship = g.sprite(["images/rocket.png"]);

  ship.x = 200;
  ship.y = g.canvas.height/2;

  //Set the ship's velocity to 0
  //ship.vx = g.randomInt(5, 15);
  ship.vx = VX;
  ship.vy = 0;
  prevVy = 0;
  //ship.vy = g.randomInt(5, 15);

  //Physics properties
  ship.gravity = GRAVITY;


  // used to track the lines segments
  prevX = ship.x+ship.halfWidth;
  prevY = ship.y+ship.halfHeight;


  //Add the winning text
  message = g.text("GGEZ", "72px Futura", "white");
  g.stage.putCenter(message);
  message.visible = false;


  ///////////////////////////////////////////////
  //  Web Socket Connection
  ///////////////////////////////////////////////
  
  ws = new WebSocket("ws://localhost:8989/ws");

   ws.onopen = function()
   {
		ws.send("open COM3 115200 tinyg");
      // Web Socket is connected, send data using send()

   };
	
   ws.onmessage = function (evt) 
   { 
      var received_msg = evt.data;
      console.log("Received: " + received_msg);
      
      try {
    	  var obj = JSON.parse(received_msg);
	      if (obj.hasOwnProperty('D')) {
	      	remoteCMD = obj.D.trim();
	      	console.log ("remoteCMD = " + remoteCMD)
	      }
	  } catch (e)  {}
	  
   };




  //When the pointer is tapped, center the ship
  //over the pointer and give it a new random velocity
  g.pointer.tap = function () {

  
    // check reset conditions
    if (!ship.visible || message.visible) {
      if (pauseDone) {
        //reset();
		setup();
        pauseDone = false;
      }      
    } else {
    }

  };

  g.pointer.press = function () {
      // play rocket gas animation
      return particleStream.play();

  }

  //Stop creating particles when the pointer is released
  g.pointer.release = function () {
    sendSync = false;
    return particleStream.stop();
    
  };

  //Change the game state to `play`.
  g.state = play;

// ==============================

  particleStream = g.particleEmitter(100, //The interval, in milliseconds
  function () {
    return g.createParticles( //The `createParticles` method
    //ship.x+(ship.width/2), ship.y+ship.height, 
    (ship.width/2), ship.height,
    function () {
      return g.sprite("images/star.png");
    }, 
    ship,       //The container to add the particles to
    20,               //Number of particles
    1,              //Gravity
    true,             //Random spacing
    1,2);             //Min/max angle
  });







  


 


}

function fireRocket() {
  	ship.vy = ship.vy - 0.2;
  	
  	g.createParticles( //The `createParticles` method
    //ship.x+(ship.width/2), ship.y+ship.height, 
    (ship.width/2), ship.height,
    function () {
      return g.sprite("images/star.png");
    }, 
    ship,       //The container to add the particles to
    10,            //Number of particles
    0.05,              //Gravity
    true,             //Random spacing
    1,2);

}




function shipExplode() {

      //Slow the ship down if it hits the bottom of the stage.
      ship.frictionX = 0.98;
      ship.visible = false;


      g.wait(1000, doPause);

      g.createParticles( //The `createParticles` method
      //ship.x+(ship.width/2), ship.y+ship.height, 
      (ship.x+ship.width/2), ship.y+ship.height/2,
      function () {
        return g.sprite("images/star.png");
      }, 
      g.stage,       //The container to add the particles to
      100,               //Number of particles
      0.0,              //Gravity
      true,             //Random spacing
      0,6.3,              //Min/max angle
      5,48,              // min/max size
      1,5                // min/max speed

      );    



}


let go = true;

//The `play` function will run in a loop
function play() {
	if(ship.visible)
	{
		space.tileX -= 0.5;
		blocks.children.forEach(function (block)
		{
			block.rotation += 0.1;
			block.x -= 5;
			if(block.x <= -block.width)
			{
				resetPos(block, g.randomInt(0,500));
			}
		})
	}


  if (!ship.visible) 
  {
	  message.visible = true;
  }



  if (g.pointer.isDown) {
  	  ship.vy = ship.vy - 0.1 ; 

	  /////////////////////////////////////////////////////
	  // Send data 
	  /////////////////////////////////////////////////////
	  var kv = 25;
	  var ks = 1;

	  var s = targetAltitude - (ship.y+ship.halfHeight);
	  var v = ship.vy;

	  if (!sendSync) {
	 //  	ws.send("sendjson " + JSON.stringify({
		//   P: "COM5",
		//   Data: [{"D":"s=" + s.toFixed(2) + "\r"}]
		// }));

		ws.send("send COM5 A=" + s.toFixed(2));
		ws.send("send COM5 B=" + v.toFixed(2));


		sendSync = true;
	  }

  }



  if (remoteCMD == "on") {
  	fireRocket();
  } 

  //Apply gravity to the vertical velocity
  ship.vy += ship.gravity;

  ship.y += ship.vy;

  // win condition
  if (ship.x > g.canvas.width - 64) {
    message.visible = true;
    ship.vx = 0;
    ship.vy = 0;
    ship.gravity = 0;
    g.wait(3000, doPause);
  }


  //Use Ga's custom `contain` method to bounce the ship
  //off the canvas edges and slow it to a stop:

  //1. Use the `contain` method to create a `collision` object
  //that checks for a collision between the ship and the
  //rectangular area of the stage. Setting `contain`'s 3rd
  //argument to `true` will make the ship bounce off the
  //stage's edges.
  var collision = g.contain(ship, g.stage, true);

  //2. If the collision object has a value of "bottom" and "top"
  if (collision) {
    if (collision.has("bottom") || collision.has("top")) {
        shipExplode();




    } 

  }

  // check collision with the tiles
  let shipVsBlock = blocks.children.some(block => {
    return g.hitTestRectangle(ship, block, true);  
  });

  if (shipVsBlock) {
      shipExplode();

  }
}
//# sourceMappingURL=bouncingship.js.map

function resetPos(block, x)
{
	block.x = g.canvas.width+x;
}

/*function reset() {

  //Reset the game if the fairy hits a block
  ship.visible = true;
  ship.y = g.canvas.height/2;
  ship.vy = 0;
  ship.x = 200;

  ship.gravity = GRAVITY;
  prevY = ship.y;
  blocks.visible = false;
}*/

function doPause() {

  pauseDone = true;
}