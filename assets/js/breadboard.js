let sketch = new p5( p => {

    p.setup = () => {
      // canvas size is specified in the CSS file (size of div #one)
      p.createCanvas($("#mainSketch").width(), $("#mainSketch").height());
    };
  
    p.draw = () => {
      p.background(200);
      p.fill(255);
      p.noStroke();
      p.rectMode(p.CENTER);
      p.rect(p.width/2, p.height/2, 100, 100);
  
    };


  }, 'mainSketch');


