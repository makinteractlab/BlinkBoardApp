let mySvg;

const sketch = new p5( p => {

    p.setup = () => {
      // canvas size is specified in the CSS file (size of div #one)
      p.createCanvas($("#mainSketch").width(), $("#mainSketch").height());

      mySvg = p.loadImage("assets/images/breadboard.svg");

    };
    
    p.draw = () => {
      
      p.background('#F2F2F2');      
      p.fill(255,0,0);
      p.noStroke();

      p.rect(p.mouseX, p.mouseY, 50, 10)

      
      p.imageMode(p.CENTER);
      // p.rect(p.mouseX, p.height/2, 100, 100);

      p.push();
      p.translate(p.width/2, p.height/2);
      p.scale(0.5)
      p.image(mySvg, 0, 0)
      p.pop();

    };

    p.mousePressed = () => {
      // console.log(port)
    }

  }, 'mainSketch');


