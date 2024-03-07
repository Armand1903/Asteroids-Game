# Asteroids-Game
---
An engaging asteroids game using JavaScript and the HTML5 Canvas element. Players navigate a spaceship through an asteroid field, avoiding obstacles and shooting at them in order to get points.

## How to play the game
---
In order to play, you just have to:
1. Download the "game" folder.
2. Run the "game.html" file.

## Rules
---
The game has a few basic rules that you need to know before playing:
### Controls
---
* You can move the ship around using the arrow keys.
* In order to rotate the ship, you use `Z` and `C` keys.
* You can shoot the asteroids by pressing the `X` key.
* **Warning**: *There can be only 3 bullets simultaneously on the map! You will have a cooldown until they dissapear or hit their target, so don't spam this key and use the bullets wisely*.
---
### Lives and points system
---
In the beginning of the game, you have 3 lives. You lose a life when you collide with an asteroid, but wait!
You can increase your number of lives by accumulating points. Shooting an asteroid of size 2, 3 or 4 gives you **50** points, while destroying a small asteroid (size 1) gives you **100**.
When you achieve **1000** points, you get a **bonus life**.
If you lose all your lives, the game will end. You can save your name & score in the local storage. There is a top 5 ranking which updates on your device.
