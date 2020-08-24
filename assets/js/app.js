const $ = require('jquery');
const shell = require('electron').shell;
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const common = require('./assets/js/common');
const { lstat } = require('fs');
const { timeStamp } = require('console');

const firebase = common.getFirebase();

const EXP_MONTH = 12;
const EXP_YEAR = 20;


let port;
let ready= false;


const userData = {}


$(document).ready(function () {
    
    // Init
    initUI();

    // Attempt to sign in
    firebase.auth().onAuthStateChanged(function (user) {
        // we are not signed in
        if (!user) {
            console.log("no user");
            window.location.href = "authentication.html";
            return;
        }
        
        firebase.database().ref('/users/' + user.uid).once('value').then(function(snapshot) {
            userData.name= snapshot.val().name;
            userData.email = snapshot.val().email;
            userData.role = snapshot.val().role;
            userData.avatar = snapshot.val().avatar;
            userData.settings= snapshot.val().settings;

            updateUI();
        });
    });
});



function signOut() {
    if (firebase.auth().currentUser) {
        firebase.auth().signOut();
    }
}


function updateUserData(uid, userData)
{
    firebase.database().ref('users/' + uid).update(userData);
}


// Serial
SerialPort.list((err, ports) => {
    ports.forEach(element => {
        $("#portList").append(new Option(element.comName, element.comName));
    });
});

$("#portList").on('change', function () {
    const portName = $("#portList option:selected").text();
    setupSerialPort(portName);
});

$("#portList").on('click', function () {
	if (port === undefined) return;
	port.close(function (err) {
		console.log('port closed', err);
    });
    setConnectionStatus('disconnected');
});


// UI

function initUI()
{
    $('#brightnessRange').on('input change', function(){
        if (!ready) return;
        writeJsonToPort({"cmd": "setBrightness", "value": this.value});
    });

    $('#statusBar').hide();

    $('#statusBarSend').on('click', function(){
        if (!ready) return;
        const toSend = `${$('#statusBarInput').val()}\n`;
        port.write(toSend, function(err) {
            if (err) console.log('Error on write: ', err.message)
        });
    });
    
    // Side Links
    $('#signoutLink').on('click', signOut);

    // Open links to extetrnal browser
    $(document).on('click', 'a[href^="http"]', function (event) {
        event.preventDefault();
        shell.openExternal(this.href);
    });

    // Set connection status
    setConnectionStatus ('disconnected');


    // Animation off-canvas
    UIkit.util.on('#sideBar', 'shown', function () {
        rotateArrow (180, 200); // left
    });

    UIkit.util.on('#sideBar', 'hidden', function () {
        rotateArrow (0, 200); // right
    });
}


function updateUI() {

    // Sidebar
    $('#name').text(userData.name);
    $('#email').text(userData.email);
    $('#role').text(userData.role);
    const avatarImg= userData.avatar+'?s=200'; // size 200
    $('.avatar').attr("src", avatarImg)

    // Status bar
    if (userData.settings.debugging) $('#statusBar').slideDown();
    else $('#statusBar').slideUp();
}


function rotateArrow (angle, ms)
{
    $('#arrow').animate({  borderSpacing: angle }, {
        step: function(now,fx) {
          $(this).css('-webkit-transform','rotate('+now+'deg)'); 
          $(this).css('-moz-transform','rotate('+now+'deg)');
          $(this).css('transform','rotate('+now+'deg)');
        },
        duration:ms
    },'swing');
}


function setupSerialPort(portName) {
    port = new SerialPort(portName, {
        baudRate: 115200
    });

    // read listener
    const parser = new Readline()
    port.pipe(parser)

    parser.on('data', line => {
        console.log(`> ${line}`);
        onSerialEvent (JSON.parse(line));
    })

    // Need to wait few seconds (e.g. 3) for Arduino to connect
    setTimeout( initSequence, 3000);

    // Save on db
    userData.port = portName;
   // updateUserData();
}

function initSequence()
{
    writeJsonToPort({cmd: "status"}); // sent to avoid parse fail
    writeJsonToPort({cmd: "reset"});
}


let statusMessage ="...";

function onSerialEvent (msg)
{
    if (msg.status == "ready") {
        setConnectionStatus ("ready");
        statusMessage = "Ready";
   
    } else if (msg.status == "expired"){
        setConnectionStatus ("expired");
        statusMessage = "Trial period expired";
    } else{
        statusMessage = JSON.stringify(msg);
    }

    $('#statusBarOutput').val (statusMessage);
}




function writeJsonToPort (msg)
{
    const toWrite = JSON.stringify(msg)+"\n";
    console.log(toWrite)
    port.write(toWrite, function(err) {
		if (err) console.log('Error on write: ', err.message)
	});
}


function setConnectionStatus(status) {
    switch (status) {
        case 'ready':
            ready= true;
            $('#statusReady').show();
            $('#statusDisconnected').hide();
            $('#statusExpired').hide();
            break;
        case 'disconnected':
            ready= false;
            $('#statusReady').hide();
            $('#statusDisconnected').show();
            $('#statusExpired').hide();
            break;
        case 'expired':
            ready= false;
            $('#statusReady').hide();
            $('#statusDisconnected').hide();
            $('#statusExpired').show();
            break;
    }
}




// to keep?
$(document).ready(function () {

    /*UIkit.util.on('#menu', 'show', function () {
        // $('#arrowIcon')
        console.log("show")
    });

    UIkit.util.on('#menu', 'toggle', function () {
        console.log($('#arrowIcon').attr('uk-icon'));
        $('#arrowIcon').rotate(180, {
            duration: 2000,
            easing: 'swing'
        });
    });*/
});
