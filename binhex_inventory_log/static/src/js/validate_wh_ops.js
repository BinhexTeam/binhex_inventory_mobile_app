// START odoo module encapsulation
odoo.define('binhex_inventory_log.validate_wh_ops', function (require) {
"use strict";

var AbstractAction = require('web.AbstractAction');
var core = require('web.core');
var canvas = require('binhex_material_move.canvas');
var Session = require('web.session');
var _t = core._t;
var QWeb = core.qweb;

var ValidateWHOps = AbstractAction.extend({
    events: {
        "click .1": function(){ $("#code").html($("#code").html() + "1");},
        "click .2": function(){ $("#code").html($("#code").html() + "2");},
        "click .3": function(){ $("#code").html($("#code").html() + "3");},
        "click .4": function(){ $("#code").html($("#code").html() + "4");},
        "click .5": function(){ $("#code").html($("#code").html() + "5");},
        "click .6": function(){ $("#code").html($("#code").html() + "6");},
        "click .7": function(){ $("#code").html($("#code").html() + "7");},
        "click .8": function(){ $("#code").html($("#code").html() + "8");},
        "click .9": function(){ $("#code").html($("#code").html() + "9");},
        "click .0": function(){ $("#code").html($("#code").html() + "0");},
        "click .dot": function(){ $("#code").html($("#code").html() + ".");},
        "click .del": function(){ $("#code").html($("#code").html().slice(0, -1));},
        "click .back": function(e) {
            Session.line_pick = undefined;
            Session.respon = undefined;
            Session.dest = undefined;   
            core.bus.off('barcode_scanned', this, this._onBarcodeScanned);
            var self = this;
            this.do_action({
                type: 'ir.actions.client',
                name: _t('Warehouse Operations'),
                tag: 'wh_ops',
                target: 'fullscreen',
            }, {clear_breadcrumbs: true}); 
        },
        "click .partner": function(e) {
            e.preventDefault();
            this.do_action('binhex_material_move.binhex_respon_kanban_action',{
                additional_context: {
                    n_action: "binhex_inventory_log.binhex_validate_wh_ops",
                },
                clear_breadcrumbs: true
            });
        },
        "click .loc": function(e) {
            e.preventDefault();
            this.do_action('binhex_material_move.binhex_location_kanban_action',{
                additional_context: {
                    type: "dest",
                    n_action: "binhex_inventory_log.binhex_validate_wh_ops",
                },
                clear_breadcrumbs: true
            });
        },
        "click .validate": function(e) {
            var self = this;
            var msg = ""
            var value = self.check_lines()
            $(".force_validate").prop('disabled', false);
            switch(value){
                case 3:
                    msg += _t("<p>You have processed more than what was initially planned. Are you sure you want to validate the picking?</p><br/>");
                    msg += _t("<p>You have processed less than what was initially planned.</p><br/><div class='form-check'><input class='form-check-input' type='checkbox' onclick=document.getElementById('b_order').setAttribute('value',document.getElementById('b_order').value*-1) value='-1' id='b_order'/><label class='form-check-label' for='flexCheckDefault'>Create BackOrder</label></div>");
                    break;
                case 2:
                    msg += _t("<p>You have processed less than what was initially planned.</p><br/><div class='form-check'><input class='form-check-input' type='checkbox' onclick=document.getElementById('b_order').setAttribute('value',document.getElementById('b_order').value*-1) value='-1' id='b_order'/><label class='form-check-label' for='flexCheckDefault'>Create BackOrder</label></div>");
                    break;
                case 1:
                    msg += _t("<p>You have processed more than what was initially planned. Are you sure you want to validate the picking?</p>");
                    break;
            }
            if (value != 0){
                $(".modal-title").html(_t("Warning"));
                $(".modal-body").html(msg);
                $(".modal").modal('show')
                return;
            }
            if (Session.respon || self.picking.picking_type_code == 'outgoing'){
                $(".modal-title").html(_t("Signature"));
                var html = "";
                html +=    "<div class='o_canvas_container'>";
                html += _t("<canvas id='myCanvas' class='o_signature_canvas'> Canvas not supported</canvas>");
                html +=    "<input name='signature' id='signature' type='hidden'/>";
                html +=    "<div class='o_canvas_clear_button_container'>";
                html += _t("<button id='clear' class='btn btn-primary'>Clear</button><br/>");
                html +=    "</div></div>";
                $(".modal-body").html(html);
                $(".modal").modal('show');
                $(".force_validate").prop('disabled', true);
                this.canvas.canvas_html_element($('#myCanvas'));
                this.canvas.clear_html_clickable_element($('#clear'));
                this.canvas.myCanvas.bind('mouseup', function(e) {
                    if(!self.canvas.its_signed) {
                        self.canvas.its_signed = true;
                        $(".force_validate").prop('disabled', false);
                    }
                });
                this.canvas.$clear.bind('click', function(e) {
                    if(self.canvas.its_signed) {
                        self.canvas.its_signed = false;
                        $(".force_validate").prop('disabled', true);
                    }
                });
                return;
            }
            this._rpc({
                model: 'stock.warehouse',
                method: 'validate_picking',
                args: [self.picking.id, Session.line_pick, false, Session.dest],
            }).then(function(res){
                Session.line_pick = undefined;
                Session.dest = undefined;   
                self.do_action({
                    type: 'ir.actions.client',
                    name: _t('Warehouse Operations'),
                    tag: 'wh_ops',
                    target: 'fullscreen',
                }, {clear_breadcrumbs: true}); 
            });
        },
        "click .force_validate": function(e) {
            var self = this;
            var msg = ""
            var value = self.check_lines()
            if (typeof(self.b_order) == undefined)
                self.b_order = false;
            if (value == 2 || value == 3){
                if ($("#b_order").val())
                    self.b_order = $("#b_order").val();
            } else self.b_order = false;
            if ((Session.respon || self.picking.picking_type_code == 'outgoing') && self.canvas && !self.canvas.its_signed){
                $(".modal-title").html(_t("Signature"));
                var html = "";
                html +=    "<div class='o_canvas_container'>";
                html += _t("<canvas id='myCanvas' class='o_signature_canvas'> Canvas not supported</canvas>");
                html +=    "<input name='signature' id='signature' type='hidden'/>";
                html +=    "<div class='o_canvas_clear_button_container'>";
                html += _t("<button id='clear' class='btn btn-primary'>Clear</button><br/>");
                html +=    "</div></div>";
                $(".modal-body").html(html);
                $(".modal").modal('show');
                $(".force_validate").prop('disabled', true);
                this.canvas.canvas_html_element($('#myCanvas'));
                this.canvas.clear_html_clickable_element($('#clear'));
                this.canvas.myCanvas.bind('mouseup', function(e) {
                    if(!self.canvas.its_signed) {
                        self.canvas.its_signed = true;
                        $(".force_validate").prop('disabled', false);
                    }
                });
                this.canvas.$clear.bind('click', function(e) {
                    if(self.canvas.its_signed) {
                        self.canvas.its_signed = false;
                        $(".force_validate").prop('disabled', true);
                    }
                });
                return;
            }
            var sig_64 = false;
            if (Session.respon || self.picking.picking_type_code == 'outgoing')
                sig_64 = this.canvas.myCanvas[0].toDataURL();
                if(sig_64){
                    sig_64 = sig_64.split(',')[1];
                }
            this._rpc({
                model: 'stock.warehouse',
                method: 'validate_picking',
                args: [self.picking.id, Session.line_pick, self.b_order, Session.dest, Session.respon && Session.respon.id || false, sig_64],
            }).then(function(res){
                Session.line_pick = undefined;   
                Session.dest = undefined;   
                Session.respon = undefined;
                self.do_action({
                    type: 'ir.actions.client',
                    name: _t('Warehouse Operations'),
                    tag: 'wh_ops',
                    target: 'fullscreen',
                }, {clear_breadcrumbs: true}); 
            });
        },
        "click .prod": function(e) {
            e.preventDefault();
        },
        "change .qty_done": function(e){
            var line_id = $(e.currentTarget).parent().attr('class').split(/line_/)[1];
            Session.line_pick[line_id].quantity_done = parseFloat($(e.currentTarget).val());
        },
    },
    start: async function () {
        this._super();
        var self = this;
        if (!Session.picking) {
            this.do_action('binhex_inventory_log.binhex_main_screen',{
                    clear_breadcrumbs: true
                });
            return;
        }
        if (!Session.line_pick)
            Session.line_pick = {};
        this.canvas = new canvas();
        this._rpc({
                model: 'stock.warehouse',
                method: 'get_picking',
                args: [Session.picking.id],
            }).then(function(result){
                if (result.picking.length > 0)
                    self.picking = result.picking[0];
                else {
                    self.do_action({
                        type: 'ir.actions.client',
                        name: _t('Warehouse Operations'),
                        tag: 'wh_ops',
                        target: 'fullscreen',
                    }, {clear_breadcrumbs: true}); 
                }
                self.type = self.picking.picking_type_code;
                result.lines.forEach((l) => Session.line_pick[l.id] = {name:l.product_id[1], product_uom_qty:l.product_uom_qty, quantity_done: l.quantity_done});
                core.bus.on('barcode_scanned', self, self._onBarcodeScanned);
                self.$el.html( QWeb.render("ValidateWHOpsXML", {picking: self.picking, lines: Session.line_pick, dest: Session.dest, respon: Session.respon}));
            });
    },
    check_lines: function() {
        var result = 0;
        // 0 = All Rigth
        // 1 = Product Excess 
        // 2 = Less Product than expected (BackOrder?)
        // 3 = All of before
        Object.keys(Session.line_pick).forEach(function(k){
            if (result == 3) return;

            if (Session.line_pick[k].product_uom_qty > Session.line_pick[k].quantity_done && result != 2)
                result += 2;
            if (Session.line_pick[k].product_uom_qty < Session.line_pick[k].quantity_done && result != 1)
                result += 1;
        });
        return result;
    },
    _onBarcodeScanned: function(barcode) {
        var self = this;

        core.bus.off('barcode_scanned', this, this._onBarcodeScanned);

        this._rpc({
                model: 'stock.warehouse',
                method: 'check_barcode_validation',
                args: [barcode,Object.keys(Session.line_pick)],
            }).then(function(res){
                var modif = false;
                if (res['moves'].length > 0){
                    res['moves'].forEach(function(m){
                        Session.line_pick[m.id].quantity_done += parseFloat($("#code").html()) || 1;
                    });
                    self.$el.html( QWeb.render("ValidateWHOpsXML", {picking: self.picking, lines: Session.line_pick, dest: Session.dest}));
                }
                else if (res['l'].length > 0 && self.type == 'incoming'){
                    Session.dest = res['l'][0];
                    self.$el.html( QWeb.render("ValidateWHOpsXML", {picking: self.picking, lines: Session.line_pick, dest: Session.dest}));
                }
                else alert(_t("Barcode don't match any product in line"));     
                core.bus.on('barcode_scanned', self, self._onBarcodeScanned);    
            });
    },
});
core.action_registry.add('validate_wh_ops', ValidateWHOps);
return ValidateWHOps
});
// END Odoo module encapsulation