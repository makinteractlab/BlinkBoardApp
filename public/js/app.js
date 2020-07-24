const $ = require('jquery');
var common = require('./js/common');


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
    firebase.initializeApp(common.firebaseConfig);
    initApp();
});