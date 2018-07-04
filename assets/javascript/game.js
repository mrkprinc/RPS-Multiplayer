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
firebase.auth().signInAnonymously();
var database = firebase.database();

// global variables
var gameID = null;
var playerID = null;
var playerName = null;
var opponentName = null;
var gameOn = false;
var openGame = [];
var wins = 0;
var losses = 0;

// EXECUTE ON LOAD

// start value event listener for open games
database.ref('openGame').on('value', function(snapshot) {
    // update local variable to match value in firebase
    openGame = snapshot.val().openGame;
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

$('#btn-enterNew').on('click', function() {
    $('.show-end').slideUp();
    enterGame();
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

    // enable rps buttons
    $('.rps-button').addClass('clickable');

    // message
    $('#div-message')
        .html('<span>1, 2, 3...choose!</span>')
        .slideDown();

    // turn off new player event listener
    database.ref('games/' + gameID + '/players').off('value');

    // game on = true and turn on listener
    gameOn = true;
    database.ref('games/' + gameID + '/gameOn').on('value', function(snapshot) {
        // if gameOn changes to false, end the game
        if(snapshot.val().gameOn === false) {
            gameOver();
        }
    })

    // exit game button
    $('#div-exitButton').on('click', function() {
        database.ref('games/' + gameID + '/gameOn').update({'gameOn': false});
    })

    // if user leaves the page, end game
    $(window).on('unload', function() {
        gameOver();
        database.ref('games/' + gameID + '/gameOn').update({'gameOn': false});
    })

    // start chat
    startChat();

    // hide start, show gameplay divs
    $('.show-start').slideUp();
    $('.show-play').slideDown();
    $('.show-message').slideDown();

    // rps button listener
    $('.rps-button').on('click', function() {

        if($(this).hasClass('clickable')) {
            // disable buttons until next round
            $('.rps-button').removeClass('clickable');
            // assign to variable
            var thisPlay = $(this).attr('data-rps');
            // display waiting message
            $('#div-message').html('<span>Waiting for ' + opponentName + '...');
            // push to database
            database.ref('games/' + gameID + '/round').push({'playerID': playerID, 'play': thisPlay});
        }

    })

    // listen for new play
    database.ref('games/' + gameID + '/round').on('value', function(snapshot) {

        // count plays, assign to local array variable
        var i = 0;
        var playArray = [];
        snapshot.forEach(function(childSnapshot) {
            playArray.push(childSnapshot.val());
            i++;
        })

        if(i === 2) {
            // if both players have chosen, evaluate and empty round
            playRound(playArray);
            database.ref('games/' + gameID + '/round').remove();
        }
    })
}

function playRound(arr) {

    // evaluate round -- selects array [outcome for first player, outcome for second player]
    var eval = [];
    var outcome = null;
    switch(arr[0].play) {
        case 'R':
            eval = [['tie', 'tie'], ['lose', 'win'], ['win', 'lose']];
            break;
        case 'P':
            eval = [['win', 'lose'], ['tie', 'tie'], ['lose', 'win']];
            break;
        case 'S':
            eval = [['lose', 'win'], ['win', 'lose'], ['tie', 'tie']];
            break;
    }
    switch(arr[1].play) {
        case 'R':
            eval = eval[0];
            break;
        case 'P':
            eval = eval[1];
            break;
        case 'S':
            eval = eval[2];
            break;
    }

    // if first player is this player, first outcome -- otherwise second
    if(arr[0].playerID === playerID) {
        outcome = eval[0];
    } else {
        outcome = eval[1];
    }

    // display outcome
    $('#div-message').html('<span>You ' + outcome + '!!</span>');
    var outcomeTimer = setTimeout(function() {
        $('#div-message').html('<span>1, 2, 3...choose!</span>');
    }, 1500);

    //update wins/losses
    if(outcome === 'win') {
        wins++;
        $('#span-wins').html('W: ' + wins);
    } else if(outcome === 'lose') {
        losses++;
        $('#span-losses').html('L: ' + losses);
    }

    // make rps buttons clickable
    $('.rps-button').addClass('clickable');
}

function gameOver() {
    $('.show-play').slideUp();
    $('.show-message').slideUp();
    $('.show-end').slideDown();
    $('#div-chat').addClass('fade');

    // turn off event listeners
    database.ref('games/' + gameID + '/gameOn').off('value');
    database.ref('games/' + gameID + '/round').off('value');
    database.ref('chat/' + gameID).off('child_added');
    $('#btn-chat').off('click');
    $('.rps-button').off('click');
    $(window).off('unload');
}

function startChat() {

    $('#chat-window').empty();
    $('#div-chat').removeClass('fade');

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

// submit when user presses enter
$('#input-name').keyup(function(event) {
    event.preventDefault();
    if(event.keyCode === 13) {
        $('#btn-enterGame').click();
        $(this).blur();
    }
})

$('#input-chat').keyup(function(event) {
    event.preventDefault();
    if(event.keyCode === 13) {
        $('#btn-chat').click();
    }
})

$('#input-name').focus();

})
// document onload 