const $ = require('jquery');
const shell = require('electron').shell;
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const common = require('./assets/js/common');
const {
    lstat
} = require('fs');
const {
    timeStamp
} = require('console');

const firebase = common.getFirebase();


let port;
let ready = false;

const theUser = {}


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

        firebase.database().ref('/users/' + user.uid).once('value').then(function (snapshot) {
            theUser.uid = user.uid;
            theUser.userData = snapshot.val();

            updateUI();
        });
    });
});



function signOut() {
    if (firebase.auth().currentUser) {
        firebase.auth().signOut();
    }
}


function updateUserData() {
    firebase.database().ref('users/' + theUser.uid).update(theUser.userData);
}





// UI

function initUI() {

    // Set connection status
    setConnectionStatus('disconnected');

    // Controls
    initStatusBar();
    initBrightnessControl();
    initSerial();

    // Side Links
    $('#signoutLink').on('click', signOut);

    // Open links to extetrnal browser
    $(document).on('click', 'a[href^="http"]', function (event) {
        event.preventDefault();
        shell.openExternal(this.href);
    });

    // Animation off-canvas
    UIkit.util.on('#sideBar', 'shown', function () {
        rotateArrow(180, 200); // left
    });

    UIkit.util.on('#sideBar', 'hidden', function () {
        rotateArrow(0, 200); // right
    });
}

function updateUI() {

    // Sidebar
    $('#name').text(theUser.userData.name);
    $('#email').text(theUser.userData.email);
    $('#role').text(theUser.userData.role);
    const avatarImg = theUser.userData.avatar + '?s=200'; // size 200
    $('.avatar').attr("src", avatarImg)

    // Settings from recorded values
    $('#brightnessRange').val(theUser.userData.settings.lightBg);

    // Status bar
    if (theUser.userData.settings.debugging) showStatusBar();
    else hideStatusBar();

    // Connect to serial port
    const lastPort = theUser.userData.settings.port
    if (lastPort!=undefined) setupSerialPort (lastPort)
}


function rotateArrow(angle, ms) {
    $('#arrow').animate({
        borderSpacing: angle
    }, {
        step: function (now, fx) {
            $(this).css('-webkit-transform', 'rotate(' + now + 'deg)');
            $(this).css('-moz-transform', 'rotate(' + now + 'deg)');
            $(this).css('transform', 'rotate(' + now + 'deg)');
        },
        duration: ms
    }, 'swing');
}


function warning(text) {
    UIkit.notification(`<span uk-icon='icon: warning'></span> ${text}`, {
        status: 'warning'
    })
}

// Status bar
function initStatusBar() {
    $('#statusBar').hide();

    // on click button
    $('#statusBarSend').on('click', function () {
        sendStatusBarCommand()
    });

    // on enter
    $('#statusBarInput').on('submit', function (e) {
        sendStatusBarCommand()
    });
}

function sendStatusBarCommand() {
    if (!ready) {
        warning('BlinkBoard not connected');
        return;
    }

    const toSend = `${$('#statusBarInput').val()}\n`;
    port.write(toSend, function (err) {
        if (err) console.log('Error on write: ', err.message)
    });
}

function setStatusOutput(text) {
    $('#statusBarOutput').val(text);
}

function showStatusBar() {
    $('#statusBar').slideDown();
}

function hideStatusBar() {
    $('#statusBar').slideUp();
}



// Brightness Control
function initBrightnessControl() {

    $('#brightnessRange').on('input change', function () {
        if (!ready) return;
        theUser.userData.settings.lightBg = this.value;

        writeJsonToPort({
            "cmd": "setBrightness",
            "value": this.value
        });
    });

    // on release
    $('#brightnessRange').on('click touchend', function () {
        updateUserData();
        $('#brightnessRange').val(theUser.userData.settings.lightBg)
    });

}



// Serial
function initSerial() {

    // On selecting a port
    $("#portList").on('change', function () {
        const portName = $("#portList option:selected").text();
        setupSerialPort(portName);
    });

    // on clicking (reset and list options)
    $("#portList").on('click', function () {

        // Reupdate the list on click
        SerialPort.list((err, ports) => {
            $("#portList").empty();
            ports.forEach(element => {
                $("#portList").append(new Option(element.comName, element.comName));
            });
        });

        // None selected
        if (port === undefined) return;

        port.close(function (err) {
            console.log('port closed', err);
        });
        setConnectionStatus('disconnected');
    });

}


function setupSerialPort(portName) {

    port = new SerialPort(portName, {
        baudRate: 115200
    }, function (err) {
        if (err) {
            return console.log('Error: ', err.message)
        }
    })

    // Set port
    $("#portList").empty().append(new Option(portName, portName));

    // read listener
    const parser = new Readline()
    port.pipe(parser)

    parser.on('data', line => {
        console.log(`> ${line}`);
        onSerialEvent(JSON.parse(line));
    })

    // Need to wait few seconds (e.g. 3) for Arduino to connect
    setTimeout(initSequence, 100);

    // Save on db
    theUser.userData.settings.port = portName;
    updateUserData()
}


function initSequence() {
    writeJsonToPort({
        cmd: "status"
    }); // sent to avoid parse fail
    writeJsonToPort({
        cmd: "status"
    });
    writeJsonToPort({
        cmd: "reset"
    });
}


function onSerialEvent(msg) {
    let statusMessage = "...";

    if (msg.status == "ready") {
        setConnectionStatus("ready");
        statusMessage = "Ready";

    } else if (msg.status == "expired") {
        setConnectionStatus("expired");
        statusMessage = "Trial period expired";
    } else {
        statusMessage = JSON.stringify(msg);
    }

    $('#statusBarOutput').val(statusMessage);
}




function writeJsonToPort(msg) {
    const toWrite = JSON.stringify(msg) + "\n";
    console.log(toWrite)
    port.write(toWrite, function (err) {
        if (err) console.log('Error on write: ', err.message)
    });
}


function setConnectionStatus(status) {
    switch (status) {
        case 'ready':
            ready = true;
            $('#statusReady').show();
            $('#statusDisconnected').hide();
            $('#statusExpired').hide();
            break;
        case 'disconnected':
            ready = false;
            $('#statusReady').hide();
            $('#statusDisconnected').show();
            $('#statusExpired').hide();
            break;
        case 'expired':
            ready = false;
            $('#statusReady').hide();
            $('#statusDisconnected').hide();
            $('#statusExpired').show();
            break;
    }
}