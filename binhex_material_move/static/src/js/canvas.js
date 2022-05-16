// START odoo module encapsulation
odoo.define('binhex_material_move.canvas', function (require) {
    "use strict";
    // web odoo dependecies
    var AbstractAction = require('web.AbstractAction');
    // START module class encapsulation
    var CanvasSign = AbstractAction.extend({
        // class parameters
        // initialization
        events: {
        },
        start: async function () {
        },
        context : false,
        drawingSignature : false,
        erasingSignature: false,
        its_signed : false,
        // put canvas html element
        canvas_html_element(element) {
            this.myCanvas  = element || $("#myCanvas");
            this.context = this.myCanvas[0].getContext("2d");
            let s = getComputedStyle(this.myCanvas[0]);
            var w = s.width;
            var h = s.height;
            this.myCanvas[0].width = w.split('px')[0];
            this.myCanvas[0].height = h.split('px')[0];
            this.canvas_events();
        },
        clear_html_clickable_element(element) {
            let self = this;
            this.$clear  = element || $("#clear");
            this.$clear.click(function(){	
                self.myCanvas[0].width = self.myCanvas[0].width;
            });
        },
        canvas_events() {
            let self = this;
            let myCanvas = this.myCanvas[0];
            this.myCanvas.bind('mousedown', function(e) {self.beginSignature(e)});
            this.myCanvas.bind('mouseup', function(e) {self.endSignature(e)});
            this.myCanvas.bind('mouseout', function(e) {self.endSignature(e)});
            this.myCanvas.bind('mousemove', function(e) {self.doDrawSignature(e)});
            $( window ).resize(function() {
                self.context = self.myCanvas[0].getContext("2d");
                let s = getComputedStyle(self.myCanvas[0]);
                var w = s.width;
                var h = s.height;
                self.myCanvas[0].width = w.split('px')[0];
                self.myCanvas[0].height = h.split('px')[0];
            });
           
		  // Set up touch events for mobile, etc
            myCanvas.addEventListener("touchstart", function (e) {
                let mousePos = self.getTouchPos(myCanvas, e);
                let touch = e.touches[0];
                let mouseEvent = new MouseEvent("mousedown", {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
                myCanvas.dispatchEvent(mouseEvent);
            }, false);
            myCanvas.addEventListener("touchend", function (e) {
                let mouseEvent = new MouseEvent("mouseup", {});
                myCanvas.dispatchEvent(mouseEvent);
            }, false);
            myCanvas.addEventListener("touchmove", function (e) {
                let touch = e.touches[0];
                let mouseEvent = new MouseEvent("mousemove", {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
                myCanvas.dispatchEvent(mouseEvent);
            }, false);
            // Prevent scrolling when touching the canvas
            document.body.addEventListener(
                'touchstart',
                function (e) {
                    if (e.target == self.myCanvas[0]) {
                        e.preventDefault();
                    }
                },
                {passive: false}
            );
            document.body.addEventListener(
                'touchend',
                function (e) {
                    if (e.target == self.myCanvas[0]) {
                        e.preventDefault();
                    }
                },
                {passive: false}
            );
            document.body.addEventListener(
                'touchmove',
                function (e) {
                    if (e.target == self.myCanvas[0]) {
                        e.preventDefault();
                    }
                },
                {passive: false}
            );
        },
		// Get the position of a touch relative to the canvas
        getTouchPos(canvasDom, touchEvent) {
            let rect = canvasDom.getBoundingClientRect();
            return {
                x: touchEvent.touches[0].clientX - rect.left,
                y: touchEvent.touches[0].clientY - rect.top
            };
        },
        beginSignature(event) {
            this.drawingSignature = true;
            this.context.beginPath();
            const rect = this.myCanvas[0].getBoundingClientRect();
            this.context.moveTo(event.clientX - rect.left, event.clientY - rect.top);
        },
        endSignature(){
            this.drawingSignature = false;
        },
        doDrawSignature(event){
            if (this.drawingSignature){
                this.context.strokeStyle = "black";
                const rect = this.myCanvas[0].getBoundingClientRect();
                this.context.lineTo(event.clientX - rect.left, event.clientY - rect.top);
                this.context.stroke();
            }
        },
        clearSignature(){
            this.myCanvas[0].width = this.myCanvas[0].width;
        },
        // destroy instances when finish the aplication
        destroy: function () {
            this._super.apply(this, arguments);
        },
    });
    // END module class encapsulation
    return CanvasSign; 
    });
    // END Odoo module encapsulation