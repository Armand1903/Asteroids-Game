const canvas = document.querySelector("canvas");
const context = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const heartImage = new Image();
heartImage.src = "./images/heart_life.png";

class Player {
  constructor({ position, velocity }) {
    this.position = position; //x, y
    this.velocity = velocity; //x, y
    this.rotation = 0;
    this.lives = 3;
    this.score = 0;
  }

  draw() {
    context.save();
    //ne plasam pe centrul ecranului
    context.translate(this.position.x, this.position.y);
    context.rotate(this.rotation);
    context.translate(-this.position.x, -this.position.y);

    context.beginPath();
    context.moveTo(this.position.x + 30, this.position.y);
    context.lineTo(this.position.x - 10, this.position.y - 10);
    context.lineTo(this.position.x - 10, this.position.y + 10);
    context.fillStyle = "white";
    context.fill();
    context.closePath();

    context.strokeStyle = "white";
    context.stroke();

    context.restore();
  }

  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    //nava nu va parasi niciodata canvas-ul/ecranul
    this.position.x = Math.max(0, Math.min(canvas.width, this.position.x));
    this.position.y = Math.max(0, Math.min(canvas.height, this.position.y));
  }

  /**
   * Functie pentru a determina coordonatele celor 3 puncte ale triunghiului
   */
  getVertices() {
    const cos = Math.cos(this.rotation);
    const sin = Math.sin(this.rotation);

    return [
      {
        x: this.position.x + cos * 30 - sin * 0,
        y: this.position.y + sin * 30 + cos * 0,
      },
      {
        x: this.position.x + cos * -10 - sin * 10,
        y: this.position.y + sin * -10 + cos * 10,
      },
      {
        x: this.position.x + cos * -10 - sin * -10,
        y: this.position.y + sin * -10 + cos * -10,
      },
    ];
  }
}

class Projectile {
  constructor({ position, velocity }) {
    this.position = position;
    this.velocity = velocity;
    this.radius = 5;
  }

  draw() {
    context.beginPath();
    context.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2, false);
    context.closePath();
    context.fillStyle = "white";
    context.fill();
  }

  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }
}

class Asteroid {
  constructor({ position, velocity, radius }) {
    this.position = position;
    this.velocity = velocity;
    this.radius = radius;
    this.lives = Math.floor((radius - 10) / 10);

    switch (this.lives) {
      case 1:
        this.color = "orange";
        break;
      case 2:
        this.color = "green";
        break;
      case 3:
        this.color = "blue";
        break;
      case 4:
        this.color = "purple";
        break;
      default:
        this.color = "grey";
    }
  }

  draw() {
    //Desenare asteroid
    context.beginPath();
    context.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2, false);
    context.fillStyle = this.color;
    context.fill();
    context.font = "20px Arial";
    context.fillStyle = "white";

    //Centrare text in asteroid
    //Determinare dimensiune text
    const text = this.lives.toString();
    const textMeasurements = context.measureText(text);
    const textWidth = textMeasurements.width;
    const textHeight =
      textMeasurements.actualBoundingBoxAscent + textMeasurements.actualBoundingBoxDescent;

    //Calcularea pozitiei de unde incepe scrierea textului
    const textX = this.position.x - textWidth / 2;
    const textY = this.position.y + textHeight / 2;

    context.fillText(text, textX, textY);
  }

  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }
}

//constante pentru gestionarea miscarii jucatorului
const SPEED = 3;
const ROTATIONAL_SPEED = 0.05;
const FRICTION = 0.97;
const PROJECTILE_SPEED = 3;

//constante pentru gestionarea sistemului de puncte
const pointsForDestroyingAsteroid = 100;
const pointsForDamagingAsteroid = 50;
let lastBonusLifeScore = 0;
const pointsForBonusLife = 1000;

//initializarea obiectelor mobile
const player = new Player({
  position: { x: canvas.width / 2, y: canvas.height / 2 },
  velocity: { x: 0, y: 0 },
});

const MAX_PROJECTILES = 3;
let projectiles = [];
let asteroids = [];

//vector pentru gestionarea tastelor
const keys = {
  up: { pressed: false },
  down: { pressed: false },
  left: { pressed: false },
  right: { pressed: false },
  z: { pressed: false },
  c: { pressed: false },
};

