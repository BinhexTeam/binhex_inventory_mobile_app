// START odoo module encapsulation
odoo.define('binhex_inventory_log.inv_upd', function (require) {
"use strict";

var AbstractAction = require('web.AbstractAction');
var core = require('web.core');
var Session = require('web.session');
var _t = core._t;
var QWeb = core.qweb;

var InvUpdate = AbstractAction.extend({
    /* EVENTS */
     events: {
        "click #add": function(e) {
            e.preventDefault();
            if (!Session.inv_orig){
                $(".modal-title").html(_t("Location not set"));
                $(".modal").modal('show')
                return;
            }
            var domain = [['type','=','product']];
            this.do_action('binhex_material_move.binhex_product_kanban_action',{
                    additional_context: {
                        domain: domain,
                    },
                    clear_breadcrumbs: true,
                });
        },
        "click .loc": function(e) {
            e.preventDefault();
            this.do_action('binhex_material_move.binhex_location_kanban_action',{
                additional_context: {
                    type: "orig",
                    n_action: "binhex_inventory_log.binhex_inv_upd",
                },
                clear_breadcrumbs: true
            });

        },
        "click .confirm": function(e) {
            var self = this;
            if (Object.keys(Session.lines).length < 1){
                $(".modal-title").html(_t("Number of products must be higher than 0"));
                $(".modal").modal('show')
                return;
            }
            this._rpc({
                model: 'stock.warehouse',
                method: 'create_inventory',
                args: [Session.lines],
            }).then(function(res){
                Session.inv_orig = undefined;
                Session.lines = {};
                self.do_action('binhex_inventory_log.binhex_main_screen',{
                        clear_breadcrumbs: true
                    });
                });
        },
        "click .exit": function() {
            Session.inv_orig = undefined;
            Session.lines = {};
            this.do_action('binhex_inventory_log.binhex_main_screen',{
                    clear_breadcrumbs: true
                });
        },
        "click .trash": function(e) {
            var ids = $(e.currentTarget).parent().attr('class').split(/_/);
            Session.lines[ids[1]][ids[2]] && delete Session.lines[ids[1]][ids[2]];
            if (Object.keys(Session.lines[ids[1]]).length == 1){
                $(e.currentTarget).parent().parent().remove();
                delete Session.lines[ids[1]];
            }
            else 
                $(e.currentTarget).parent().remove();
        },
        "change .qty": function(e){
            var ids = $(e.currentTarget).parent().attr('class').split(/_/);
            Session.lines[ids[1]][ids[2]].qty = parseFloat($(e.currentTarget).val());
        },
    },

    start: async function () {
        this._super();
        var self = this;
        if (typeof(Session.inv_orig) == "undefined")
            Session.inv_orig = false;
        if (Session.orig){
            Session.inv_orig = Session.orig;
            Session.orig = undefined;
        }
        if (typeof(Session.lines) == "undefined")
            Session.lines = {};
        core.bus.on('barcode_scanned', this, this._onBarcodeScanned);
        self.$el.html( QWeb.render("InvUpdXML", {location: Session.inv_orig, lines:Session.lines}));
    },
    _onBarcodeScanned: function(barcode) {
        var self = this;
        core.bus.off('barcode_scanned', this, this._onBarcodeScanned);
        this._rpc({
                model: 'stock.warehouse',
                method: 'check_barcode_purchases',
                args: [barcode,],
            }).then(function(res){
                if (res['l'].length > 0){
                    Session.inv_orig = res['l'][0]
                    self.$el.html( QWeb.render("InvUpdXML", {'location':Session.inv_orig, 'lines':Session.lines}));
                }
                else if (res['p'].length > 0){
                    if (!Session.inv_orig){
                        $(".modal-title").html(_t("Location not set"));
                        $(".modal").modal('show')
                    }
                    else{
                        res['p'].forEach(function(p){
                            if (!Session.lines[Session.inv_orig.id])
                                Session.lines[Session.inv_orig.id] = {'name':Session.inv_orig.display_name}
                            if (!Session.lines[Session.inv_orig.id][p.id])
                                Session.lines[Session.inv_orig.id][p.id] = {name:p.display_name,qty:parseFloat($("#code").html()) || 1};
                            else
                                Session.lines[Session.inv_orig.id][p.id].qty += parseFloat($("#code").html()) || 1;
                        });
                        self.$el.html( QWeb.render("InvUpdXML", {'location':Session.inv_orig, 'lines':Session.lines}));
                    }
                }
                else {
                    $(".modal-title").html(_t("Barcode not found"));
                    $(".modal").modal('show')
                }
                core.bus.on('barcode_scanned', self, self._onBarcodeScanned);
            });
    }, 
});

core.action_registry.add('inv_upd', InvUpdate);

return InvUpdate;

});