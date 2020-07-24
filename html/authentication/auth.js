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




function modalAlertMessage(title, msg) {
    $("#title").text(title);
    $("#message").text(msg);
    UIkit.modal('#modalAlert').show();
}

function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}


function checkSignUpInfo() {
    const email = $('#email').val();
    const p1 = $('#password1').val();
    const p2 = $('#password2').val();

    if (email == "" ||
        !validateEmail(email) ||
        p1 == "" ||
        p1.length < 6 ||
        p1 != p2) {
        $('#signupButton')[0].disabled = true;
    } else {
        $('#signupButton')[0].disabled = false;
    }
}


function toggleSignIn(email, password) {
    
    if (email == "" || email.length < 4) {
        modalAlertMessage('There was a problem', 'Please enter a valid email address.');
        return;
    }
    if (password == "" || password.length < 6) {
        modalAlertMessage('There was a problem', 'Please enter a password.');
        return;
    }

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then(function(result){
            window.location.href = "../index.html";
        })
        .catch(function (error) {

            var errorCode = error.code;
            var errorMessage = error.message;

            if (errorCode === 'auth/wrong-password') {
                modalAlertMessage('There was a problem', 'Wrong password.');
            } else {
                modalAlertMessage('There was a problem', errorMessage);
            }
            modalAlertMessage('There was a problem', error);
        });
}


function handleSignUp(email, password) {

    if (email == "" || email.length < 4) {
        modalAlertMessage('There was a problem', 'Please enter an email address.');
        return;
    }
    if (password == "" || password.length < 6) {
        modalAlertMessage('There was a problem', 'Please enter a password of at least 6 characters.');
        return;
    }

    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then(function (result) {
            modalAlertMessage('Account created', 'Go back to signing and login');
            $('#modalAlert button').on('click', () => window.location.href = "signin.html");
        })
        .catch(function (error) {

            var errorCode = error.code;
            var errorMessage = error.message;

            if (errorCode == 'auth/weak-password') {
                modalAlertMessage('There was a problem', 'The password is too weak.');
            } else {
                modalAlertMessage('There was a problem', errorMessage);
            }
            modalAlertMessage('There was a problem', error);
        });
}



function sendPasswordReset(email) {
    if (email == "" || email.length < 4) {
        modalAlertMessage('There was a problem', 'Please enter an email address.');
        return;
    }

    firebase.auth().sendPasswordResetEmail(email)
        .then(function () {
            modalAlertMessage('Password Reset Email Sent!', 'Check your email');

        }).catch(function (error) {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;

        
            if (errorCode == 'auth/invalid-email') {
                modalAlertMessage('There was a problem', errorMessage);
            } else if (errorCode == 'auth/user-not-found') {
                modalAlertMessage('There was a problem', errorMessage);
            }
            modalAlertMessage('There was a problem', error);
        });
}


function googleSignIn() {
    if (!firebase.auth().currentUser) {
        // [START createprovider]
        var provider = new firebase.auth.GoogleAuthProvider();
        // [END createprovider]
        // [START addscopes]
        provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
        // [END addscopes]
        // [START signin]
        firebase.auth().signInWithPopup(provider).then(function(result) {
          // This gives you a Google Access Token. You can use it to access the Google API.
          var token = result.credential.accessToken;
          // The signed-in user info.
          var user = result.user;
          // [START_EXCLUDE]
        //   document.getElementById('quickstart-oauthtoken').textContent = token;
          // [END_EXCLUDE]
        }).catch(function(error) {
          // Handle Errors here.
          var errorCode = error.code;
          var errorMessage = error.message;
          // The email of the user's account used.
          var email = error.email;
          // The firebase.auth.AuthCredential type that was used.
          var credential = error.credential;
          // [START_EXCLUDE]
          if (errorCode === 'auth/account-exists-with-different-credential') {
            alert('You have already signed up with a different auth provider for that email.');
            // If you are using multiple auth providers on your app you should handle linking
            // the user's accounts here.
          } else {
            console.error(error);
          }
          // [END_EXCLUDE]
        });
        // [END signin]
      } else {
        // [START signout]
        firebase.auth().signOut();
        // [END signout]
      }
      // [START_EXCLUDE]
    //   document.getElementById('quickstart-sign-in').disabled = true;
  }


$(document).ready(function () {
    firebase.initializeApp(firebaseConfig);
});