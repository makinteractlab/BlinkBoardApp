const $ = require('jquery');
const path = require('path');
global.appRoot = path.resolve(__dirname);

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

        if (user) {
            // User is signed in.
            var displayName = user.displayName;
            var email = user.email;
            var emailVerified = user.emailVerified;
            var photoURL = user.photoURL;
            var isAnonymous = user.isAnonymous;
            var uid = user.uid;
            var providerData = user.providerData;

            /*user.updateProfile({ // <-- Update Method here

                displayName: "TestName",
                photoURL: "https://example.com/jane-q-user/profile.jpg"

            }).then(function () {

                // Profile updated successfully!
                //  "NEW USER NAME"

                var displayName = user.displayName;
                // "https://example.com/jane-q-user/profile.jpg"
                var photoURL = user.photoURL;


                window.location.href = "console.html"


            }, function (error) {
                // An error happened.
            });*/

            console.log(user);
            console.log(JSON.stringify(user, null, '  '));

            var path = window.location.pathname;
            var page = path.split("/").pop();
            
            if (page != "home.html") window.location.href = "home.html"            

        } else {
            console.log("no user");
            window.location.href = "signin.html";
        }
    });
}



function signOut()
{
    console.log("out")
    if (firebase.auth().currentUser) {
        firebase.auth().signOut();
    }
}



$(document).ready(function () {
    firebase.initializeApp(firebaseConfig);
    initApp();
  });