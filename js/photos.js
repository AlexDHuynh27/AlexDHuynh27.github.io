var canvas = document.getElementById("gameCanvas");
var ctx = canvas.getContext("2d");
var viewWidth = 0;
var viewHeight = 0;
var shipSize = 22;
var shipSpeed = 320;
var shipColor = "#2B2622";
var shipX = window.innerWidth / 2;
var shipY = window.innerHeight / 2;
var shipAngle = 0;
var edgeMargin = shipSize;
var upPressed = false;
var downPressed = false;
var leftPressed = false;
var rightPressed = false;
var mouseX = shipX + 1;
var mouseY = shipY;
var mouseDown = false;
var mouseDownTime = 0;
var chargeTime = 200;
var destroyTime = 10;
var beamWidth = 4;
var blockColumnCount = 16;
var blockRowCount = 12;
var destroyTarget = null;
var destroyTimer = 0;
var lastTime = performance.now();

var photos = [];
var photoFrames = document.querySelectorAll(".photoFrame");
for (var p = 0; p < photoFrames.length; p++) {
  var cover = document.createElement("div");
  cover.className = "cover";
  cover.style.gridTemplateColumns = "repeat(" + blockColumnCount + ", 1fr)";
  cover.style.gridTemplateRows = "repeat(" + blockRowCount + ", 1fr)";

  var blocks = [];
  for (var i = 0; i < blockColumnCount; i++) {
    blocks[i] = [];
  }

  for (var j = 0; j < blockRowCount; j++) {
    for (var i = 0; i < blockColumnCount; i++) {
      var element = document.createElement("div");
      element.style.backgroundColor = "hsl(" + Math.floor(Math.random() * 360) + ", 70%, 55%)";
      cover.appendChild(element);
      blocks[i][j] = { element: element, status: 1 };
    }
  }
  photoFrames[p].appendChild(cover);
  photos[p] = { frame: photoFrames[p], blocks: blocks, blocksRemaining: blockColumnCount * blockRowCount };
}

document.addEventListener("keydown", keyPressed, false);
document.addEventListener("keyup", keyUnpressed, false);
document.addEventListener("mousemove", mouseMoved, false);
document.addEventListener("mousedown", mousePressed, false);
document.addEventListener("mouseup", mouseUnpressed, false);
document.addEventListener("dragstart", function (e) { e.preventDefault(); }, false);
window.addEventListener("blur", windowBlurred, false);
window.addEventListener("resize", resizeCanvas, false);

function keyPressed(e) {
  if (e.code == "KeyW") {
    upPressed = true;
    e.preventDefault();
  }
  else if (e.code == "KeyS") {
    downPressed = true;
    e.preventDefault();
  }
  else if (e.code == "KeyA") {
    leftPressed = true;
    e.preventDefault();
  }
  else if (e.code == "KeyD") {
    rightPressed = true;
    e.preventDefault();
  }
}



function keyUnpressed(e) {
  if (e.code == "KeyW") {
    upPressed = false;
  }
  else if (e.code == "KeyS") {
    downPressed = false;
  }
  else if (e.code == "KeyA") {
    leftPressed = false;
  }
  else if (e.code == "KeyD") {
    rightPressed = false;
  }
}



function mouseMoved(e) {
  mouseX = e.clientX;
  mouseY = e.clientY;
}



function mousePressed(e) {
  if (e.button == 0 && !e.target.closest("nav")) {
    e.preventDefault();
    mouseDown = true;
    mouseDownTime = performance.now();
  }
}



function mouseUnpressed(e) {
  if (e.button == 0) {
    mouseDown = false;
  }
}



function windowBlurred() {
  upPressed = false;
  downPressed = false;
  leftPressed = false;
  rightPressed = false;
  mouseDown = false;
}



function resizeCanvas() {
  viewWidth = document.documentElement.clientWidth;
  viewHeight = document.documentElement.clientHeight;
  var pixelRatio = window.devicePixelRatio || 1;
  canvas.width = viewWidth * pixelRatio;
  canvas.height = viewHeight * pixelRatio;
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  shipX = Math.max(edgeMargin, Math.min(viewWidth - edgeMargin, shipX));
  shipY = Math.max(edgeMargin, Math.min(viewHeight - edgeMargin, shipY));
}



function moveShip(deltaTime) {
  var moveX = 0;
  var moveY = 0;
  if (upPressed) {
    moveY -= 1;
  }
  if (downPressed) {
    moveY += 1;
  }
  if (leftPressed) {
    moveX -= 1;
  }
  if (rightPressed) {
    moveX += 1;
  }
  if (moveX != 0 && moveY != 0) {
    moveX *= Math.SQRT1_2;
    moveY *= Math.SQRT1_2;
  }

  var step = shipSpeed * deltaTime;
  shipX = Math.max(edgeMargin, Math.min(viewWidth - edgeMargin, shipX + moveX * step));

  var newY = shipY + moveY * step;
  var minY = edgeMargin;
  var maxY = viewHeight - edgeMargin;
  if (newY > maxY) {
    shipY = maxY;
    window.scrollBy(0, Math.ceil(newY - maxY));
  }
  else if (newY < minY) {
    shipY = minY;
    window.scrollBy(0, -Math.ceil(minY - newY));
  }
  else {
    shipY = newY;
  }

  shipAngle = Math.atan2(mouseY - shipY, mouseX - shipX);
}



