const $ = require('jquery');

var firebaseConfig = {
    apiKey: "AIzaSyB3gZSdRbQZBcQFWfJYE8_giL-jr2TCcXY",
    authDomain: "blinkboard-c8374.firebaseapp.com",
    databaseURL: "https://blinkboard-c8374.firebaseio.com",
    projectId: "blinkboard-c8374",
    storageBucket: "blinkboard-c8374.appspot.com",
    messagingSenderId: "587052739775",
    appId: "1:587052739775:web:881bc0fe047818679bea0a"
};



function initApp() {

    firebase.auth().onAuthStateChanged(function (user) {
        // we are not signed in
        if (!user) {
            console.log("no user");
            window.location.href = "signin.html";
        }
    });
}


function signOut() {
    if (firebase.auth().currentUser) {
        firebase.auth().signOut();
    }
}



$(document).ready(function () {
    firebase.initializeApp(firebaseConfig);
    initApp();
});