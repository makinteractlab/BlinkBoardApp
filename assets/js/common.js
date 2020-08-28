const $ = require('jquery');
var firebase = require('firebase/app');
require('firebase/auth');
require('firebase/database');
var crypto = require('crypto');
const {
    Octokit
} = require("@octokit/rest");
var pjson = require('../../package.json');






module.exports = {
    firebaseConfig: {
        apiKey: "AIzaSyB3gZSdRbQZBcQFWfJYE8_giL-jr2TCcXY",
        authDomain: "blinkboard-c8374.firebaseapp.com",
        databaseURL: "https://blinkboard-c8374.firebaseio.com",
        projectId: "blinkboard-c8374",
        storageBucket: "blinkboard-c8374.appspot.com",
        messagingSenderId: "587052739775",
        appId: "1:587052739775:web:881bc0fe047818679bea0a"
    },
    debug: false,
    getFirebase: getFirebase,
    md5: md5,
    modalAlertMessage: modalAlertMessage,
    getAppVersion: getAppVersion,
    getAppReleaseInfo: getAppReleaseInfo
};




async function getAppReleaseInfo() {

    const octokit = new Octokit()
    const result = await octokit.request('GET /repos/{owner}/{repo}/releases/latest', {
        owner: 'makinteractlab',
        repo: 'BlinkBoardApp'
    });
    return result;
}

function getAppVersion()
{
    // access the version tag in package.json
    return pjson.version;
}


function getFirebase() {

    // init Firebase
    firebase.initializeApp(module.exports.firebaseConfig);
    return firebase;
}

function md5(string) {
    return crypto.createHash('md5').update(string).digest('hex');
}


// msg to write
// type is 'success', 'danger or default
function modalAlertMessage(msg, type, callBackOnClose) {

    // default
    const params = {
        message: msg,
        status: 'primary',
        pos: 'top-center',
        timeout: 2000
    };

    switch (type) {
        case 'success':
            params.message = `<span uk-icon='icon: check'></span> ${msg}`;
            params.status = 'success';
            break;
        case 'danger':
            params.message = `<span uk-icon='icon: warning'></span> ${msg}`;
            params.status = 'danger';
            break;
    }

    const notification = UIkit.notification(params);
    if (!callBackOnClose) return;

    UIkit.util.on(document, 'close', function (evt) {
        if (evt.detail[0] === notification) {
            callBackOnClose();
        }
    });
}