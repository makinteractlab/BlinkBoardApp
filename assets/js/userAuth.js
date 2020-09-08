const $ = require('jquery');
const Util = require('./assets/js/util');
const firebase = Util.getFirebase();


$(document).ready(function () {

    // signInForm, signUpForm, resetForm
    showForm('signInForm')

    // Sign in
    $('#signInButton').on('click', () => handleSignIn($('#signInEmail').val(), $('#signInPassword').val()));

    // Sign up
    $("#signUpButton").on('click', () => handleSignUp($('#signUpEmail').val(), $('#signUpPassword1').val()));
    $('#signUpEmail').on('change keyup paste', checkSignUpInfo);
    $('#signUpPassword1').on('change keyup paste', checkSignUpInfo);
    $('#signUpPassword2').on('change keyup paste', checkSignUpInfo);

    // Reset pw
    $("#resetFormButton").on('click', () => {
        sendPasswordReset($("#resetFormEmail").val());
    });

    Util.openLinksInBrowser();
});


// Attempt to sign in
firebase.auth().onAuthStateChanged(function (user) {

    if (user == null) return;

    if (!user.emailVerified) {
        UI.modalAlertMessage('Account created. Please check your email and verify your account.',
            'success',
            function () {
                showForm('signInForm')
            });

        // Need to verify account - signout
        user.sendEmailVerification();
        firebase.auth().signOut();
        return;

    } else {
        // Sign in
        // check if user exist in DB
        firebase.database().ref('/users/' + user.uid).once('value').then(function (snapshot) {
            let userData = snapshot.val();

            // init user the first time
            if (userData == null) {
                const userData = {
                    name: user.uid,
                    email: user.email,
                    avatar: "https://gravatar.com/avatar/" + Util.md5(user.email),
                    channel: "ID220",
                    settings: {
                        port: "",
                        lightBg: 20,
                        debugging: false
                    }
                };
                // make entry in db
                firebase.database().ref('users/' + user.uid).set(userData, function (error) {
                    if (error) {
                        console.log(error);
                    } else {
                        // Data saved successfully!
                        // go to the app
                        window.location.href = "index.html";
                    }
                });
            } else {
                // user exists
                // go to the app
                window.location.href = "index.html";
            }
        });
    }
});




function handleSignIn(email, password) {

    if (email == "" || email.length < 4) {
        UI.modalAlertMessage('Please enter a valid email address.', 'danger');
        return;
    }
    if (password == "" || password.length < 6) {
        UI.modalAlertMessage('Please enter a valid password.', 'danger');
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
                UI.modalAlertMessage('Wrong password.', 'danger');
            } else {
                UI.modalAlertMessage(errorMessage, 'danger');
            }
        });
}


function handleSignUp(email, password) {

    if (email == "" || email.length < 4) {
        UI.modalAlertMessage('Please enter an email address.', 'danger');
        return;
    }
    if (password == "" || password.length < 6) {
        UI.modalAlertMessage('Please enter a password of at least 6 characters.', 'danger');
        return;
    }

    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then(function (result) {

        })
        .catch(function (error) {

            var errorCode = error.code;
            var errorMessage = error.message;

            if (errorCode == 'auth/weak-password') {
                UI.modalAlertMessage('The password is too weak.', 'danger');
            } else {
                UI.modalAlertMessage(errorMessage, 'danger');
            }
        });
}



function sendPasswordReset(email) {
    if (email == "" || email.length < 4) {
        UI.modalAlertMessage('Please enter an email address.', 'danger');
        return;
    }

    firebase.auth().sendPasswordResetEmail(email)
        .then(function () {
            UI.modalAlertMessage('Password Reset Email Sent! Check your email',
                'success',
                function () {
                    showForm('signInForm')
                });

        }).catch(function (error) {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;


            if (errorCode == 'auth/invalid-email') {
                UI.modalAlertMessage(errorMessage, 'danger');
            } else if (errorCode == 'auth/user-not-found') {
                UI.modalAlertMessage(errorMessage, 'danger');
            }
        });
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

// switch between 'signInForm'. 'signUpForm' and 'resetForm'
// calls are made also in authentication.html
function showForm(id) {
    $('form').not('#' + id).hide();
    $('#' + id).show();
    $('input[type=text').val('');
    $('input[type=password').val('');
}


