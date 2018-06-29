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
database.ref().update({'openGame': [false]});

database.ref('openGame').on('value', function(snapshot) {
    // update local variable to match value in firebase
    openGame = snapshot.val();
    console.log(openGame);
})

// CHAT

// chat enter button
$('#btn-chat').on('click', function() {

    if(gameOn === true) {
        // get new chat from input field
        var thisMsg = $('#input-chat').val().trim();
        // push to database at chat/game reference
        database.ref('chat/' + gameID).push({'player': playerID[1], 'msg': thisMsg});
        //clear input field
        $('#input-chat').val('');
    }

})

// chat database event listen
database.ref('chat/' + gameID).on('child_added', function(snapshot) {
    // format new msg for display
    var msgString = '<b>' + snapshot.val().player + ':</b> ' + snapshot.val().msg;
    
    // append new span to chat window
    var newSpan = $('<span>');
    newSpan
        .html(msgString)
        .prependTo($('#chat-window'));
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

        // add player
        // if openGame[0] is false, no available spot in an open game - start new game
        if(openGame[0] === false) {
            // push new game, capture reference key
            gameID = database.ref('games').push({
                'players':{0: playerID},
                'gameOn': false}).key;

            // ***TEMP***
            database.ref('games/' + gameID + '/players').update({1: 'test'});
        } 

        //turn off openGame event listener
        database.ref('openGame').off('value');

        //create gameOn event listener
        database.ref('games/' + gameID + '/gameOn')
    }
})


// EXECUTE ON LOAD

$('#div-userEnter').removeClass('hide');

})

