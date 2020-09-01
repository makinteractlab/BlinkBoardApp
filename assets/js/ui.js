class UI {
    static rotate(id, angle, ms) {
        $(id).animate({
            borderSpacing: angle
        }, {
            step: function (now, fx) {
                $(this).css('-webkit-transform', 'rotate(' + now + 'deg)');
                $(this).css('-moz-transform', 'rotate(' + now + 'deg)');
                $(this).css('transform', 'rotate(' + now + 'deg)');
            },
            duration: ms
        }, 'swing');
    }

    static showWarning(text) {
        UIkit.notification(`<span uk-icon='icon: warning'></span> ${text}`, {
            status: 'warning'
        })
    }


    // msg to write
    // type is 'success', 'danger or default
    static modalAlertMessage(msg, type, callBackOnClose) {

        // default
        const params = {
            message: msg,
            status: 'primary',
            pos: 'top-center',
            timeout: 2000
        };

        switch (type) {
            case 'success':
                params.message = `<span uk-icon='icon: check'></span> ${msg}`;
                params.status = 'success';
                break;
            case 'danger':
                params.message = `<span uk-icon='icon: warning'></span> ${msg}`;
                params.status = 'danger';
                break;
        }

        const notification = UIkit.notification(params);
        if (!callBackOnClose) return;

        UIkit.util.on(document, 'close', function (evt) {
            if (evt.detail[0] === notification) {
                callBackOnClose();
            }
        });
    }


    static modalAlertWindow(title, msg) {
        $("#title").text(title);
        $("#message").text(msg);
        UIkit.modal('#modalAlert').show();
    }
}