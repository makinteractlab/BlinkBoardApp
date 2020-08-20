const $ = require('jquery');
const shell = require('electron').shell;
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const common = require('./js/common');
const { lstat } = require('fs');
const { timeStamp } = require('console');

var firebase = require('firebase/app');
require('firebase/auth');
require('firebase/database');

const EXP_MONTH = 12;
const EXP_YEAR = 20;


let port;
let ready= false;


const userData = {}



$(document).ready(function () {
    firebase.initializeApp(common.firebaseConfig);

    initApp();
    initUI();

    // var database = firebase.database();
    // firebase.database().ref('users/' + 123).set({
    //     username: "asdf"
    //   });
});



function initApp() {
    // state check
    firebase.auth().onAuthStateChanged(function (user) {
        // we are not signed in
        if (!user) {
            console.log("no user");
            window.location.href = "signin.html";
        }

        $('#userEmail').text(user.email);
        userData.id = user.uid;
        userData.email = user.email;
        updateUserData();

        // If serial port was defined, attempt to connect
        firebase.database().ref('/users/' + userData.id).once('value').then(function(snapshot) {
            const portName = snapshot.val().port;
            if (portName!= undefined) setupSerialPort(portName);
        });

    });

    
}


function signOut() {
    if (firebase.auth().currentUser) {
        firebase.auth().signOut();
    }
}


function updateUserData()
{
    firebase.database().ref('users/' + userData.id).update(userData);
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

function initUI() {
    $('#accountLink').on('click', undefined);
    $('#signoutLink').on('click', signOut);

    $('#brightnessRange').on('input change', function(){
        if (!ready) return;
        writeJsonToPort({"cmd": "setBrightness", "value": this.value});
    });

    // Status bar
    $('#statusBar').hide();

    $('#showStatusbarCheck').on ('click', function(){
        if (this.checked) $('#statusBar').slideDown();
        else $('#statusBar').slideUp();
    });

    $('#statusBarSend').on('click', function(){
        if (!ready) return;
        const toSend = `${$('#statusBarInput').val()}\n`;
        port.write(toSend, function(err) {
            if (err) console.log('Error on write: ', err.message)
        });
    });
    
    // Open links to extetrnal browser
    $(document).on('click', 'a[href^="http"]', function (event) {
        event.preventDefault();
        shell.openExternal(this.href);
    });

    // Set connection
    setConnectionStatus ('disconnected');
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
    updateUserData();
}

function initSequence()
{
    const d= new Date();
    const init= {"cmd": "initialize", "month": d.getMonth()+1, "year": d.getFullYear()%100};
    // activation is used only once and it is hardcoded
    const activation = {cmd: "activate", month: EXP_MONTH, year: EXP_YEAR};
    writeJsonToPort({cmd: "status"}); // sent to avoid parse fail
    writeJsonToPort(activation); // set for ID220 fall 2020
    writeJsonToPort(init);
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
