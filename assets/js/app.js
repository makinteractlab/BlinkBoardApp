const $ = require('jquery');
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const Util = require('./assets/js/util');




const {
    lstat
} = require('fs');
const {
    timeStamp
} = require('console');


// Globals
let port;
let connection;
const firebase = Util.getFirebase();
const theUser = {}
const os = getOS();



$(document).ready(function () {
    
    $('#mainSketch').hide();

    // Set not ready
    connection = initConnection(false, function (isReady) {
        setConnectionStatus(isReady);

        showSketch(isReady);

        if (!isReady) return;

        // set brightness to level stored
        setBrightness(theUser.userData.settings.lightBg);

        // Save on db the new port
        theUser.userData.settings.port = port.path;
        updateUserData()
    });

    // Init
    initUI();

    // Input and Output controls
    // --CHANGE
    // initInOutControls();
});


// Attempt to sign in
firebase.auth().onAuthStateChanged(function (user) {
    // we are not signed in
    if (!user) {
        Util.log ("no user");
        window.location.href = "authentication.html";
        return;
    }

    firebase.database().ref('/users/' + user.uid).once('value').then(function (snapshot) {
        theUser.uid = user.uid;
        theUser.userData = snapshot.val();

        updateUI();
    });
});



function initInOutControls()
{
    inputChart= new InputChart(100); // update every 10th of second
   
    new OutDigitalChannel(0);
    new OutDigitalChannel(1);
    new OutAnalogChannel(2);
}



function signOut() {
    if (firebase.auth().currentUser) {
        firebase.auth().signOut();
    }
}


function updateUserData() {
    firebase.database().ref('users/' + theUser.uid).update(theUser.userData);
}

function saveBreadboardData(breadboardData) {
    firebase.database().ref(`users/${theUser.uid}/breadboard`).update(breadboardData);
}

function fetchBreadboardOnceAndUpdate(breadboard){
    firebase.database().ref(`users/${theUser.uid}/breadboard`).once('value').then(function (snapshot) {
        breadboard.json= snapshot.val();
    });
}

// Keep listenting to changes
function onBreadboardDataChange (callback){
    const breadboardUpdate = firebase.database().ref(`/users/${theUser.uid}/breadboard`);
    breadboardUpdate.on('value', function(snapshot) {
        callback(snapshot.val());
    });
}



