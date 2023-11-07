import { useEffect, useRef, useState } from "react";
import "./App.css";
import Ball from "./assets/ball.png";
import Paddle from "./assets/paddle.png";
import useInterval from "./useInterverl";

let ctx: CanvasRenderingContext2D | null;
let dx = 1; // amount ball should move horizontally
let dy = -3; // amount ball should move vertically
let x = 500; // x coordinate of the ball
let y = 650;  // y coordinate of the ball
let row = 0; // used to reference row index in bricks array 
let col = 0; // used to reference column index in bricks array

const canvasX = 1000; // width of canvas (pixels)
const canvasY = 750; // height of canvas (pixels)
const paddleh = 30; // paddle height (pixels)
const paddlew = 100; // paddle width (pixels)
const balld = 20; // the diameter of the ball (pixels)
const ballr = 10; // the radius of the ball (pixels)
const nrows = 6; // number of rows of bricks
const ncols = 6; // number of columns of bricks
const brick_colors = ["green", "purple", "turquoise", "tomato"]; // colors of the bricks
const padding = 0.9; // padding around each brick (pixels)
const brickWidth = 1000 / ncols - 1; // width of each brick (pixels)
const brickHeight = 30; // height of each brick (pixels)
const rowheight = brickHeight + padding; // height of each row of bricks (pixels)
const colwidth = brickWidth + padding; // width of each column of bricks (pixels)



const initialPaddle = [450, 730]; // initial position of the paddle
const initialBall = [500, 650]; // initial position of the ball
const timeDelay = 10; // interval time delay

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null); // canvas element
  const [paddle, setPaddle] = useState(initialPaddle); // state variable for position of the paddle
  const [bricks, setBricks] = useState(
    Array(nrows).fill(Array(ncols).fill(false))
  ); // state variable for position of bricks
  const [ball, setBall] = useState(initialBall); // state variable for position of the ball
  const [delay, setDelay] = useState<number | null>(null); // state variable for delay of interval
  const [gameover, setGameover] = useState(false); // state variable for gameover status
  const [endMessage, setEndMessage] = useState("Game Over"); // state variable for end game message
  const [score, setScore] = useState(0); // state variable for the game score

  useInterval(() => draw(), delay); // start the interval 

  useEffect(() => {
    const myPaddle = document.getElementById("myPaddle") as HTMLCanvasElement;
    const myBall = document.getElementById("myBall") as HTMLCanvasElement;
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      ctx = canvas.getContext("2d");
      if (ctx) {
        // draw the elements of the game board on the canvas
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        ctx.fillStyle = "#000000";
        ctx.drawImage(myPaddle, paddle[0], paddle[1], 100, 20);
        ctx.drawImage(myBall, ball[0], ball[1], 20, 20);

        for (let i=0; i < nrows; i++) { // for each row of bricks
          for (let j=0; j < ncols; j++) { // for each column of bricks
            ctx.fillStyle = brick_colors[(i+j) % brick_colors.length];
            if (bricks[i][j]) {
              rect((j * (brickWidth + padding)) + padding, 
                  (i * (brickHeight + padding)) + padding,
                  brickWidth, brickHeight);
            } // else if bricks[i][j] is false it's already been hit
          }
        }
      }
    }
  }, [paddle, bricks, ball, gameover]);

  // function to draw the bricks
  function rect(x: number, y: number, w: number, h: number) {
    if (ctx) {
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.closePath();
      ctx.fill();
    }
  }

  // initialize the bricks array
  function init_bricks() {
    const tempBricks = new Array(nrows);
    for (let i = 0; i < nrows; i++) {
      // for each row of bricks
      tempBricks[i] = new Array<boolean>(ncols);
      for (let j = 0; j < ncols; j++) {
        // for each column of bricks
        tempBricks[i][j] = true;
      }
    }
    setBricks(tempBricks);
  }

  // start the game
  function play() {
    setGameover(false);
    setEndMessage("Game Over");
    setScore(0);
    setPaddle(initialPaddle);
    init_bricks();
    x = 500;
    y = 650;
    setDelay(timeDelay);
  }

  function handleSetScore(){
    if(score>Number(localStorage.getItem("brickScore"))){
      localStorage.setItem("brickScore",JSON.stringify(score))
    }
  }

  // event listener handling for moving the paddle using left and righ arrow keys
  function changeDirection(e: React.KeyboardEvent<HTMLDivElement>) {
    const tempPaddle = [...paddle];
    switch (e.code) {
      case "ArrowLeft":
        if (paddle[0] > 0) {
          tempPaddle[0] -= 20;
          setPaddle(tempPaddle);
        }
        break;
      case "ArrowRight":
        if (paddle[0] < 900) {
          tempPaddle[0] += 20;
          setPaddle(tempPaddle);
        }
        break;
    }
  }

  // function to check ball location, take action if the ball has hit anything and set new position
  function draw() {
    row = Math.floor(y / rowheight);
    col = Math.floor(x / colwidth);

    // check previous iteration if we hit win condition and all bricks are broken
    if(endMessage === 'You Win!') {
      stop_animation();
      return;
    }
    //check if we have hit a brick
    //if so reverse the ball and mark the brick as broken
    if (y < nrows * rowheight && row >= 0 && col >= 0 && bricks[row][col]) {
      dy = -dy;
      bricks[row][col] = false;
      setScore(score+1);
      setEndMessage("You Win!")
      // check if there are any bricks left
      // if all bricks are broken then winning condition met
      for(let i = 0; i < ncols; i++) {
        if(bricks[i].includes(true))
          setEndMessage("Game Over");
          break;
      }
    }

    // check if the ball is hitting the walls of the canvas
    // and if it is rebound it
    if (x + dx > canvasX - balld || x + dx < 0) dx = -dx;

    if (y + dy < 0) {
      dy = -dy;
    } else if (y + dy > canvasY - paddleh) {
      // check if the ball is hitting the
      // paddle and if it is rebound it
      if (x > paddle[0] && x < paddle[0] + paddlew) {
        dy = -dy;
      }
    }
    if (y + dy >= canvasY - ballr) {
      // game over, so stop the animation
      dy = -dy;
      stop_animation();
      return;
    }
    // set the new position of the ball
    x += dx;
    y += dy;
    setBall([x, y]);
  }

  // function to stop the game
  function stop_animation() {
    setDelay(null);
    setGameover(true);
    handleSetScore();
  }

  return (
    <>
      <div onKeyDown={(e) => changeDirection(e)} tabIndex={0}>
        <img
          id="myPaddle"
          className="playItems"
          src={Paddle}
          alt="myPaddle"
          width="300"
        />
        <img
          id="myBall"
          className="playItems"
          src={Ball}
          alt="myBall"
          width="300"
        />
        <canvas
          className="playArea"
          ref={canvasRef}
          width={`${canvasX}px`}
          height={`${canvasY}px`}
        />
        {gameover && <div className="gameOver">{endMessage}</div>}
        <button onClick={play} className="playButton">
          Play
        </button>
        <div className="scoreBox">
          <h2>Score: {score}</h2>
          <h2>High Score: {localStorage.getItem('brickScore')}</h2>
        </div>
      </div>
    </>
  );
}

export default App;