function getBeamEnd(startX, startY, angle) {
  var directionX = Math.cos(angle);
  var directionY = Math.sin(angle);
  var distance = Infinity;
  if (directionX > 0) {
    distance = Math.min(distance, (viewWidth - startX) / directionX);
  }
  else if (directionX < 0) {
    distance = Math.min(distance, -startX / directionX);
  }
  if (directionY > 0) {
    distance = Math.min(distance, (viewHeight - startY) / directionY);
  }
  else if (directionY < 0) {
    distance = Math.min(distance, -startY / directionY);
  }
  return { x: startX + directionX * distance, y: startY + directionY * distance };
}



function segmentHitsRect(x1, y1, x2, y2, left, top, right, bottom) {
  var differenceX = x2 - x1;
  var differenceY = y2 - y1;
  var p = [-differenceX, differenceX, -differenceY, differenceY];
  var q = [x1 - left, right - x1, y1 - top, bottom - y1];
  var enter = 0;
  var exit = 1;
  for (var i = 0; i < 4; i++) {
    if (p[i] == 0) {
      if (q[i] < 0) {
        return -1;
      }
    }
    else {
      var u = q[i] / p[i];
      if (p[i] < 0) {
        if (u > exit) {
          return -1;
        }
        if (u > enter) {
          enter = u;
        }
      }
      else {
        if (u < enter) {
          return -1;
        }
        if (u < exit) {
          exit = u;
        }
      }
    }
  }
  return enter;
}



function findFirstBlock(x1, y1, x2, y2) {
  var padding = beamWidth / 2;
  var closest = null;
  for (var p = 0; p < photos.length; p++) {
    var photo = photos[p];
    if (photo.blocksRemaining == 0) {
      continue;
    }
    var rect = photo.frame.getBoundingClientRect();
    if (segmentHitsRect(x1, y1, x2, y2, rect.left - padding, rect.top - padding, rect.right + padding, rect.bottom + padding) < 0) {
      continue;
    }

    var blockWidth = rect.width / blockColumnCount;
    var blockHeight = rect.height / blockRowCount;
    for (var i = 0; i < blockColumnCount; i++) {
      for (var j = 0; j < blockRowCount; j++) {
        var b = photo.blocks[i][j];
        if (b.status == 1) {
          var blockX = rect.left + i * blockWidth;
          var blockY = rect.top + j * blockHeight;
          var hit = segmentHitsRect(x1, y1, x2, y2, blockX - padding, blockY - padding, blockX + blockWidth + padding, blockY + blockHeight + padding);
          if (hit >= 0 && (closest == null || hit < closest.distance)) {
            closest = { photo: photo, block: b, distance: hit };
          }
        }
      }
    }
  }
  return closest;
}



function fireLaser(startX, startY, endX, endY, deltaTime) {
  var target = findFirstBlock(startX, startY, endX, endY);
  if (target == null) {
    destroyTarget = null;
    return { x: endX, y: endY };
  }

  if (target.block != destroyTarget) { 
    destroyTarget = target.block;
    destroyTimer = 0;
  }

  destroyTimer += deltaTime * 1000;
  if (destroyTimer >= destroyTime) {
    target.block.status = 0;
    target.block.element.style.visibility = "hidden";
    target.photo.blocksRemaining -= 1;
    destroyTarget = null;
  }

  return { x: startX + (endX - startX) * target.distance, y: startY + (endY - startY) * target.distance };
}



function drawLaser(startX, startY, endX, endY) {
  /*
  Draws the laser beam
  */
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.strokeStyle = "#ff2d2d";
  ctx.lineWidth = beamWidth;
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.closePath();
}



function drawShip() {
  ctx.save();
  ctx.translate(shipX, shipY);
  ctx.rotate(shipAngle);
  ctx.beginPath();
  ctx.moveTo(shipSize, 0);
  ctx.lineTo(-shipSize / 2, shipSize * Math.sqrt(3) / 2); //back right corner
  ctx.lineTo(-shipSize / 2, -shipSize * Math.sqrt(3) / 2); //back left corner
  ctx.closePath();
  ctx.fillStyle = shipColor;
  ctx.fill();
  ctx.restore();
}



function draw(time) {
  var deltaTime = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;

  ctx.clearRect(0, 0, viewWidth, viewHeight);
  moveShip(deltaTime);

  if (mouseDown && time - mouseDownTime >= chargeTime) {
    var noseX = shipX + Math.cos(shipAngle) * shipSize;
    var noseY = shipY + Math.sin(shipAngle) * shipSize;
    var beamEnd = getBeamEnd(noseX, noseY, shipAngle);
    var beamStop = fireLaser(noseX, noseY, beamEnd.x, beamEnd.y, deltaTime);
    drawLaser(noseX, noseY, beamStop.x, beamStop.y);
  }
  else {
    destroyTarget = null;
  }

  drawShip();
  requestAnimationFrame(draw);
}


alert("Use WASD to move. Hold left click to fire a laser and remove the blocks to reveal the photos")
//loop
resizeCanvas();

requestAnimationFrame(draw);