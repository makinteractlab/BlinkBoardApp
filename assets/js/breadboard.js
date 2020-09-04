const breadboardParams = {
  breadBoardSize: 270,
  ledOneCoord: { // coordinates for top left led
    x: 51,
    y: 148
  },
  rowGap: 37,
  colGap: 510,
  rows: 25,
  led: {
    color: '#ff0000',
    overColor: '#ffff00ee',
    size: 40,
    slowBlinkSpeed: 400,
    fastBlinkSpeed: 200,
    rowLength: 8
  }
}

const LedState = {
  OFF: "off",
  ON: "on",
  SLOW: "blink2",
  FAST: "blink"
}


const sketch = new p5(p => {

  class BreadBoard {

    static Led = class {

      // in BreadBoard coordinate
      constructor(id, x, y, left, params) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.sz = params.size;
        this.params = params;
        this.ledState = LedState.OFF;
        this.visibility = true;
        this.over = false;
        this.left = left;
      }

      draw() {
        p.noStroke();

        // overlay
        if (this.over) {
          p.fill(this.params.overColor);
          p.push();

          if (this.left) {
            p.translate(this.x - this.sz / 2, this.y - this.sz / 2);
            p.rect(0, 0, this.sz * this.params.rowLength, this.sz);

          } else {
            p.translate(this.x + this.sz, this.y + this.sz / 2);
            p.rotate(p.PI);
            p.rect(0, 0, this.sz * this.params.rowLength, this.sz);
          }
          p.pop();
        }

        if (!this.visibility || this.ledState == LedState.OFF) return;
        p.fill(this.params.color);
        p.ellipse(this.x, this.y, this.sz, this.sz);
      }

      set state(st) {
        this.ledState = st;
        this.visibility = true;
      }
      get state() {
        return this.ledState;
      }
      set visible(v) {
        this.visibility = v;
      }
      get visible() {
        return this.visibility;
      }

      mousePressed(mouse, callback) {
        callback && this.isOver(mouse) && callback(this);
      }
      mouseMoved(mouse) {
        this.over = this.isOver(mouse);
      }
      isOver(mouse) {
        if (mouse === undefined) return false;
        if (mouse.x < this.x - this.sz / 2 || mouse.x > this.x + this.sz / 2) return false;
        if (mouse.y < this.y - this.sz / 2 || mouse.y > this.y + this.sz / 2) return false;
        return true;
      }

    }

    // Breadboard
    constructor(x, y, params) {
      this.x = x;
      this.y = y;
      this.scale = 1;
      this.ready = false;
      this.leds = [];

      this.onBlinkSlow = false;
      this.onBlinkFast = false;

      this.img = p.loadImage("assets/images/breadboard.svg", (img) => {
        this.scale = params.breadBoardSize / img.width;
        this.width = params.breadBoardSize;
        this.height = this.img.height * this.scale;
        this.ready = true;
      });

      // create leds
      const ledParams = params.led;

      for (let i = 0; i < params.rows; i++) {
        // left side
        this.leds.push(new BreadBoard.Led(i + 1,
          params.ledOneCoord.x,
          params.ledOneCoord.y + params.rowGap * i,
          true, //left
          ledParams));
        // right side
        this.leds.push(new BreadBoard.Led(i + params.rows + 1,
          params.ledOneCoord.x + params.colGap,
          params.ledOneCoord.y + params.rowGap * i,
          false, //rigth
          ledParams));
      }


      // Blink slow
      setInterval(() => {
        this.slowLeds.forEach(led => led.visible = this.onBlinkSlow);
        this.onBlinkSlow = !this.onBlinkSlow;
      }, ledParams.slowBlinkSpeed);

      // Blink fast
      setInterval(() => {
        this.fastLeds.forEach(led => led.visible = this.onBlinkFast);
        this.onBlinkFast = !this.onBlinkFast;
      }, ledParams.fastBlinkSpeed);


    }

    setLed(ledId, state) {
      this.leds.filter(l => l.id == ledId).map(l => l.state = state)
    }
    getLeds(state) {
      return this.leds.filter(led => led.state == state)
    }
    get slowLeds() {
      return this.getLeds(LedState.SLOW)
    }
    set slowLeds(arrId) {
      this.leds.filter(led => arrId.includes(led.id)).map(led => led.state = LedState.SLOW)
    }
    get fastLeds() {
      return this.getLeds(LedState.FAST)
    }
    set fastLeds(arrId) {
      this.leds.filter(led => arrId.includes(led.id)).map(led => led.state = LedState.FAST)
    }
    get onLeds() {
      return this.getLeds(LedState.ON)
    }
    set onLeds(arrId) {
      this.leds.filter(led => arrId.includes(led.id)).map(led => led.state = LedState.ON)
    }


    clear() {
      this.leds.map(l => l.state = LedState.OFF); // all leds off

      writeJsonToPort({
        cmd: "reset"
      });
    }


    draw() {
      if (!this.ready) return;

      p.push();
      p.translate(this.x - this.width / 2, this.y - this.height / 2);
      p.scale(this.scale);

      // Draw leds
      this.leds.forEach(led => led.draw())

      // Draw breadboard
      p.image(this.img, 0, 0);
      p.pop();
    }


    mouseMoved() {
      let m = p.createVector(p.mouseX, p.mouseY);
      m.sub(this.x - this.width / 2, this.y - this.height / 2);
      m.div(this.scale);

      // if outside 
      if (m.x < 0 || m.x > this.img.width) return false;
      if (m.y < 0 || m.y > this.img.height) return false;

      this.leds.forEach(led => led.mouseMoved(m));
      return true;
    }

    mousePressed() {
      // transform mouse 
      let m = p.createVector(p.mouseX, p.mouseY);
      m.sub(this.x - this.width / 2, this.y - this.height / 2);
      m.div(this.scale);

      // if outside 
      if (m.x < 0 || m.x > this.img.width) return false;
      if (m.y < 0 || m.y > this.img.height) return false;

      // If clicked callabck
      this.leds.forEach(led => led.mousePressed(m, led => {

        // TO CHANGE ---
        led.state = LedState.ON;
        this.sendToHardware([led]);
        // --- TO CHANGE
      }));

      // the user clicked on the breadbaord

      return true;
    }

    get json() {
      return {
        "on": this.onLeds.map(led => led.id),
        "slow": this.slowLeds.map(led => led.id),
        "fast": this.fastLeds.map(led => led.id)
      }
    }
    set json(src) {
      this.onLeds = src.on;
      this.slowLeds = src.slow;
      this.fastLeds = src.fast;

      // update hardware
      this.sendToHardware(this.onLeds)
      this.sendToHardware(this.slowLeds)
      this.sendToHardware(this.fastLeds)
    }

    sendToHardware(leds) {
      leds.forEach(led => {
        const cmd = {
          cmd: "setLed",
          "led": led.id,
          "pattern": led.state
        };
        writeJsonToPort(cmd);
      });
    }
  }


  class ToolBar {

/*    static Tool = class {
      constructor(id, cmd, toggle = false) {
        this.id = id;
        this.cmd = cmd;
        this.toggle = toggle;
        this.active = false;

        

      }

      get toolName() {
        return this.id;
      }

      select(){
        $(this.id).addClass('menuBarToggleOn');
      }
      deselect(){
        $(this.id).removeClass('menuBarToggleOn');
      }


    }*/

    constructor() {
      
      $('.tool').on('click', function() {
        console.log(this.id)

      });

    }

    
    select(id){
      $(id).addClass('menuBarToggleOn');
    }
    deselect(id){
      $(id).removeClass('menuBarToggleOn');
    }
    deselectAll(){
      $('.menuBarToggleOn').removeClass('menuBarToggleOn');
    }


  }





  // Main

  p.setup = () => {
    // canvas size is specified in the CSS file (size of div #one)
    p.createCanvas($("#mainSketch").width(), $("#mainSketch").height());
    this.bb = new BreadBoard(p.width / 2, p.height / 2, breadboardParams);
    this.tools = new ToolBar()
  };

  p.draw = () => {
    p.background('#F5F5F5');
    this.bb.draw()
  };

  p.mousePressed = () => {
    this.bb.mousePressed();

  }

  p.mouseMoved = () => {
    this.bb.mouseMoved();
  }

  p.keyPressed = () => {
    let src = JSON.parse('{"on":[2,3,5],"slow":[27,28],"fast":[1,26,4,43,25,50]}');
    this.bb.json = src;
  }


  p.onSerialEvent = (msg) => {
    Util.log(`${JSON.stringify(msg)}`, "Sketch");
  }




}, 'mainSketch');


/*

// Menu bar with toggles setup
$('.menuBarToggle').on('click', function () {

  const prev = $('.menuBarToggleOn')[0];
  deselectAllToggles();

  // get name
  const name = $(this).find('span').text();

  switch (name) {
    case 'On':
      sketch.setTool('on');
      break;
    case 'Off':
      sketch.setTool('off');
      break;
    case 'Slow':
      sketch.setTool('blink2');
      break;
    case 'Fast':
      sketch.setTool('blink');
      break;
  }


  // check myself
  if (prev == this) return;
  this.classList.add('menuBarToggleOn');
});



*/



const sketch2 = new p5(p => {
  p.setup = () => {
    // canvas size is specified in the CSS file (size of div #one)
    p.createCanvas(300, 200);
  };

  p.draw = () => {
    p.background(255,0,0);
  };
}, 'test1');



const sketch3 = new p5(p => {
  p.setup = () => {
    // canvas size is specified in the CSS file (size of div #one)
    p.createCanvas(300, 200);
  };

  p.draw = () => {
    p.background(255);
    p.fill(0);
    p.ellipse(p.mouseX, p.mouseY, 10, 10)
  };
}, 'test2');