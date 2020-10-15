const fs = require("fs");
const express = require("express");
const bodyParser = require("body-parser");
const SH = require("./modules/storagehandler");

const server = express();
server.set("port", (process.env.PORT || 8080));
server.use(express.static("public"));
server.use(bodyParser.json());

/******************DATABASE********************************/

const credentials = process.env.DATABASE_URL || require("./NEI").credentials;
const db = new SH(credentials);

/**************************************************/

// 1. Load words
let words = fs.readFileSync("words", "utf-8").split("\n");
let playWord = "";
let guesses = [];
let secret = "";
let gameID = 0;

// 2. /api/getWord/ returns a random word to the client
server.get("/api/startGame/", async (req, res, next)=>{
    //Selects random word
    playWord = words[Math.floor(Math.random()*words.length)];

    for(let i = 0; i < playWord.length; i++){
        secret += "-";
    }
    console.log(playWord);
    console.log(secret);

    //Add game to database
    gameID = await db.saveGame(playWord, guesses, secret);
    
    //Return game with ID and word to client
    res.status(200).json({gameID: gameID, secret: secret}).end();
    
});

// 3. Receive a guess from the client
server.post(`/api/guessLetter/`,async (req, res, next)=>{
    gameID = req.body.gameID;
    let guessedLetter = req.body.guessedLetter;
    let msg = "";

    //Get word from database
    let rest = await db.getWord(gameID);
    rest = rest[0];
    
    /*
    
    rest.id: gameID
    rest.word: word
    rest.guesses: ''
    rest.secret: '------'
    
    */
   
    //Check if guessedLetter exists in guesses
    let guessArray = rest.guesses.split("");
    let secretArray = rest.secret.split("");
    let wordArray = rest.word.split("");
    let guessExists = guessArray.includes(guessedLetter);

    if(guessExists){
        msg = "Bokstaven har allerede blitt gjettet."
    } else {
        guessArray.push(guessedLetter);
        //Find and replace secret
        for(let i = 0; i < secretArray.length; i++){
            if(wordArray[i] === guessedLetter){
                secretArray[i] = guessedLetter;
            }
        }
    }

    //Update database
    guesses = guessArray.join("");
    secret = secretArray.join("");
    word = wordArray.join("");
    console.log(secret);
    
    let upd = await db.updateGuesses(gameID, guesses, secret);

    let response = {
        gameID: gameID,
        msg: msg, 
        secret: secret
    }

    res.status(200).json(response).end();
});

/**************************************************/


/**************************************************/
server.listen(server.get("port"), ()=>{
    console.log(`Listening on port ${server.get("port")}`);
});