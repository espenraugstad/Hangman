const pg = require("pg");

class StorageHandler {

    constructor(credentials){
        this.credentials = {
            connectionString: credentials,
            ssl: {
                rejectUnauthorized: false
            }
        };
    }

    async saveGame(word, guesses, secret){
        //Convert guesses-array in to a string
        let guessString = guesses.join("");
        let result = null;
        const client = new pg.Client(this.credentials);
        try{
            await client.connect();
            try{
                result = await client.query('INSERT INTO "public"."Games"("word","guesses","secret") VALUES($1, $2, $3) RETURNING "id"',[word, guessString, secret]);
            } catch (err){
                console.log(err);
            }
            result = result.rows[0].id;
            client.end();
        } catch (err){
            client.end();
            result = err;
        }

        return result;
    }

    async getWord(gameID){
        const client = new pg.Client(this.credentials);
        let result = null;
        await client.connect();
        try{
            result = await client.query('SELECT * FROM "public"."Games" WHERE id=$1',[gameID]);
            //console.log(result.rows[0]);
            client.end();
        } catch (err){
            console.log(err);
        }

        return result.rows;
    }

    async updateGuesses(gameID, guesses, secret){
        const client = new pg.Client(this.credentials);
        let result = null;
        await client.connect();

        const query = {
            text: 'UPDATE "public"."Games" SET guesses=$1, secret=$2 WHERE id=$3',
            values: [guesses, secret, gameID]
        }

        try {
            result = await client.query(query);
            client.end();
        } catch (err) {
            console.log(err);
        }

        return result.rows;
    }
}

module.exports = StorageHandler;