const $ = require('jquery');
const common = require('./assets/js/common');
const firebase = common.getFirebase();


const modalAlertMessage = common.modalAlertMessage;


$(document).ready(function () {

    // Attempt to sign in
    firebase.auth().onAuthStateChanged(function (user) {

        if (user == null) return;

        if (!user.emailVerified) {
            modalAlertMessage(  'Account created. Please check your email and verify your account.', 
                                'success', 
                                function(){showForm('signInForm')});

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
                        avatar: "http://gravatar.com/avatar/" + common.md5(user.email),
                        role: "user",
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
});





function handleSignIn(email, password) {

    if (email == "" || email.length < 4) {
        modalAlertMessage('Please enter a valid email address.', 'danger');
        return;
    }
    if (password == "" || password.length < 6) {
        modalAlertMessage('Please enter a valid password.', 'danger');
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
                modalAlertMessage('Wrong password.', 'danger');
            } else {
                modalAlertMessage(errorMessage, 'danger');
            }
        });
}


function handleSignUp(email, password) {

    if (email == "" || email.length < 4) {
        modalAlertMessage('Please enter an email address.', 'danger');
        return;
    }
    if (password == "" || password.length < 6) {
        modalAlertMessage('Please enter a password of at least 6 characters.', 'danger');
        return;
    }

    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then(function (result) {

        })
        .catch(function (error) {

            var errorCode = error.code;
            var errorMessage = error.message;

            if (errorCode == 'auth/weak-password') {
                modalAlertMessage('The password is too weak.', 'danger');
            } else {
                modalAlertMessage(errorMessage, 'danger');
            }            
        });
}



function sendPasswordReset(email) {
    if (email == "" || email.length < 4) {
        modalAlertMessage('Please enter an email address.', 'danger');
        return;
    }

    firebase.auth().sendPasswordResetEmail(email)
        .then(function () {
            modalAlertMessage(  'Password Reset Email Sent! Check your email', 
                                'success',
                                function(){showForm('signInForm')});

        }).catch(function (error) {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;


            if (errorCode == 'auth/invalid-email') {
                modalAlertMessage(errorMessage, 'danger');
            } else if (errorCode == 'auth/user-not-found') {
                modalAlertMessage(errorMessage, 'danger');
            }
        });
}


// Open links to extetrnal browser
const shell = require('electron').shell;

$(document).on('click', 'a[href^="http"]', function (event) {
    event.preventDefault();
    shell.openExternal(this.href);
});


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

function showForm(id) {
    $('form').not('#' + id).hide();
    $('#' + id).show();
    $('input[type=text').val('');
    $('input[type=password').val('');
}