$(document).ready(function() {

$('#div-mainPlay > div').hide();

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

        // display waiting message
        $('#div-message')
            .html('<span>Waiting for second player...</span>')
            .slideDown();

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

        // loop players - count players, get opponentName
        var i = 0;
        snapshot.forEach(function(childSnapshot) {
            i++;

            // get opponent name
            if(childSnapshot.val().id !== playerID) {
                opponentName = childSnapshot.val().name;
            }
        })

        if(i === 2) {
            // if there are two players start game
            startGame();

        } else if(i > 2) {
            // if more than two players have joined the same game (error)
            gameOver();
        }

    })

}

function startGame() {

    // add player and opponent names to display
    $('#span-name').html(playerName);
    $('#span-opponent').html(opponentName);
    
    // message
    $('#div-message')
        .html('<span>1, 2, 3...choose!</span>')
        .slideDown();

    // turn off openGame and new player event listener
    database.ref('openGame').off('value');
    database.ref('games/' + gameID + '/players').off('value');

    // game on = true and turn on listener
    gameOn = true;
    database.ref('games/' + gameID + '/gameOn').on('value', function(snapshot) {

        // if gameOn changes to false, end the game
        if(snapshot.val().gameOn === false) {
            endGame();
        }
    })

    // start chat
    startChat();

    // hide start, show gameplay divs
    $('.show-start').slideUp();
    $('.show-play').slideDown();

    // rps button listener
    $('.rps-button').on('click', function() {

    })
}

function gameOver() {
    console.log('GAME OVER');
}

function startChat() {

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
}

// EXECUTE ON LOAD

// $('#div-mainPlay > div').hide();
$('.show-start').slideDown();


})
// document onload 