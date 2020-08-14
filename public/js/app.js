const $ = require('jquery');
const shell = require('electron').shell;
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const common = require('./js/common');

const EXP_MONTH = 12;
const EXP_YEAR = 20;


let port;
let connected= false;



$(document).ready(function () {
    firebase.initializeApp(common.firebaseConfig);
    initApp();
    initUI();
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

    });
}


function signOut() {
    if (firebase.auth().currentUser) {
        firebase.auth().signOut();
    }
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
    $('#homeLink').on('click', showHomeScreen);
    $('#accountLink').on('click', undefined);
    $('#consoleLink').on('click', showConsoleScreen);
    $('#signout').on('click', signOut);

    // Open links to extetrnal browser
    $(document).on('click', 'a[href^="http"]', function (event) {
        event.preventDefault();
        shell.openExternal(this.href);
    });

    setConnectionStatus ('disconnected');
}

function showHomeScreen() {
    $('#homeScreen').show();
    $('#consoleScreen').hide();
}

function showConsoleScreen() {
    $('#homeScreen').hide();
    $('#consoleScreen').show();
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

    // Need to wait few seconds for Arduino to connect
    setTimeout( () => writeJsonToPort ({cmd:"status"}), 2000);
    setTimeout( initSequence, 4500);
}

function initSequence()
{
    const d= new Date();
    const init= {"cmd": "initialize", "month": d.getMonth(), "year": d.getFullYear()%100};
    // activation is used only once and it is hardcoded
    const activation = {cmd: "activate", month: EXP_MONTH, year: EXP_YEAR};
    writeJsonToPort(activation)
    writeJsonToPort(init)
    writeJsonToPort({cmd: "reset"})
}



function onSerialEvent (msg)
{
    let statusMessage ="";

    if (msg.status == "ready") {
        setConnectionStatus ("ready");
        statusMessage = "ready";
   
    } else if (msg.status == "expired"){
        setConnectionStatus ("expired");
        statusMessage = "Trial period expired";
    } 

    $('#statusBar').val (statusMessage);
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
            connected= true;
            $('#statusReady').show();
            $('#statusDisconnected').hide();
            $('#statusExpired').hide();
            break;
        case 'disconnected':
            connected= false;
            $('#statusReady').hide();
            $('#statusDisconnected').show();
            $('#statusExpired').hide();
            break;
        case 'expired':
            connected= false;
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
