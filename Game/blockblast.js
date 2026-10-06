var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");
var ballRadius = 6;
var ballStatus = 0;
var x = canvas.width / 2;
var y = canvas.height - 30;
var velocityY = -4;
var shooterHeight = 15;
var shooterWidth = 100;
var shooterX = (canvas.width - shooterWidth) / 2;
var rightPressed = false;
var leftPressed = false;
var brickWidth = 45;
var brickHeight = 20;
var brickRowCount = 5;//Change this number lower or higher to adjust difficulty
var brickColumnCount = Math.floor(canvas.width/brickWidth) - 2;
var brickPadding = 5;
var brickOffsetVertical = 30;
var brickOffsetHorizontal = 25;
var brickDestroyedCount = 0;

var bricks = []; //For loop to add bricks to a list based off rows and collumns
for (var i = 0; i < brickColumnCount; i++) {
  bricks[i] = [];
  for (var j = 0; j < brickRowCount; j++) {
    bricks[i][j] = { x: 0, y: 0, status: 1 };
  }
}

document.addEventListener("keydown", keyPressed, false);
document.addEventListener("keyup", keyUnpressed, false);

function keyPressed(e) {
  /*
  Checks for keys that aren being presed on
  */
  if (e.keyCode == "68") {
      rightPressed = true;
    }
  else if (e.keyCode == "65") {
      leftPressed = true;
  }
  else if (e.keyCode == 32){
    ballStatus = 1;
    x = shooterX + (shooterWidth / 2);
    y = canvas.height - 30;
  }
}



function keyUnpressed(e) {
  /*
  Checks for keys that arent being pressed on
  */
  if (e.keyCode == "68") {
      rightPressed = false;
  }
  else if (e.keyCode == "65") {
      leftPressed = false;
  }
}



function brickCollision() {
  /*
  Checks for collision within the brick and the ball
  */
  for (var i = 0; i < brickColumnCount; i++) {
    for (var j = 0; j < brickRowCount; j++) {
      var b = bricks[i][j];
      if (b.status == 1) {
        if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
          b.status = 0;
          ballStatus = 0;
          brickDestroyedCount += 1;
        }
      }
    }
  }
}

function drawBall() {
  /*
  Draws the ball
  */
  ctx.beginPath();
  ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.closePath();
}



function drawShooter() {
  /*
  Draws the shooter
  */
  ctx.beginPath();
  ctx.rect(shooterX, canvas.height - shooterHeight, shooterWidth, shooterHeight);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.closePath();
}


function drawBricks() {
  /*
  Draws a list of bricks
  */
  for (var i = 0; i < brickColumnCount; i++) {
    for (var j = 0; j < brickRowCount; j++) {
      if (bricks[i][j].status == 1) {
        var brickX = (i * (brickWidth + brickPadding)) + brickOffsetHorizontal;
        var brickY = (j * (brickHeight + brickPadding)) + brickOffsetVertical;
        bricks[i][j].x = brickX;
        bricks[i][j].y = brickY;
        ctx.beginPath();
        ctx.rect(brickX, brickY, brickWidth, brickHeight);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.closePath();
      }
    }
  }
}


function draw() {
  /*
  Main function draws everything
  */
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBricks();
  drawShooter();
  brickCollision();
  if (ballStatus == 1){ // checks if there is a ball that is currently being drawn
    drawBall();
    y += velocityY;
  }

  //the controls of the shooter
  if (rightPressed && shooterX < canvas.width - shooterWidth) {
      shooterX += 8;
  }
  else if (leftPressed && shooterX > 0) {
      shooterX -= 8;
  }
  //Checks if all bricks are destroyed
  if (brickDestroyedCount == (brickRowCount*brickColumnCount)){
    alert("YOU WIN");
    document.location.reload();
    clearInterval(interval);
  }
}

//loop
var interval = setInterval(draw, 10);
