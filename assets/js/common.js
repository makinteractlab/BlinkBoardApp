const $ = require('jquery');
var firebase = require('firebase/app');
require('firebase/auth');
require('firebase/database');
var crypto = require('crypto');


module.exports = {
    firebaseConfig : {
        apiKey: "AIzaSyB3gZSdRbQZBcQFWfJYE8_giL-jr2TCcXY",
        authDomain: "blinkboard-c8374.firebaseapp.com",
        databaseURL: "https://blinkboard-c8374.firebaseio.com",
        projectId: "blinkboard-c8374",
        storageBucket: "blinkboard-c8374.appspot.com",
        messagingSenderId: "587052739775",
        appId: "1:587052739775:web:881bc0fe047818679bea0a"
    },
    debug: true,
    getFirebase: getFirebase,
    md5:md5
};


function getFirebase()
{
    // init Firebase
    firebase.initializeApp(module.exports.firebaseConfig);
    return firebase;
}

function md5(string) {
    return crypto.createHash('md5').update(string).digest('hex');
}