//gestionarea aparitiei asteroizilor pe ecran
const intervalID = window.setInterval(
  () => {
    //atributele asteroidului
    let x, y;
    let vx, vy;
    let radius = (Math.floor(Math.random() * 4) + 2) * 10;

    //factor de viteza (generat aleatoriu pentru fiecare asteroid)
    const speedFactor = Math.random() * 0.5 + 0.5; //viteza între 0.5 și 1.0

    const index = Math.floor(Math.random() * 4);
    switch (index) {
      case 0: //din stanga ecranului
        x = 0 - radius;
        y = Math.random() * canvas.height;
        vx = 1 * speedFactor;
        vy = (Math.random() - 0.5) * speedFactor;
        break;

      case 1: //din partea de jos a ecranului
        x = Math.random() * canvas.width;
        y = canvas.height + radius;
        vx = (Math.random() - 0.5) * speedFactor;
        vy = -1 * speedFactor;
        break;

      case 2: //din dreapta ecranului
        x = canvas.width + radius;
        y = Math.random() * canvas.height;
        vx = -1 * speedFactor;
        vy = (Math.random() - 0.5) * speedFactor;
        break;

      case 3: //din partea de sus a ecranului
        x = Math.random() * canvas.width;
        y = 0 - radius;
        vx = (Math.random() - 0.5) * speedFactor;
        vy = 1 * speedFactor;
        break;
    }

    asteroids.push(
      new Asteroid({
        position: {
          x: x,
          y: y,
        },
        velocity: {
          x: vx,
          y: vy,
        },
        radius,
      })
    );
  },
  1000 //se genereaza automat la interval de 1sec
);

//Functii
/**
 * Retinerea scorului player-ului la final de meci
 * pentru a actualiza topul folosind WEB Storage API
 * @param {number} score
 */
function saveScore(score) {
  const playerName = prompt("Enter your name:");
  const newScore = { name: playerName, score: score };

  //salveaza scorul existent (creeaza un nou vector daca este primul scor inregistrat)
  const scores = JSON.parse(localStorage.getItem("highScores")) || [];
  scores.push(newScore);

  //pastreaza top 5 cele mai mari scoruri
  scores.sort((a, b) => b.score - a.score);
  scores.splice(5);

  //salveaza scorurile actualizate
  localStorage.setItem("highScores", JSON.stringify(scores));
}

/**
 * Incarca cele mai bune 5 scoruri in consola
 */
function loadScores() {
  const top5Scores = JSON.parse(localStorage.getItem("highScores")) || [];
  console.log(top5Scores);
}

loadScores();

/**
 * Deseneaza in partea superioara a canvas-ului vietile disponibile si punctajul curent
 */
function drawScoreAndLives() {
  const heartWidth = 30;
  const heartHeight = 30;

  for (let i = 0; i < player.lives; i++) {
    const x = 10 + i * (heartWidth + 5);
    const y = 10;

    context.drawImage(heartImage, x, y, heartWidth, heartHeight);
  }

  context.fillStyle = "white";
  context.font = "20px Arial";
  context.fillText("Score: " + player.score, canvas.width - 150, 30);
}

/**
 * Restaureaza pozitia player-ului si goleste canvas-ul. Se activeaza in momentul pierderii unei vieti
 */
function resetGame() {
  player.position = { x: canvas.width / 2, y: canvas.height / 2 };
  player.velocity = { x: 0, y: 0 };

  asteroids = [];
  projectiles = [];
}

/**
 * Incheie sesiunea de joc si afiseaza textul aferent
 */
function gameOver() {
  //oprire joc
  window.clearInterval(intervalID);

  //afisare mesaj de game over
  context.fillStyle = "white";
  context.font = "30px Arial";
  context.textAlign = "center";
  context.fillText("Game Over", canvas.width / 2, canvas.height / 2);
  context.font = "16px Arial";
  context.fillText("Refresh to start a new game", canvas.width / 2, canvas.height / 2 + 30);

  saveScore(player.score);
}

/**
 * Detecteaza coliziunea a doua cercuri. Aceasta functie
 * este folosita atat pentru coliziunea asteroizilor,
 * cat si pentru cea a proiectilului cu un asteroid
 * @param {*} cerc1 - Un obiect.
 * @param {*} cerc2 - Un obiect.
 * @returns {Boolean} Adevarat sau Fals.
 */
function circleCollision(circle1, circle2) {
  if (!circle1 || !circle2) return false;

  const xDifference = circle1.position.x - circle2.position.x;
  const yDifference = circle1.position.y - circle2.position.y;
  const distance = Math.sqrt(xDifference * xDifference + yDifference * yDifference);

  if (distance <= circle1.radius + circle2.radius) {
    return true;
  }

  return false;
}

