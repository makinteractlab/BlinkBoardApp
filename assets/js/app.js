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
let connection;
const theUser = {}


$(document).ready(function () {

    $('#mainSketch').hide();

    // Set not ready
    connection= initConnection(false, function(isReady){
        setConnectionStatus(isReady);
        
        showSketch (isReady);

        if (!isReady) return;

        // Save on db the new port
        theUser.userData.settings.port = port.path;
        updateUserData()
    });

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


function initConnection (ready, callback) {
    setConnectionStatus(ready);

    return new Proxy(JSON.parse ('{"ready":' + ready + '}'), {
        set: function(target, property, value) {
            target[property] = value;
            callback(value);
        },
        get(target, phrase) { // intercept reading a property from dictionary
            if (phrase in target) { // if we have it in the dictionary
              return target[phrase]; // return the translation
            }
        }
    });
}



// UI

function initUI() {

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

    // Hardware firmware click
    $('#statusReady').click(getFirmwareVersion);
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
    if (theUser.userData.settings.debugging) showStatusBar()
    else hideStatusBar();

    // Connect to serial port
    const lastPort = theUser.userData.settings.port
    setupSerialPort (lastPort)

    // Show screen by hiding splash
    $('#splashScreen').hide();
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


function modalAlertMessage(title, msg) {
    $("#title").text(title);
    $("#message").text(msg);
    UIkit.modal('#modalAlert').show();
}


// Status bar
function initStatusBar() {
    
    // on click button
    $('#statusBarSend').on('click', function (e) {
        e.preventDefault();  // prevent reload
        sendStatusBarCommand()
    });

    // on enter
    $('#statusBarInput').on('submit', function (e) {
        e.preventDefault();  // prevent reload
    });

}

function sendStatusBarCommand() {
    if (!connection.ready) {
        warning('BlinkBoard not connected');
        return;
    }

    const toSend = `${$('#statusBarInput').val()}\n`;
    writeToPort (toSend);
}

function setStatusOutput(text) {
    $('#statusBarOutput').val(text);
}

function showStatusBar() {
    $('#statusBar').css('visibility', 'visible');
    $('#statusBar').show();
}

function hideStatusBar() {
    $('#statusBar').hide();
}



// Brightness Control
function initBrightnessControl() {

    $('#brightnessRange').on('input change', function () {
        if (!connection.ready) return;
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

        // Disconnect from current
        connection.ready= false;

        port.close(function (err) {
            console.log('port closed', err);
        });
        
    });
}


function setupSerialPort(portName) {

    if (portName==undefined || portName=="") {
        return warning("Select a valid serial port");
    }

    // attempt new connection
    port = new SerialPort(portName, {
        baudRate: 115200
    }, function (err) {
        if (err) {
            warning("Cannot connect to saved port");
            theUser.userData.settings.port= ""; // reset to nothing the portname
            updateUserData();
            return;
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

    if (msg.status == "ready") {
        connection.ready= true;

    } else if (msg.version) {
        showFirmwareVersion (msg.version)
    
    } else {
        sketch.onSerialEvent (msg); // send the result to sketch
    }

    // Update status
    setStatusOutput (JSON.stringify(msg))
}


function writeJsonToPort(json) {
    if (!port) return;
    const toWrite = JSON.stringify(json) + "\n";
    console.log(toWrite)
    writeToPort (toWrite);
}

function writeToPort(msg){
    port && port.write(msg, function (err) {
        if (err) console.log('Error on write: ', err.message)
    });
}


function setConnectionStatus(readyStatus) {
    if (readyStatus){
        $('#statusReady').show();
        $('#statusDisconnected').hide();
    }else{
        $('#statusReady').hide();
        $('#statusDisconnected').show();
    }
}


// Firmware version

function getFirmwareVersion()
{
    writeJsonToPort ({cmd:"version"});
}

function showFirmwareVersion (v)
{
    modalAlertMessage ('Firmware', `Your firmware is at version ${v}`);
}

// sketch
function showSketch (visible)
{
    if (visible){
        $('#mainSketch').show();
        $('#backgroundImage').hide();
    }
    else {
        $('#mainSketch').hide();
        $('#backgroundImage').show();
    }
}