function initConnection(ready, callback) {
    setConnectionStatus(ready);

    return new Proxy(JSON.parse('{"ready":' + ready + '}'), {
        set: function (target, property, value) {
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
    Util.openLinksInBrowser();

    // Animation off-canvas
    UIkit.util.on('#sideBar', 'shown', function () {
        UI.rotate('#arrow', 180, 200); // left
    });

    UIkit.util.on('#sideBar', 'hidden', function () {
        UI.rotate('#arrow', 0, 200); // right
    });

    // Hardware firmware click
    $('#statusReady').click(getFirmwareVersion);

    // Show update if available
    Util.getLatestAppReleaseInfo().then( (result) => {
        // Util.log (`Current ${Util.getCurrentAppVersion()}`)
        // Util.log (`Latest ${result.data.tag_name}`);
        
        if (Util.isDebugMode()) return;

        if (Util.getCurrentAppVersion() == result.data.tag_name) return;
        // show link
        $('#updateLink').removeAttr('hidden');
        // update link to correct zip file
        const os = getOS();
        const link = result.data.assets.filter( asset => asset.name == os+'.zip')[0].browser_download_url;
        if (link == undefined){
            // keep the default link
            return;
        }
        // replace link if found a suitable one
        $('#updateLink').attr('href', link);
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
    if (theUser.userData.settings.debugging) showStatusBar()
    else hideStatusBar();

    // Connect to serial port
    const lastPort = theUser.userData.settings.port
    setupSerialPort(lastPort)

    // Show screen by hiding splash
    $('#splashScreen').hide();
}



// Status bar
function initStatusBar() {

    // on click button
    $('#statusBarSend').on('click', function (e) {
        e.preventDefault(); // prevent reload
        sendStatusBarCommand()
    });

    // on enter
    $('#statusBarInput').on('submit', function (e) {
        e.preventDefault(); // prevent reload
    });
}

function sendStatusBarCommand() {
    if (!connection.ready) {
        UI.showWarning('BlinkBoard not connected');
        return;
    }

    const toSend = `${$('#statusBarInput').val()}\n`;
    writeToPort(toSend);
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

        setBrightness(this.value);
    });

    // on release
    $('#brightnessRange').on('click touchend', function () {
        updateUserData();
        $('#brightnessRange').val(theUser.userData.settings.lightBg)
    });
}

function setBrightness(value) {
    writeJsonToPort({
        "cmd": "setBrightness",
        "value": value
    });
}




// Serial
function initSerial() {

    // On selecting a port
    let events = 'change';
    if (os === 'Linux' || os === 'Windows') {
        events = 'change blur'
    }

    $("#portList").on(events, function () {
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
    });
}


function setupSerialPort(portName) {

    if (portName == undefined || portName == "") {
        return UI.showWarning("Select a valid serial port");
    }

    // disconnect from previous
    // None selected
    if (port) {

        // Disconnect from current
        connection.ready = false;

        port.close(function (err) {
            Util.log ('port closed:' + err, "Error");
        });
    }

    // attempt new connection
    port = new SerialPort(portName, {
        baudRate: 115200
    }, function (err) {
        if (err) {
            UI.showWarning("Cannot connect to saved port");
            theUser.userData.settings.port = ""; // reset to nothing the portname
            $("#portList").empty(); // clean port
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
        Util.log (`${line}`, "Serial_r");
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
        connection.ready = true;

    } else if (msg.version) {
        showFirmwareVersion(msg.version)

    } else {
        // sketch.onSerialEvent(msg); // send the result to sketch
        inputChart && inputChart.onSerialEvent(msg);
    }

    // Update status
    setStatusOutput(JSON.stringify(msg))
}



function writeJsonToPort(json) {
    if (!port) return;
    const toWrite = JSON.stringify(json) + "\n";
    Util.log (toWrite, "Serial_w")
    writeToPort(toWrite);
}

function writeToPort(msg) {
    port && port.write(msg, function (err) {
        if (err) Util.log ('Error on write: '+ err.message, "Error")
    });
}


function setConnectionStatus(readyStatus) {
    if (readyStatus) {
        $('#statusReady').show();
        $('#statusDisconnected').hide();
    } else {
        $('#statusReady').hide();
        $('#statusDisconnected').show();
    }
}


// Firmware version
function getFirmwareVersion() {
    writeJsonToPort({
        cmd: "version"
    });
}

function showFirmwareVersion(v) {
    UI.modalAlertWindow('Firmware', `The current software version is ${Util.getCurrentAppVersion()} and the firmware version is ${v}.`);
}


// sketch
function showSketch(visible) {
    if (visible) {
        $('#mainSketch').show();
        $('#backgroundImage').hide();
    } else {
        $('#mainSketch').hide();
        $('#backgroundImage').show();
    }
}


// Other helpers
function getOS() {
    var userAgent = window.navigator.userAgent,
        platform = window.navigator.platform,
        macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'],
        windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'],
        iosPlatforms = ['iPhone', 'iPad', 'iPod'],
        os = null;

    if (macosPlatforms.indexOf(platform) !== -1) {
        os = 'MacOS';
    } else if (iosPlatforms.indexOf(platform) !== -1) {
        os = 'iOS';
    } else if (windowsPlatforms.indexOf(platform) !== -1) {
        os = 'Windows';
    } else if (/Android/.test(userAgent)) {
        os = 'Android';
    } else if (!os && /Linux/.test(platform)) {
        os = 'Linux';
    }
    return os;
}

