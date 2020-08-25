const sketch = new p5( p => {

    p.setup = () => {
      // canvas size is specified in the CSS file (size of div #one)
      p.createCanvas($("#mainSketch").width(), $("#mainSketch").height());



    };
    
    p.draw = () => {
      
      p.background('#F2F2F2');      
      p.fill(255,0,0);
      p.noStroke();
      p.rectMode(p.CENTER);
      p.rect(p.mouseX, p.height/2, 100, 100);
  
    };

    p.mousePressed = () => {
      // console.log(port)
    }

  }, 'mainSketch');


