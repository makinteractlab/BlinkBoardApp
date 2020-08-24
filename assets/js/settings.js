const $ = require('jquery');
const common = require('./assets/js/common');
const firebase = common.getFirebase();


$(document).ready(function () {

    $('#updateButton').on('click', function(){
        const name = $('#name').val();
        const debugCheck= $('#debug')[0].checked;

        const uid = firebase.auth().currentUser.uid;
        firebase.database().ref('/users/' + uid).child('name').set(name);
        firebase.database().ref('/users/' + uid).child('settings/debugging').set(debugCheck);

        // back to main
        window.location.href = "index.html";
    });

    $('#password').on('change keyup paste', function()
    {
        if ($(this).val().length > 0) $('#deleteButton').attr("disabled", false);
        else $('#deleteButton').attr("disabled", true);
    });

    $('#deleteButton').on('click', function(){
        const user = firebase.auth().currentUser;
        const password = $('#password').val();

        const credential = firebase.auth.EmailAuthProvider.credential(
            firebase.auth().currentUser.email, password);

        user.reauthenticateWithCredential(credential).then(function() {
            // User re-authenticated.

            // delete the account
            user.delete().then(function() {
                firebase.auth().signOut();
              }).catch(function(error) {
                console.log(error)
              });

          }).catch(function(error) {
            // An error happened.
          });
    });

    firebase.auth().onAuthStateChanged(function (user) {
      
        // we are not signed in - should not be here
        if (!user) {
            window.location.href = "authentication.html";
            return;
        }

        firebase.database().ref('/users/' + user.uid).once('value').then(function (snapshot) {
            const userData= snapshot.val();
            $('#email').val (userData.email);
            $('#name').val (userData.name);
            $('#debug')[0].checked= userData.debug;
        });
    });

});



