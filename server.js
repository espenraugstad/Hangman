const fs = require("fs");
const express = require("express");
const bodyParser = require("body-parser");
const pg = require("pg");

const server = express();
server.set("port", (process.env.PORT || 8080));
server.use(express.static("public"));
server.use(bodyParser.json());
/**************************************************/

// 1. Load words
let words = fs.readFileSync("words", "utf-8").split("\n");
let playWord = "";
let guesses = [];

// 2. /api/getWord/ returns a random word to the client
server.get("/api/getWord/", (req, res, next)=>{
    playWord = words[Math.floor(Math.random()*words.length)]
    res.json(playWord);
});

// 3. Receive a guess from the client
server.post(`/api/guessLetter/`,(req, res, next)=>{
    let letter = req.body.guessedLetter.toLowerCase();
    console.log(letter);
    /*
        req.body = {
            guessedLetter: "..."
        }
    */

    //Letter doesn't exist in array already?
    if(guesses.indexOf(letter) === -1){
        guesses.push(letter);
        //Check guess
        let indices = checkGuess(letter);
        //Return to client an array of indices and the new guesses array
        res.send({
            indices: indices,
            guesses: guesses
        }).end();
    } else {
        //Has already been guessed
        res.send("Letter already guessed");
        res.send(guesses).end();
    }
});

/**************************************************/

function checkGuess(letter){
    /*
    https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf
    */
    let indices = [];
    let wordArray = playWord.split("");
    let index = wordArray.indexOf(letter);
    while (index != -1){
        indices.push(index);
        index = wordArray.indexOf(letter, index+1);
    }
    return indices;
}

/**************************************************/
server.listen(server.get("port"), ()=>{
    console.log(`Listening on port ${server.get("port")}`);
});