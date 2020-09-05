var Chart = require('chart.js');


class InputChart {
    constructor() {

        this.a0Data = [86, 114, 106, 106, 107, 111, 133, 221, 783, 2478];
        this.a1Data = [282, 350, 411, 502, 2000, 809, 947, 1402, 3700, 5267];
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




$(document).ready(function () {

    new InputChart();
    
});