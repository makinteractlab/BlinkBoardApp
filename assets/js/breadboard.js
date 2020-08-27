const settings = {
  breadBoardSize: 270,
  ledSize: 40,
  ledStartCoord: {
    x: 51,
    y: 148
  },
  ledVgap: 37,
  ledHgap: 510
}



const sketch = new p5 (p => {

  class BreadBoard {

    static Led = class {

      states = ["off", "on", "blink2", "blink"];

      // in BreadBoard coordinate
      constructor(id, x, y, size) {
        this.x = x;
        this.y = y;
        this.sz = size;
        this.visible = true;
        this.id = id;
        this.stateIndx = 0; // index of states
      }

      draw() {
        if (!this.visible) return;
        p.fill(255, 0, 0);
        p.noStroke();
        p.rectMode(p.CENTER);
        p.rect(this.x, this.y, this.sz, this.sz)
      }

      get state() {
        return this.states[this.stateIndx];
      }
      set state(sName){
        this.stateIndx = this.states.indexOf(sName) || 0;
      }
      get prevState() {
        return this.states[(this.states.length + this.stateIndx - 1) % this.states.length]
      }
      nextState() {
        this.stateIndx = (this.stateIndx + 1) % this.states.length;
      }

      show() {
        this.visible = true;
      }
      hide() {
        this.visible = false;
      }
      toggle() {
        this.visible = !this.visible;
      }
      click(mouse, callback) {
        if (mouse.x < this.x - this.sz / 2 || mouse.x > this.x + this.sz / 2) return;
        if (mouse.y < this.y - this.sz / 2 || mouse.y > this.y + this.sz / 2) return;
        callback(this);
      }
    }

    // Breadboard
    constructor(x, y, width) {
      this.x = x;
      this.y = y;
      this.scale = 1;
      this.ready = false;
      this.leds = [];

      this.clear();

      this.img = p.loadImage("assets/images/breadboard.svg", (img) => {
        this.scale = width / img.width;
        this.width = width;
        this.height = this.img.height * this.scale;
        this.ready = true;

        // Create leds
        for (let i = 0; i < 25; i++) {
          // left side
          this.leds.push(new BreadBoard.Led(i + 1,
            settings.ledStartCoord.x,
            settings.ledStartCoord.y + settings.ledVgap * i,
            settings.ledSize));
          // right side
          this.leds.push(new BreadBoard.Led(i + 26,
            settings.ledStartCoord.x + settings.ledHgap,
            settings.ledStartCoord.y + settings.ledVgap * i,
            settings.ledSize));
        }
      });


      // Blink slow
      setInterval(() => {
        this.blinkSlowList.forEach(led => led.toggle());
      }, 400);

      // Blink fast
      setInterval(() => {
        this.blinkFastList.forEach(led => led.toggle());
      }, 200);
    }

    draw() {
      if (!this.ready) return;

      p.push();
      p.translate(this.x - this.width / 2, this.y - this.height / 2);
      p.scale(this.scale);

      // Draw leds
      this.onList.forEach(led => led.draw())
      this.blinkSlowList.forEach(led => led.draw());
      this.blinkFastList.forEach(led => led.draw());

      // Draw breadboard
      p.image(this.img, 0, 0);
      p.pop();
    }

    click() {
      // transform mouse 
      let m = p.createVector(p.mouseX, p.mouseY);
      m.sub(this.x - this.width / 2, this.y - this.height / 2);
      m.div(this.scale);

      // if outside 
      console.log(m);
      if (m.x < 0 || m.x > this.width) console.log("out")
      // if (m.y < 0 || m.y > this.height*this.scale) console.log("out")

      // If clicked callabck
      this.leds.forEach(led => led.click(m, led => {

        // remove and add to correct visual list
        this.clearPrevVisual(led);
        // led.nextState();
        led.state= this.tool;
        this.updateNewVisual(led);

        // speak to hardware
        const cmd = {
          cmd: "setLed",
          "led": led.id,
          "pattern": led.state
        };
        writeJsonToPort(cmd);

        // send to database
        console.log(this.json)

      }));

      // the user clicked on the breadbaord
      return true;
    }

    clearPrevVisual(led)
    {
      // remove the led from current list
      switch (led.state) {
        case "on":
          this.onList = this.onList.filter(l => led.id != l.id);
          break;
        case "blink":
          this.blinkFastList = this.blinkFastList.filter(l => led.id != l.id);
          break;
        case "blink2":
          this.blinkSlowList = this.blinkSlowList.filter(l => led.id != l.id);
          break;
      }
    }
    updateNewVisual(led)
    {      
      // next state and add to list
      switch (led.state) {
        case "on":
          this.onList.push(led);
          break;
        case "blink":
          this.blinkFastList.push(led);
          break;
        case "blink2":
          this.blinkSlowList.push(led);
          break;
      }

      // make sure Led is visible
      led.show();
    }

    clear() {
      this.onList = []
      this.blinkSlowList = []
      this.blinkFastList = []

      writeJsonToPort ({cmd:"reset"});
    }

    setTool(tool){
      if (this.tool == tool)
        this.tool= "";
      else
        this.tool = tool;
    }

    get json()
    {
      return {
        "on": this.onList.map( led => led.id ),
        "blink": this.blinkFastList.map( led => led.id ),
        "blink2": this.blinkSlowList.map( led => led.id )
      }
    }
  }


  // Main

  p.setup = () => {
    // canvas size is specified in the CSS file (size of div #one)
    p.createCanvas($("#mainSketch").width(), $("#mainSketch").height());
    this.bb = new BreadBoard(p.width / 2, p.height / 2, settings.breadBoardSize);

  };

  p.draw = () => {
    p.background('#F5F5F5');
    this.bb.draw()
  };

  p.mousePressed = () => {
    this.bb.click();
  }

  p.onSerialEvent = (msg) => {
    console.log(`sketch says ${JSON.stringify(msg)}`);
  } 

  p.clear = () => {
    this.bb.clear();
  }

  p.setTool = (tool) => {
    this.bb.setTool(tool);
  }


}, 'mainSketch');


// Menu bar with toggles setup
$('.menuBarToggle').on('click', function () {
  
  const prev= $('.menuBarToggleOn')[0];
  $('.menuBarToggleOn').removeClass('menuBarToggleOn');

  // get name
  const name = $(this).find('span').text();

  switch(name)
  {
    case 'On': sketch.setTool('on'); break;
    case 'Off': sketch.setTool('off'); break;
    case 'Slow': sketch.setTool('blink2'); break;
    case 'Fast': sketch.setTool('blink'); break;
  }


  // check myself
  if ( prev == this) return;
  this.classList.add('menuBarToggleOn');
});