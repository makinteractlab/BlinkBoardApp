const breadboardParams = {
  breadBoardSize: 270,
  ledOneCoord: { // coordinates for top left led
    x: 51,
    y: 148
  },
  rowGap: 37,
  colGap: 510,
  rows: 20,
  led: {
    color: '#ff0000',
    overColor: '#ffff00ee',
    size: 40
  }
}

const LedState =
{
  OFF: 0,
  ON: 1,
  SLOW: 2,
  FAST: 3
}


const sketch = new p5(p => {

  class BreadBoard {

    static Led = class {

      // in BreadBoard coordinate
      constructor(id, x, y, params) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.sz = params.size;
        this.params = params;
        this.ledState = LedState.OFF;
        this.visibility = true;
        this.over= false;
      }

      draw() {
        p.noStroke();

        if (this.over) {
          p.fill(this.params.overColor);
          p.push();
          p.translate(this.x - this.sz / 2, this.y - this.sz / 2)
        
          p.rect(0, 0, this.sz*8, this.sz);
          p.pop();
          return; // no need to continue
        }

        if (!this.visibility || this.ledState == LedState.OFF) return;
        p.fill(this.params.color);
        p.ellipse(this.x, this.y, this.sz, this.sz);
      }
      
      set state(st){
        this.ledState= st;
        this.visibility= true;
      }
      get state(){
        return this.ledState;
      }
      set visible(v){
        this.visibility= v;
      }
      get visible(){
        return this.visibility;
      }

      mousePressed(mouse, callback) {
        callback && this.isOver(mouse) && callback(this);
      }
      mouseMoved(mouse) {
        this.over = this.isOver(mouse);
      }
      isOver(mouse){
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

      for (let i = 0; i < 25; i++) {
        // left side
        this.leds.push(new BreadBoard.Led(i + 1,
          params.ledOneCoord.x,
          params.ledOneCoord.y + params.rowGap * i,
          ledParams));
        // right side
        this.leds.push(new BreadBoard.Led(i + 26,
          params.ledOneCoord.x + params.colGap,
          params.ledOneCoord.y + params.rowGap * i,
          ledParams));
      }

      
      setInterval(() => {
        this.slowLeds.forEach(led => led.visible = this.onBlinkSlow);
        this.onBlinkSlow = !this.onBlinkSlow;
      }, 400);

      // Blink fast
      setInterval(() => {
        this.fastLeds.forEach(led => led.visible = this.onBlinkFast);
        this.onBlinkFast = !this.onBlinkFast;
      }, 200);


    }


    getLeds(state){
      return this.leds.filter(led => led.state == state)
    }
    get slowLeds(){
      return this.getLeds(LedState.SLOW)
    }
    get fastLeds(){
      return this.getLeds(LedState.FAST)
    }
    get onLed(){
      return this.getLeds(LedState.ON)
    }

    setLed (ledId, state){
      this.leds.filter( l => l.id == ledId).map(l => l.state = state)
    }

    clear()
    {
      this.leds.map(l => l.state= LedState.OFF); // all leds off

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


    /*
    get json() {
      return {
        "on": this.onList.map(led => led.id),
        "blink": this.blinkFastList.map(led => led.id),
        "blink2": this.blinkSlowList.map(led => led.id)
      }
    }


    


    /*
    click() {
      // transform mouse 
      let m = p.createVector(p.mouseX, p.mouseY);
      m.sub(this.x - this.width / 2, this.y - this.height / 2);
      m.div(this.scale);

      // if outside 
      if (m.x < 0 || m.x > this.img.width) return false;
      if (m.y < 0 || m.y > this.img.height) return false;

      // If clicked callabck
      this.leds.forEach(led => led.click(m, led => {
/*
        // remove and add to correct visual list
        this.clearPrevVisual(led);
        // led.nextState();
        led.state = this.tool;
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

    

    clearPrevVisual(led) {
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
    updateNewVisual(led) {
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

    

    setTool(tool) {
      if (this.tool == tool)
        this.tool = "";
      else
        this.tool = tool;
    }

    

    */
  }


  // Main

  p.setup = () => {
    // canvas size is specified in the CSS file (size of div #one)
    p.createCanvas($("#mainSketch").width(), $("#mainSketch").height());
    this.bb = new BreadBoard(p.width / 2, p.height / 2, breadboardParams);
  };

  p.draw = () => {
    p.background('#F5F5F5');
   this.bb.draw()
  };

  p.mousePressed = () => {
    // const onBB = this.bb.click();
    // if (!onBB) {
    //   p.setTool("");
    //   deselectAllToggles();
    // }
  }

  p.mouseMoved = () => {
    this.bb.mouseMoved();
  }

  p.onSerialEvent = (msg) => {
    Util.log(`${JSON.stringify(msg)}`, "Sketch");
  }

  p.clear = () => {
    // this.bb.clear();
  }

  p.setTool = (tool) => {
    // this.bb.setTool(tool);
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

function deselectAllToggles() {
  $('.menuBarToggleOn').removeClass('menuBarToggleOn');
}

*/