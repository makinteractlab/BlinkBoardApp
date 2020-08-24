const $ = require('jquery');
var common = require('./js/common');

var firebase = require('firebase/app');
require('firebase/auth');
require('firebase/database');




$(document).ready(function () {
    firebase.initializeApp(common.firebaseConfig);

    // Attempt to sign in
    firebase.auth().onAuthStateChanged(function (user) {

        if (user == null) return;

        if (!user.emailVerified) {
            modalAlertMessage('Verification required', 'Please check your email and verify your account.');
            $('#modalAlert button').on('click', () => showForm('signInForm'));

            user.sendEmailVerification();
            firebase.auth().signOut();

        } else {
            // go to the app
            window.location.href = "index.html";
        }
    });
});



function showForm(id) {
    $('form').not('#' + id).hide();
    $('#' + id).show();
    $('input[type=text').val('');
    $('input[type=password').val('');
}



function handleSignIn(email, password) {

    if (email == "" || email.length < 4) {
        modalAlertMessage('There was a problem', 'Please enter a valid email address.');
        return;
    }
    if (password == "" || password.length < 6) {
        modalAlertMessage('There was a problem', 'Please enter a valid password.');
        return;
    }

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then(function (result) {
            // signing in
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
            console.log("Account created");
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
            $('#modalAlert button').on('click', () => showForm('signInForm'));

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
    const email = $('#signUpEmail').val();
    const p1 = $('#signUpPassword1').val();
    const p2 = $('#signUpPassword2').val();

    if (email == "" ||
        !validateEmail(email) ||
        p1 == "" ||
        p1.length < 6 ||
        p1 != p2) {
        $('#signUpButton')[0].disabled = true;
    } else {
        $('#signUpButton')[0].disabled = false;
    }
}