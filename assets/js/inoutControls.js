var Chart = require('chart.js');

let inputChart; // global can be accessed in app.js


class InputChart {
    
    constructor(refreshRate) {

        this.rawData= []
        this.rawData["A0"] = Array(10).fill(0);
        this.rawData["A1"] = Array(10).fill(0);
        this.rawData["A2"] = Array(10).fill(0);

        this.refreshRate = refreshRate; // every 10th of second
        this.refreshRateDBupdate = 1000; // update db every second

        this.active= true;

        // Keeep 
        this.latest = {"A0": 0, "A1": 0, "A2": 0};
        setInterval ( () => {
            updateAnalogInputData (this.latest);
        }, this.refreshRateDBupdate);


        

        $('#aChart').click( () => {
            this.active= false;
            $('#pauseOverlay').removeAttr('hidden');
        });

        $('#pauseOverlay').click ( () => 
        {
            this.active= true;
            $('#pauseOverlay').attr('hidden', 'true');
        });

        $('#a0check').change( () => {
            if ($('#a0check').is(':checked')){
                this.addDataset (this.rawData["A0"], "A0", "#c45850");
            }else{
                this.removeDataset("A0")
            }
            this.chart.update();
        });

        $('#a1check').change( () => {
            if ($('#a1check').is(':checked')){
                this.addDataset (this.rawData["A1"], "A1", "#3cba9f");
            }else{
                this.removeDataset("A1")
            }
            this.chart.update();
        });

        $('#a2check').change( () => {
            if ($('#a2check').is(':checked')){
                this.addDataset (this.rawData["A2"], "A2", "#3e95cd");
            }else{
                this.removeDataset("A2")
            }
            this.chart.update();
        });


        // Sample analog channel
        setInterval(() => {
            if (!this.active) return;
            writeJsonToPort({"cmd": "analogRead", "samples": "10"});
        }, this.refreshRate);

        
        // crate the chart
        this.chart= new Chart($('#aChart')[0], {
            type: 'line',
            data: {
                labels: Array(10).fill(0), // none shown but need for thicks
                datasets: [{
                        data: this.rawData["A0"],
                        label: "A0",
                        borderColor: "#c45850",
                        fill: false,
                        cubicInterpolationMode: 'monotone'
                    },
                    {
                        data: this.rawData["A1"],
                        label: "A1",
                        borderColor: "#3cba9f",
                        fill: false,
                        cubicInterpolationMode: 'monotone'
                    },
                    {
                        data: this.rawData["A2"],
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
                animation: {
                    duration: 0
                },
                legend: {
                    display: false,
                    position: 'bottom',
                    labels: {
                        boxWidth: 10
                    }
                },
                scales: {
                    yAxes: [{
                        id: 'first-y-axis',
                        type: 'linear',
                        gridLines: {
                            display: false
                        },
                        ticks: {
                            max: 5000,
                            min: 0,
                            stepSize: 1000
                        }
                    }],
                    xAxes: [{
                        ticks: {
                            display: false //remove labels
                        }
                    }]
                }
            }
        });

    }

    addDataset (data, label, color){
        const dtset = {
            data: data,  // deep copy
            label: label,
            borderColor: color,
            fill: false,
            cubicInterpolationMode: 'monotone'
        }
        this.chart.data.datasets.push(dtset);
    }

    removeDataset (label){
        const ds= this.chart.data.datasets;
        ds.splice(ds.findIndex(e => e.label === label),1);
    }

    onSerialEvent(msg){
        if (msg==undefined) return false;
        if(msg.ack !== "analogRead") return false; // not for me

        this.rawData["A0"].shift();
        this.rawData["A0"].push(msg.A0);

        this.rawData["A1"].shift();
        this.rawData["A1"].push(msg.A1);

        this.rawData["A2"].shift();
        this.rawData["A2"].push(msg.A2);

        this.chart.data.datasets.forEach((dataset) => {
            dataset.data = [...this.rawData[dataset.label]];
          });

        this.chart.update();

        // also update the inner record
        this.latest = {"A0": msg.A0, "A1": msg.A1, "A2": msg.A2};

        return true;
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







