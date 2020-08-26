const settings = {
  breadBoardSize: 300,
  ledSize: 30,
  ledStartCoord: {
    x: 51,
    y: 148
  },
  ledVgap: 37,
  ledHgap: 510
}



const sketch = new p5(p => {

  class BreadBoard {

    static Led = class {

      // in BreadBoard coordinate
      constructor(id, x, y, size) {
        this.x = x;
        this.y = y;
        this.sz = size;
        this.on = true;
        this.id = id;
      }

      draw() {
        if (!this.on) return;
        p.fill(255, 0, 0);
        p.noStroke();
        p.rectMode(p.CENTER);
        p.rect(this.x, this.y, this.sz, this.sz)
      }

      mousePressed() {
        console.log(p.mouseX)
      }

      on() {
        this.on = true;
      }
      off() {
        this.on = false;
      }
      toggle() {
        this.on = !this.on;
      }
      click (mouse, callback){
        if (mouse.x < this.x-this.sz/2 || mouse.x> this.x+this.sz/2) return;
        if (mouse.y < this.y-this.sz/2 || mouse.y> this.y+this.sz/2) return;
        // callback(this);
        // console.log(this.id)
        writeJsonToPort ({cmd: "setLed", led: this.id, "pattern": "on"} )
      }
    }

    // Breadboard
    constructor(x, y, width) {
      this.x = x;
      this.y = y;
      this.scale = 1;
      this.ready = false;
      this.leds = []
      this.blinkSlowList = []
      this.blinkFastList = []

      this.img = p.loadImage("assets/images/breadboard.svg", (img) => {
        this.scale = width / img.width;
        this.width = width;
        this.height = this.img.height * this.scale;
        this.ready = true;

        // Create leds
        for (let i = 0; i < 25; i++) {
          this.leds.push(new BreadBoard.Led(i+1,
            settings.ledStartCoord.x,
            settings.ledStartCoord.y + settings.ledVgap * i,
            settings.ledSize));
          this.leds.push(new BreadBoard.Led(i+26,
            settings.ledStartCoord.x + settings.ledHgap,
            settings.ledStartCoord.y + settings.ledVgap * i,
            settings.ledSize));
        }


        // test
        // this.blinkSlowList= this.leds.filter( el => el.id <= 25 );
        // this.blinkFastList= this.leds.filter( el => el.id > 25 );
      });


      // Blink slow
      setInterval(() => {
        this.blinkSlowList.forEach(led => led.toggle());
      }, 1000);

      // Blink fast
      setInterval(() => {
        this.blinkFastList.forEach(led => led.toggle());
      }, 500);
    }

    draw() {
      if (!this.ready) return;

    
      p.push();
      p.translate(this.x - this.width / 2, this.y - this.height / 2);
      p.scale(this.scale);


      this.leds.forEach(led => led.draw())
      // this.blinkSlowList.forEach(led => led.draw());
      // this.blinkFastList.forEach(led => led.draw());
      
      p.image(this.img, 0, 0);
      p.pop();
    }

    click()
    {
      // transform mouse 
      let m = p.createVector(p.mouseX, p.mouseY);
      m.sub(this.x - this.width/2, this.y - this.height/2);
      m.div(this.scale);
      
      // this.leds.forEach(led => led.click(m, function(led)
      // {
      //   console.log(led.id);
      // }));
      this.leds.forEach(led => led.click(m));

    }

  }



  // Main
  let bb;


  p.setup = () => {
    // canvas size is specified in the CSS file (size of div #one)
    p.createCanvas($("#mainSketch").width(), $("#mainSketch").height());
    bb = new BreadBoard(p.width / 2, p.height / 2, settings.breadBoardSize);
  };

  p.draw = () => {
    p.background('#F2F2F2');
    bb.draw()
  };

  p.mousePressed = () => {
    bb.click();
  }

}, 'mainSketch');