// START odoo module encapsulation
odoo.define('binhex_inventory_log.quick_info', function (require) {
"use strict";
var AbstractAction = require('web.AbstractAction');
var core = require('web.core');
var Session = require('web.session');
var _t = core._t;
var QWeb = core.qweb;

var QuickInfo = AbstractAction.extend({
    /* EVENTS */
     events: {
        "click .exit": function() {
            Session.product_list = {};
            Session.orig = undefined;
            this.do_action('binhex_inventory_log.binhex_main_screen',{
                    clear_breadcrumbs: true
                });
        },
        "click .locat": function(e) {
            e.preventDefault();
            Session.product_list = {};
            Session.orig = undefined;
            this.do_action('binhex_material_move.binhex_location_kanban_action',{
                additional_context: {
                    type: "orig",
                    n_action: "binhex_inventory_log.binhex_quick_info",
                },
                clear_breadcrumbs: true
            });
        },
        "click .prod": function(e) {
            e.preventDefault();
            Session.product_list = {};
            Session.orig = undefined;
            this.do_action('binhex_material_move.binhex_product_kanban_action',{
                    additional_context: {
                        domain: [],
                        n_action: "binhex_inventory_log.binhex_quick_info",
                    },
                    clear_breadcrumbs: true,
                });
        },
    },

    start: async function () {
        this._super();
        var self = this;
        core.bus.on('barcode_scanned', this, this._onBarcodeScanned);
        var args = [];
        if(Session.product_list && Object.keys(Session.product_list).length > 0)
            args = [Object.keys(Session.product_list)[0],'p'];
        else if (Session.orig)
            args = [Session.orig.id,'l'];
        if (args.length > 0)
            this._rpc({
                    model: 'stock.warehouse',
                    method: 'quick_info_by_id',
                    args: args,
                }).then(function(res){
                    if (!res){
                        self.$el.html( QWeb.render("QuickInfoXML"));
                    }
                    else {       
                        self.$el.html( QWeb.render("QuickInfoXML", res));
                    }
                });
        else 
            self.$el.html( QWeb.render("QuickInfoXML"));
    },
    _onBarcodeScanned: function(barcode) {
        var self = this;
        core.bus.off('barcode_scanned', this, this._onBarcodeScanned);
        this._rpc({
                model: 'stock.warehouse',
                method: 'quick_info_barcode',
                args: [barcode,],
            }).then(function(res){
                if (!res){
                    $(".modal-title").html(_t("Barcode not found"));
                    $(".modal").modal('show');
                }
                else {       
                    self.$el.html( QWeb.render("QuickInfoXML", res));
                }
                core.bus.on('barcode_scanned', self, self._onBarcodeScanned);
            });
    }, 
});
core.action_registry.add('quick_info', QuickInfo);
return QuickInfo;

});