/**
 * Detecteaza coliziunea player-ului cu un asteroid.
 * General, aceasta functie detecteaza coliziunea dintre un cerc si un triunghi
 * @param {*} asteroid - Un obiect.
 * @param {*} player - Un obiect.
 * @returns {Boolean} Adevarat sau Fals.
 */
function circleTriangleCollision(circle, triangle) {
  if (!circle || !triangle) return false;

  //pentru fiecare latura in parte
  for (let i = 0; i < 3; i++) {
    //punctele ce delimiteaza latura triunghiului
    let start = triangle[i];
    let end = triangle[(i + 1) % 3];

    //determinarea lungimii laturii
    let dx = end.x - start.x;
    let dy = end.y - start.y;
    let length = Math.sqrt(dx * dx + dy * dy);

    //punctul de contact al cercului
    let dot =
      ((circle.position.x - start.x) * dx + (circle.position.y - start.y) * dy) / (length * length);

    //cele mai apropiate coordonate de punctul cercului
    let closestX = start.x + dot * dx;
    let closestY = start.y + dot * dy;

    //verificare daca respectivele coordonate sunt parte a laturii triunghiului
    if (!isPointOnLineSegment(closestX, closestY, start, end)) {
      closestX = closestX < start.x ? start.x : end.x;
      closestY = closestY < start.y ? start.y : end.y;
    }

    dx = closestX - circle.position.x;
    dy = closestY - circle.position.y;

    let distance = Math.sqrt(dx * dx + dy * dy);

    //exista coliziune?
    if (distance <= circle.radius) {
      return true;
    }
  }

  return false;
}

/**
 * Functie ajutatoare pentru determinarea coliziunii
 * care simplifica citirea codului
 * @param {*} x - Coord de pe axa orizontala a punctului cercului
 * @param {*} y - Coord de pe axa verticala a punctului cercului
 * @param {*} start - Un capat al laturii
 * @param {*} end - Celalalt capat al laturii
 * @returns
 */
function isPointOnLineSegment(x, y, start, end) {
  return (
    x >= Math.min(start.x, end.x) &&
    x <= Math.max(start.x, end.x) &&
    y >= Math.min(start.y, end.y) &&
    y <= Math.max(start.y, end.y)
  );
}

/**
 * Functia principala pe baza careia functioneaza intregul joc
 */
