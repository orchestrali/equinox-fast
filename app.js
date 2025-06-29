const $ = (s, e = document.body) => e.querySelector(s);
const $$ = (s, e = document.body) => [...e.querySelectorAll(s)];
const wait = (ms) => new Promise((done) => setTimeout(done, ms));
let close = "close",
    correct = "correct",
    wrong = "wrong",
    correctClass = "key--hint-correct",
    closeClass = "key--hint-close",
    wrongClass = "key--hint-wrong";

const dom = (tag, attrs, ...children) => {
  const el = document.createElement(tag);
  if (attrs instanceof HTMLElement) {
    children.unshift(attrs);
  } else {
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === "class" && value instanceof Array) {
        value = value.join(" ");
      }
      el.setAttribute(key, value);
    });
  }
  el.append(...children.flat());
  return el;
};

const KEYS = ["QWERTYUIOP", "ASDFGHJKL", "+ZXCVBNM-"];
const PRETTY_KEYS = {
  "+": "Enter",
  "-": "Del",
  A: "I",
  S: "ii",
  D: "iii",
  F: "IV",
  J: "V",
  K: "vi",
  L: "viiº⁶",
  Z: "i",
  X: "i⁶",
  C: "iiº⁶",
  V: "III",
  B: "iv",
  M: "VI",
  Q: "I⁶",
  G: "IV⁶",
  H: "V⁶",
  N: "iv⁶",
  W: "ii⁶",
  E: "ii⁶₅",
  R: "iiø⁶₅",
  T: "IV⁷",
  Y: "V⁷",
  U: "V⁶₅",
  I: "V⁴₃",
  O: "V⁴₂",
  P: "viiº⁷"
};

const ROUNDS = 6;
const LENGTH = 5;

const dictionaryRequest = fetch("/chordle/dictionary.txt").then((r) => r.text());
const board = $(".board");
const keyboard = $(".keyboard");

window.onload = () => init().catch((e) => console.error(e));

async function init() {
  const board = generateBoard();
  const kb = generateKeyboard();

  const words = (await dictionaryRequest).split("\n").map(w => w.slice(0, 5));
   const word = words[(Math.random() * words.length) | 0];
  //const word = "QUAIL"

  await startGame({ word, kb, board, words });
}

async function animate(el, name, ms) {
  el.style.animation = `${ms}ms ${name}`;
  await wait(ms * 1.2);
  el.style.animation = "none";
}

async function startGame({ word, kb, board, words }) {
  let round = 0;
  for (round = 0; round < ROUNDS; round++) {
    const solution = word.split("");
    const guess = await collectGuess({ kb, board, round, words });
    const hints = new Array(guess.length).fill("wrong");
    for (let i = 0; i < guess.length; i++) {
      if (solution[i] === guess[i]) {
        hints[i] = "correct";
        solution[i] = undefined;
      }
    }
    for (let i = 0; i < guess.length; i++) {
      if (hints[i] === "wrong") {
        const index = solution.indexOf(guess[i]);
        if (index !== -1) {
          hints[i] = "close";
          solution[index] = undefined;
        }
      }
    }
    board.revealHint(round, hints);
    kb.revealHint(guess, hints);
    if (guess.join('') === word) {
      jQuery(".feedback").css("pointer-events","all");
      jQuery(".feedback").addClass("gojo");
      $(".feedback").innerText = `GOJO! 🎉 Click for sharable stats.`;  
      return;
    }
  }
  $(".feedback").innerText = `GAME OVER\nCorrect Answer was: ${word}`;
}

function collectGuess({ kb, board, round, words }) {
  return new Promise((submit) => {
    let letters = [];
    async function keyHandler(key) {
      if (key === "+") {
        if (letters.length === 5) {
          const guessIsValid = words.includes(letters.join(""));
          if (!guessIsValid) {
            $(".feedback").innerText = "Sorry, not in dictionary! Backspace and try again.";
            await animate($$(".round")[round], "shake", 800);
          } else {
            $(".feedback").innerText = "";
            kb.off(keyHandler);
            submit(letters);
          }
        }
      } else if (key === "-") {
        if (letters.length > 0) {
          letters.pop();
        }
        board.updateGuess(round, letters);
      } else {
        if (letters.length < 5) {
          letters.push(key);
        }
        board.updateGuess(round, letters);
      }
    }
    kb.on(keyHandler);
  });
}

function generateBoard() {
  const rows = [];
  for (let i = 0; i < ROUNDS; i++) {
    const row = dom("div", {
      class: "round",
      "data-round": i,
    });
    for (let j = 0; j < LENGTH; j++) {
      row.append(
        dom("div", {
          class: "letter",
          "data-pos": j,
        })
      );
    }
    board.append(row);
  }
  return {
    updateGuess: (round, letters) => {
      const blanks = $$(".letter", $$(".round")[round]);
      blanks.forEach((b, i) => (b.innerText = PRETTY_KEYS[letters[i]] || ""));
    },
    revealHint: (round, hints) => {
      const blanks = $$(".letter", $$(".round")[round]);
      hints.forEach((hint, i) => {
        if (hint) {
          blanks[i].classList.add("letter--hint-" + hint);
        }
      });
    },
  };
}

function generateKeyboard() {
    keyboard.append(...KEYS.map((row) => dom("div", {
        class: "keyboard__row",
    }, row.split("").map((key) => dom("button", {
        class: `key${"+-".includes(key) ?" key--pretty":""}`,
        "data-key": key,
    }, PRETTY_KEYS[key] || key)))));
    const keyListeners = new Set();
    keyboard.addEventListener("click", (e) => {
        e.preventDefault();
        const key = e.target.getAttribute("data-key");
        if (key) {
            keyListeners.forEach((l) => l(key));
        }
    });
    document.addEventListener("keyup", function(event) {
        let key = event.key.toUpperCase();
        if (key === "ENTER") {
            key = "+"
        };
        if (key === "BACKSPACE") {
            key = "-"
        };
        if (KEYS.join("").includes(key)) {
            keyListeners.forEach((l) => l(key));
        }
    });
    return {
        on: (l) => keyListeners.add(l),
        off: (l) => keyListeners.delete(l),
        revealHint: (guess, hints) => {
            let thisRoundCorrect = [];
            let thisRoundClose = [];
            hints.forEach((hint, i) => {
                let thisGuess = guess[i];
                let elem = $(`[data-key="${thisGuess}"]`);
                if (hint === close && !thisRoundCorrect.includes(thisGuess)) {
                    thisRoundClose.push(thisGuess);
                    elem.classList = "key";
                    elem.classList.add(closeClass);
                } else if (hint === wrong && !thisRoundCorrect.includes(thisGuess) && !thisRoundClose.includes(thisGuess)) {
                    elem.classList.add(wrongClass);
                } else if (hint === correct) {
                    thisRoundCorrect.push(thisGuess);
                    elem.classList = "key";
                    elem.classList.add(correctClass);
                }
            });
        }
    };
}
