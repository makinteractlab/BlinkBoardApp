var Chart = require('chart.js');


class InputChart {
    constructor() {


        $('#aChart').click( () => {
            console.log("sadf")
        });



        this.a0Data = [86, 114, 106, 106, 107, 111, 133, 221, 783, 2478];
        this.a1Data = [282, 350, 411, 502, 2000, 809, 947, 1402, 3700, 5000];
        this.a2Data = [168, 170, 178, 190, 203, 276, 408, 547, 675, 734];
        this.labels = [0, 1, 2, 3, 4, 5, 6, 7, 800, 9];

        new Chart($('#aChart')[0], {
            type: 'line',
            data: {
                labels: this.labels,
                datasets: [{
                        data: this.a0Data,
                        label: "A0",
                        borderColor: "#c45850",
                        fill: false,
                        cubicInterpolationMode: 'monotone'
                    },
                    {
                        data: this.a1Data,
                        label: "A1",
                        borderColor: "#3cba9f",
                        fill: false,
                        cubicInterpolationMode: 'monotone'
                    },
                    {
                        data: this.a2Data,
                        label: "A2",
                        borderColor: "#3e95cd",
                        fill: false,
                        cubicInterpolationMode: 'monotone'
                    }
                ]
            },
            options: {
                title: {
                    display: false
                },
                legend: {
                    display: false,
                    position: 'bottom',
                    labels: {
                        boxWidth: 10
                    }
                }
            }
        });

    }
}



class OutDigitalChannel{

    constructor(chNumber) // 0, 1, 2
    {
        this.channel = chNumber;
        this.status= $(`#d${chNumber}status`);
        this.low= $(`#d${chNumber}low`);
        this.high= $(`#d${chNumber}high`);
        this.pwm= $(`#d${chNumber}pwm`);
        this.slider= $(`#d${chNumber}slider`);
        this.duty= 1;

        this.low.change( () => {
            this.status.text("LOW");
            this.removeClassByPrefix(this.status[0], "accent");
            this.slider.attr('disabled', true);

            this.setLow();
        });

        this.high.change( () => {
            this.status.text("HIGH");
            $("accent").removeClass();
            this.removeClassByPrefix(this.status[0], "accent");
            this.status.addClass("accentRed");
            this.slider.attr('disabled', true);

            this.setHigh();
        });

        this.pwm.change( () => {
            this.status.text(`${this.duty}%`);
            this.slider.removeAttr('disabled');
            this.removeClassByPrefix(this.status[0], "accent");
            this.status.addClass("accentBlue");

            this.setPwm();
        });

        this.slider.on('input change', () => {
            this.duty= this.slider.val();
            this.status.text(`${this.duty}%`);

            this.setPwm();
        });

    }

    removeClassByPrefix(el, prefix) {
        var regx = new RegExp('\\b' + prefix + '.*?\\b', 'g');
        el.className = el.className.replace(regx, '');
        return el;
    }

    setLow()
    {
        writeJsonToPort({
            "cmd": "setLow",
            "pin": `D${this.channel}`
        });
    }

    setHigh()
    {
        writeJsonToPort({
            "cmd": "setHigh",
            "pin": `D${this.channel}`
        });
    }

    setPwm()
    {
        writeJsonToPort({
            "cmd": "setPwm",
            "pin": `D${this.channel}`,
            "duty": this.duty
        });
    }
}

class OutAnalogChannel {

    constructor(chNumber){
        this.channel = chNumber;
        this.status= $(`#d${chNumber}status`);
        this.slider= $(`#d${chNumber}slider`);
        this.volt= 0;

        this.slider.on('input change', () => {
            this.volt= this.slider.val();
            this.status.text(`${this.volt}V`);

            // set voltage
            writeJsonToPort({
                "cmd": "setV",
                "value": this.volt*1000
            });
        });
    }

    
}







$(document).ready(function () {

    new InputChart();
   
    new OutDigitalChannel(0);
    new OutDigitalChannel(1);
    new OutAnalogChannel(2);


});
