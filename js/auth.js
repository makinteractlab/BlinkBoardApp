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


/**
 * Handles the sign in button press.
 */




function toggleSignIn() {
    var email = document.getElementById('email').value;
    var password = document.getElementById('password').value;
    if (email.length < 4) {
        alert('Please enter an email address.');
        return;
    }
    if (password.length < 4) {
        alert('Please enter a password.');
        return;
    }
    // Sign in with email and pass.
    // [START authwithemail]
    firebase.auth().signInWithEmailAndPassword(email, password)
    // .then(function(result){
    //     // console.log(firebase.auth().currentUser.email)
    //     // $('#test').fadeOut(300);
    // })
    .catch(function (error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // [START_EXCLUDE]
        if (errorCode === 'auth/wrong-password') {
            alert('Wrong password.');
        } else {
            alert(errorMessage);
        }
        console.log(error);
        // [END_EXCLUDE]
    });
    // [END authwithemail]
    
}

/**
 * Handles the sign up button press.
 */
function handleSignUp() {
    let email = $("#signupEmail").val();
    let password = $("#signupPassword").val();

    if (email.length < 4) {
        alert('Please enter an email address.');
        return;
    }
    if (password.length < 4) {
        alert('Please enter a password.');
        return;
    }
    // Create user with email and pass.
    // [START createwithemail]
    firebase.auth().createUserWithEmailAndPassword(email, password).catch(function (error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // [START_EXCLUDE]
        if (errorCode == 'auth/weak-password') {
            alert('The password is too weak.');
        } else {
            alert(errorMessage);
        }
        console.log(error);
        // [END_EXCLUDE]
    });
    // [END createwithemail]
}


/*
function sendPasswordReset() {
    var email = document.getElementById('email').value;
    // [START sendpasswordemail]
    firebase.auth().sendPasswordResetEmail(email).then(function () {
        // Password Reset Email Sent!
        // [START_EXCLUDE]
        alert('Password Reset Email Sent!');
        // [END_EXCLUDE]
    }).catch(function (error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // [START_EXCLUDE]
        if (errorCode == 'auth/invalid-email') {
            alert(errorMessage);
        } else if (errorCode == 'auth/user-not-found') {
            alert(errorMessage);
        }
        console.log(error);
        // [END_EXCLUDE]
    });
    // [END sendpasswordemail];
}
*/
/**
 * initApp handles setting up UI event listeners and registering Firebase auth listeners:
 *  - firebase.auth().onAuthStateChanged: This listener is called when the user is signed in or
 *    out, and that is where we update the UI.
 */
function initApp() {
    // Listening for auth state changes.
    // [START authstatelistener]
    firebase.auth().onAuthStateChanged(function (user) {
        // [START_EXCLUDE silent]
        // document.getElementById('quickstart-verify-email').disabled = true;
        // [END_EXCLUDE]
        if (user) {
            // User is signed in.
            var displayName = user.displayName;
            var email = user.email;
            var emailVerified = user.emailVerified;
            var photoURL = user.photoURL;
            var isAnonymous = user.isAnonymous;
            var uid = user.uid;
            var providerData = user.providerData;

            user.updateProfile({ // <-- Update Method here

                displayName: "TestName",
                photoURL: "https://example.com/jane-q-user/profile.jpg"

            }).then(function () {

                // Profile updated successfully!
                //  "NEW USER NAME"

                var displayName = user.displayName;
                // "https://example.com/jane-q-user/profile.jpg"
                var photoURL = user.photoURL;


                window.location.href="console.html"
                

            }, function (error) {
                // An error happened.
            });


            // [START_EXCLUDE]
            console.log(JSON.stringify(user, null, '  '));
            // [END_EXCLUDE]
        } else {
            console.log("no user");
        }
        // [START_EXCLUDE silent]
        // [END_EXCLUDE]
    });
    // [END authstatelistener]
}


function checkSignUpInfo(){
    if (($('#signupEmail').val() == "") ||
       ($('#signupPassword').val() == "") ||
       ($('#signupPassword').val() != $('#signupPasswordConfirmed').val())) {
        $('#signupButton')[0].disabled= true;
       }else{
        $('#signupButton')[0].disabled= false;
       }
}


$(document).ready(function () {
    firebase.initializeApp(firebaseConfig);
    
    if (firebase.auth().currentUser) {
        // [START signout]
        firebase.auth().signOut();
        // [END signout]
    }

    // initApp();
    

    $("#signinButton").on('click', toggleSignIn);
    $("#signupButton").on('click', handleSignUp);

    $('#signupEmail').on('change keyup paste', checkSignUpInfo);
    $('#signupPassword').on('change keyup paste', checkSignUpInfo);
    $('#signupPasswordConfirmed').on('change keyup paste', checkSignUpInfo);

    
   
});