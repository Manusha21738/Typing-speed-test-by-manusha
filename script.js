const typingText = document.querySelector("#quote-display");
const inpField = document.querySelector(".input-field");
const tryAgainBtn = document.querySelector("#retry-btn");
const timeTag = document.querySelector("#timer");
const mistakeTag = document.querySelector("#mistakes");
const wpmTag = document.querySelector("#wpm");
const highScoreTag = document.querySelector("#high-score");
const modeSelector = document.querySelector("#mode-selector");
const timeButtons = document.querySelectorAll(".time-btn");
const caret = document.querySelector("#caret");

// Modal Elements
const modal = document.querySelector("#result-modal");
const modalWpm = document.querySelector("#modal-wpm");
const modalAccuracy = document.querySelector("#modal-accuracy");
const modalMistakes = document.querySelector("#modal-mistakes");
const newRecordMsg = document.querySelector("#new-record-msg");

// Audio
const clickSound = new Audio('assets/sound/click.mp3');
const errorSound = new Audio('assets/sound/error.mp3');
clickSound.volume = 0.5; 
errorSound.volume = 0.3; 

let timer,
    maxTime = 60,
    timeLeft = maxTime,
    charIndex = 0,
    mistakes = 0,
    isTyping = 0;

let highScore = localStorage.getItem('proTypeHighScore') || 0;
highScoreTag.innerText = highScore;

// Longer texts to accommodate 120s mode
const textParagraphs = [
    "The quick brown fox jumps over the lazy dog. Programming is the art of telling another human what one wants the computer to do.",
    "Success is not final, failure is not fatal: It is the courage to continue that counts. The only way to do great work is to love what you do.",
    "Design patterns are typical solutions to commonly occurring problems in software design. They are like blueprints you can customize.",
    "To be or not to be, that is the question. Whether 'tis nobler in the mind to suffer the slings and arrows of outrageous fortune."
];

const codeSnippets = [
    "const sum = (a, b) => { return a + b; }; console.log(sum(5, 10));",
    "document.getElementById('root').innerHTML = '<p>Hello World</p>';",
    "import React, { useState, useEffect } from 'react'; export default App;",
    "for (let i = 0; i < array.length; i++) { if (array[i] > 0) print(i); }",
    "function fetchData(url) { return fetch(url).then(res => res.json()); }",
    "const user = { name: 'Dev', role: 'Admin', active: true };"
];

let currentData = textParagraphs; 

timeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        timeButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        maxTime = parseInt(btn.dataset.time);
        timeLeft = maxTime;
        timeTag.innerText = `${timeLeft}s`;
        resetGame();
    });
});

function updateCaret() {
    const currChar = typingText.querySelectorAll("span")[charIndex];
    if(currChar){
        caret.style.display = "block";
        caret.style.left = currChar.offsetLeft + "px";
        caret.style.top = currChar.offsetTop + "px";
    }
}

function loadParagraph() {
    const ranIndex = Math.floor(Math.random() * currentData.length);
    typingText.innerHTML = "";
    currentData[ranIndex].split("").forEach(char => {
        let span = `<span>${char}</span>`;
        typingText.innerHTML += span;
    });
    charIndex = 0;
    updateCaret();
    document.addEventListener("keydown", () => inpField.focus());
    typingText.addEventListener("click", () => inpField.focus());
}

modeSelector.addEventListener("change", () => {
    currentData = modeSelector.value === "code" ? codeSnippets : textParagraphs;
    resetGame();
});

function initTyping() {
    let characters = typingText.querySelectorAll("span");
    let typedChar = inpField.value.split("")[charIndex];

    if (charIndex < characters.length && timeLeft > 0) {
        if (!isTyping) {
            timer = setInterval(initTimer, 1000);
            isTyping = true;
        }

        if (typedChar == null) { 
            if (charIndex > 0) {
                charIndex--;
                if (characters[charIndex].classList.contains("incorrect")) {
                    mistakes--;
                }
                characters[charIndex].classList.remove("correct", "incorrect");
            }
        } else {
            if (characters[charIndex].innerText === typedChar) {
                characters[charIndex].classList.add("correct");
                clickSound.cloneNode(true).play(); 
            } else {
                mistakes++;
                characters[charIndex].classList.add("incorrect");
                errorSound.cloneNode(true).play();
            }
            charIndex++;
        }
        
        // Move Caret
        updateCaret();

        // --- NEW: Check if all characters are typed ---
        if(charIndex === characters.length) {
            finishGame();
            return; // Exit function immediately
        }
        // ----------------------------------------------

        // Live Stats Update
        let wpm = Math.round(((charIndex - mistakes) / 5) / (maxTime - timeLeft) * 60);
        wpm = wpm < 0 || !wpm || wpm === Infinity ? 0 : wpm;
        wpmTag.innerText = wpm;
        mistakeTag.innerText = mistakes;
    } else {
        finishGame();
    }
}

function initTimer() {
    if (timeLeft > 0) {
        timeLeft--;
        timeTag.innerText = `${timeLeft}s`;
        let wpm = Math.round(((charIndex - mistakes) / 5) / (maxTime - timeLeft) * 60);
        wpmTag.innerText = wpm;
    } else {
        finishGame();
    }
}

function finishGame() {
    clearInterval(timer);
    inpField.value = "";
    
    // --- NEW: Calculate WPM based on Time Elapsed, not Max Time ---
    // If user finishes early, we use (maxTime - timeLeft) as the duration
    let timeTaken = maxTime - timeLeft;
    // Prevent division by 0 if they finish instantly
    timeTaken = timeTaken === 0 ? 1 : timeTaken; 
    
    let wpm = Math.round(((charIndex - mistakes) / 5) / timeTaken * 60);
    // --------------------------------------------------------------
    
    let accuracy = Math.floor(((charIndex - mistakes) / charIndex) * 100);
    accuracy = accuracy < 0 || !accuracy || accuracy === Infinity ? 0 : accuracy;
    
    modalWpm.innerText = wpm;
    modalAccuracy.innerText = `${accuracy}%`;
    modalMistakes.innerText = mistakes;

    const activeTimeBtn = document.querySelector('.time-btn.active');
    const timeLabel = activeTimeBtn ? activeTimeBtn.innerText : '60s';
    document.querySelector('#modal-time-stat').innerText = timeLabel;

    if (wpm > highScore) {
        highScore = wpm;
        localStorage.setItem('proTypeHighScore', highScore);
        highScoreTag.innerText = highScore;
        newRecordMsg.classList.remove("hidden");
    } else {
        newRecordMsg.classList.add("hidden");
    }

    modal.classList.add("show");
}

function closeModal() {
    modal.classList.remove("show");
    resetGame();
}

function resetGame() {
    loadParagraph();
    clearInterval(timer);
    timeLeft = maxTime;
    charIndex = mistakes = isTyping = 0;
    inpField.value = "";
    timeTag.innerText = `${timeLeft}s`;
    wpmTag.innerText = 0;
    mistakeTag.innerText = 0;
    modal.classList.remove("show");
    setTimeout(updateCaret, 10); 
}

loadParagraph();
setTimeout(updateCaret, 100); 
inpField.addEventListener("input", initTyping);
tryAgainBtn.addEventListener("click", resetGame);
window.addEventListener("resize", updateCaret);