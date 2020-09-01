const $ = require('jquery');
const Util = require('./assets/js/util');
const firebase = Util.getFirebase();


$(document).ready(function () {

    $('#updateButton').on('click', function () {
        const name = $('#name').val();
        const debugCheck = $('#debug')[0].checked;

        const uid = firebase.auth().currentUser.uid;
        firebase.database().ref('/users/' + uid).child('name').set(name);
        firebase.database().ref('/users/' + uid).child('settings/debugging').set(debugCheck);

        // back to main
        window.location.href = "index.html";
    });


    $('#password').on('change keyup paste', function () {
        if ($(this).val().length > 0) $('#deleteButton').attr("disabled", false);
        else $('#deleteButton').attr("disabled", true);
    });

    
    $('#deleteButton').on('click', function () {
        const user = firebase.auth().currentUser;
        const password = $('#password').val();

        const credential = firebase.auth.EmailAuthProvider.credential(
            firebase.auth().currentUser.email, password);

        user.reauthenticateWithCredential(credential).then(function () {
            // User re-authenticated.

            // delete the account
            user.delete().then(function () {
                UI.modalAlertMessage('Account successfully deleted', 'success', 
                                function(){firebase.auth().signOut()});

            }).catch(function (error) {
                UI.modalAlertMessage(error, 'danger');
            });

        }).catch(function (error) {
            UI.modalAlertMessage(error, 'danger');
        });
    });
});


// On status changes
firebase.auth().onAuthStateChanged(function (user) {

    // we are not signed in - should not be here
    if (!user) {
        window.location.href = "authentication.html";
        return;
    }

    firebase.database().ref('/users/' + user.uid).once('value').then(function (snapshot) {
        const userData = snapshot.val();
        $('#email').val(userData.email);
        $('#name').val(userData.name);
        $('#debug')[0].checked = userData.settings.debugging;

        $('#updateButton').attr("disabled", false);
    });
});