function animate() {
  const animationID = window.requestAnimationFrame(animate);

  context.fillStyle = "black";
  context.fillRect(0, 0, canvas.width, canvas.height);

  if (player) player.update();

  drawScoreAndLives();

  //respectarea conditiilor de regenerare a unei vieti
  //o viata bonus la 1000 de puncte inregistrate
  if (player.score - lastBonusLifeScore >= pointsForBonusLife) {
    player.lives += 1;
    lastBonusLifeScore += pointsForBonusLife;
  }

  //managerierea proiectilelor
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const projectile = projectiles[i];
    projectile.update();

    //eliminarea proiectilelor dupa ce parasesc suprafata canvas-ului
    if (
      projectile.position.x + projectile.radius < 0 ||
      projectile.position.x - projectile.radius > canvas.width ||
      projectile.position.y + projectile.radius < 0 ||
      projectile.position.y - projectile.radius > canvas.height
    ) {
      projectiles.splice(i, 1);
    }
  }

  //managerierea asteroizilor
  for (let i = asteroids.length - 1; i >= 0; i--) {
    const asteroid = asteroids[i];

    if (asteroid) asteroid.update();

    //coliziunea a doi asteroizi
    for (let j = i - 1; j >= 0; j--) {
      const asteroidJ = asteroids[j];

      if (circleCollision(asteroid, asteroidJ)) {
        //schimbarea traiectoriilor pentru cei doi asteroizi
        const dx = asteroid.position.x - asteroidJ.position.x;
        const dy = asteroid.position.y - asteroidJ.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const overlap = asteroid.radius + asteroidJ.radius - distance;

        asteroid.position.x += ((dx / distance) * overlap) / 2;
        asteroid.position.y += ((dy / distance) * overlap) / 2;
        asteroidJ.position.x -= ((dx / distance) * overlap) / 2;
        asteroidJ.position.y -= ((dy / distance) * overlap) / 2;

        //inversarea vitezelor celor doi asteroizi
        const tempVelocity = { ...asteroid.velocity };
        asteroid.velocity = { ...asteroidJ.velocity };
        asteroidJ.velocity = tempVelocity;
      }
    }

    //coliziunea jucatorului cu un asteroid
    if (circleTriangleCollision(asteroid, player.getVertices())) {
      player.lives -= 1;

      if (player.lives <= 0) {
        window.cancelAnimationFrame(animationID);
        gameOver();
      } else {
        resetGame();
      }
    }

    //eliminarea asteroizilor dupa ce parasesc suprafata canvas-ului
    if (asteroid)
      if (
        asteroid.position.x + asteroid.radius < 0 ||
        asteroid.position.x - asteroid.radius > canvas.width ||
        asteroid.position.y + asteroid.radius < 0 ||
        asteroid.position.y - asteroid.radius > canvas.height
      ) {
        asteroids.splice(i, 1);
      }

    //coliziunea asteroidului cu un proiectil
    for (let j = projectiles.length - 1; j >= 0; j--) {
      const projectile = projectiles[j];

      //modificari survenite la coliziune
      if (circleCollision(asteroid, projectile)) {
        projectiles.splice(j, 1);
        asteroid.lives -= 1;

        if (asteroid.lives > 0) {
          player.score += pointsForDamagingAsteroid;
          asteroid.radius -= 10;

          switch (asteroid.lives) {
            case 1:
              asteroid.color = "orange";
              break;
            case 2:
              asteroid.color = "green";
              break;
            case 3:
              asteroid.color = "blue";
              break;
            case 4:
              asteroid.color = "purple";
              break;
          }
        } else {
          player.score += pointsForDestroyingAsteroid;
          asteroids.splice(i, 1);
        }
      }
    }
  }

  //efectele utilizarii tastelor
  const SLOWER_SPEED = SPEED / 2;
  //deplasare
  if (keys.up.pressed) {
    player.velocity.x = Math.cos(player.rotation) * SPEED;
    player.velocity.y = Math.sin(player.rotation) * SPEED;
  } else if (keys.down.pressed) {
    player.velocity.x = -Math.cos(player.rotation) * SLOWER_SPEED;
    player.velocity.y = -Math.sin(player.rotation) * SLOWER_SPEED;
  } else if (keys.left.pressed) {
    player.velocity.x = -Math.cos(player.rotation + Math.PI / 2) * SLOWER_SPEED;
    player.velocity.y = -Math.sin(player.rotation + Math.PI / 2) * SLOWER_SPEED;
  } else if (keys.right.pressed) {
    player.velocity.x = Math.cos(player.rotation + Math.PI / 2) * SLOWER_SPEED;
    player.velocity.y = Math.sin(player.rotation + Math.PI / 2) * SLOWER_SPEED;
  } else {
    //incetinire treptata (efect al fortei de frecare)
    player.velocity.x *= FRICTION;
    player.velocity.y *= FRICTION;
  }

  //rotire
  if (keys.c.pressed) player.rotation += ROTATIONAL_SPEED;
  else if (keys.z.pressed) player.rotation -= ROTATIONAL_SPEED;
}

animate();

//verifica apasarea tastelor din controlul nostru
window.addEventListener("keydown", (event) => {
  switch (event.code) {
    case "ArrowUp":
      keys.up.pressed = true;
      break;
    case "ArrowDown":
      keys.down.pressed = true;
      break;
    case "ArrowLeft":
      keys.left.pressed = true;
      break;
    case "ArrowRight":
      keys.right.pressed = true;
      break;
    case "KeyZ":
      keys.z.pressed = true;
      break;
    case "KeyC":
      keys.c.pressed = true;
      break;
    case "KeyX":
      if (projectiles.length < MAX_PROJECTILES) {
        projectiles.push(
          new Projectile({
            position: {
              x: player.position.x + Math.cos(player.rotation) * 30,
              y: player.position.y + Math.sin(player.rotation) * 30,
            },
            velocity: {
              x: Math.cos(player.rotation) * PROJECTILE_SPEED,
              y: Math.sin(player.rotation) * PROJECTILE_SPEED,
            },
          })
        );
      }

      break;
  }
});

//verifica incetarea activitatii de apasare a tastei si reseteaza variabila corespunzatoare
window.addEventListener("keyup", (event) => {
  switch (event.code) {
    case "ArrowUp":
      keys.up.pressed = false;
      break;
    case "ArrowDown":
      keys.down.pressed = false;
      break;
    case "ArrowLeft":
      keys.left.pressed = false;
      break;
    case "ArrowRight":
      keys.right.pressed = false;
      break;
    case "KeyZ":
      keys.z.pressed = false;
      break;
    case "KeyC":
      keys.c.pressed = false;
      break;
  }
});
