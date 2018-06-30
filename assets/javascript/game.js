$(document).ready(function() {


// Initialize Firebase
var config = {
    apiKey: "AIzaSyClcUUWciRdqB5IhC3yDyqwgdx9m1syjAY",
    authDomain: "rps-multiplayer-3a589.firebaseapp.com",
    databaseURL: "https://rps-multiplayer-3a589.firebaseio.com",
    projectId: "rps-multiplayer-3a589",
    storageBucket: "",
    messagingSenderId: "100230497924"
};
firebase.initializeApp(config);
var database = firebase.database();

// global variables
var gameID = null;
var playerID = null;
var playerName = null;
var opponentName = null;
var gameOn = false;
var openGame = [];

// EXECUTE ON LOAD

// start value event listener for open games

// ***TEMP***
database.ref('openGame').update({'openGame': [false]});

database.ref('openGame').on('value', function(snapshot) {
    // update local variable to match value in firebase
    openGame = snapshot.val().openGame;
    console.log(openGame);
})


// ENTER GAME

// enter game button click
$('#btn-enterGame').on('click', function() {

    var nameEntered = $('#input-name').val().trim();
    if(nameEntered !== '') {
        // store name in local variable
        playerName = nameEntered;
        // push new user to database, capture ID
        playerID = database.ref('players').push({'name': playerName}).key;

        enterGame();

        // clear field
        $('#input-name').val('');
    }
})

function enterGame() {

    // add player
    // if openGame[0] is false, no available spot in an open game - start new game
    if(openGame[0] === false) {
        // push new game, capture reference key
        gameID = database.ref('games').push({'gameOn': false}).key;

        // push this player
        database.ref('games/' + gameID + '/players').push({'id': playerID, 'name': playerName});

        // change database openGame
        database.ref('openGame').update({'openGame': [true, gameID]});

    } else if(openGame[0] === true) {

        console.log('openGame true');

        // join open game
        gameID = openGame[1];
        database.ref('games/' + gameID + '/players').push({'id': playerID, 'name': playerName});

        //update gameOn
        database.ref('games/' + gameID + '/gameOn').update({'gameOn': true});
        
        // change database openGame
        database.ref('openGame').update({'openGame': [false]});
    }

    // event listener for players added
    database.ref('games/' + gameID + '/players').on('value', function(snapshot) {

        // count players
        var i = 0;
        snapshot.forEach(function(childSnapshot) {
            console.log('child --');
            console.log(childSnapshot.val());

            i++;
        })

        // if there are two players start game
        if(i === 2) {
            startGame();
        }

    })

}

function startGame() {

    //turn off openGame and new player event listener
    database.ref('openGame').off('value');
    database.ref('games/' + gameID + '/players').off('child_added');

    gameOn = true;


    // CHAT

    // chat enter button
    $('#btn-chat').on('click', function() {

        if(gameOn === true) {
            // get new chat from input field
            var thisMsg = $('#input-chat').val().trim();
            // push to database at chat/game reference
            database.ref('chat/' + gameID).push({'player': playerName, 'msg': thisMsg});
            //clear input field
            $('#input-chat').val('');
        }

    })

    //chat event listener
    database.ref('chat/' + gameID).on('child_added', function(snapshot) {
        // format new msg for display
        console.log(snapshot.val());
        var msgString = '<b>' + snapshot.val().player + ':</b> ' + snapshot.val().msg;
        
        // append new span to chat window
        var newSpan = $('<span>');
        newSpan
            .html(msgString)
            .prependTo($('#chat-window'));
    })

    console.log('start game');
    console.log(playerName);
    console.log(opponentName);
}


// EXECUTE ON LOAD

$('#div-userEnter').removeClass('hide');

})

