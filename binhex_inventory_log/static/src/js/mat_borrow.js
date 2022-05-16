// START odoo module encapsulation
odoo.define('binhex_material_move.mat_borrow', function (require) {
"use strict";
// web odoo dependecies
var AbstractAction = require('web.AbstractAction');
var core = require('web.core');
var Session = require('web.session');
var _t = core._t;
var QWeb = core.qweb;

// START module class encapsulation
var MaterialBorrow = AbstractAction.extend({
    /* EVENTS */
    // events in html elements
     events: {
        "click .manual": function(){
            core.bus.off('barcode_scanned', this, this._onBarcodeScanned);
            this.do_action("binhex_material_move.binhex_op_type_select");
        },
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
    },
    /* INITIALIZATION */
    // initialization mian function
    start: async function () {
        this._super();
        core.bus.on('barcode_scanned', this, this._onBarcodeScanned);
        this.$el.html( await QWeb.render("MatBorrow", {widget: this}));
        this._rpc({
                model: 'res.company',
                method: 'search_read',
                args: [[],['category_materials_ids']],
            }).then(function(res){
                if (res.length > 0)
                    Session.mats_categ_ids = res[0].category_materials_ids;
            });
    },
    /* BARCODE */
    // on barcode sccaned make a request from odoo db to ensure if its some expected register
    _onBarcodeScanned: function(barcode) {
        var self = this;
        core.bus.off('barcode_scanned', this, this._onBarcodeScanned);
        this._rpc({
                model: 'stock.warehouse',
                method: 'check_barcode',
                args: [barcode,],
            }).then(function(res){
                if (res.length > 0 && res[0] == 'p'){
                        Session.product_list = {}
                        Session.product_list[res[1].id] = [res[1].name,parseFloat($("#code").html()) || 1];
                        self.do_action("binhex_material_move.binhex_op_type_select");

                }
                else
                    core.bus.on('barcode_scanned', self, self._onBarcodeScanned);
            });
    }, 
});

var MatOrder = AbstractAction.extend({
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
        "click #origPlace": function(e) {
            e.preventDefault();
            this.do_action('binhex_material_move.binhex_warehouse_kanban_action',{
                    additional_context: {
                        type: "orig",
                    },
                    clear_breadcrumbs: true
                });
        },
        "click #destPlace": function(e) {
            e.preventDefault();
            this.do_action('binhex_material_move.binhex_warehouse_kanban_action',{
                    additional_context: {
                        type: "dest",
                    },
                    clear_breadcrumbs: true
                });
        },
        "click #add": function(e) {
            e.preventDefault();
            var domain = []
            if (Session.mats_categ_ids)
                domain.push(['categ_id', 'in', Session.mats_categ_ids])
            this.do_action('binhex_material_move.binhex_product_kanban_action',{
                    additional_context: {
                        domain: domain,
                    },
                    clear_breadcrumbs: true,
                });
        },
        "click .exit": function(e) {
            Session.product_list = [];
            Session.orig = undefined;
            Session.dest = undefined;
            core.bus.off('barcode_scanned', this, this._onBarcodeScanned);
            this.do_action('binhex_material_move.binhex_material_borrow',{
                    additional_context: {
                    },
                    clear_breadcrumbs: true
                });
        },
        "click .start": function(e) {
            var self = this;
            if (Object.keys(Session.product_list).length < 1){
                $(".modal-title").html(_t("Warning"));
                $(".modal-body").html(_t("<p>Number of products must be higher than 0.</p>"));
                $(".modal").modal('show')
                return;
            }
            if (!Session.orig){
                $(".modal-title").html(_t("Warning"));
                $(".modal-body").html(_t("<p>Origin must be set.</p>"));
                $(".modal").modal('show')
                return;
            }
            if (!Session.dest){
                $(".modal-title").html(_t("Warning"));
                $(".modal-body").html(_t("<p>Destination must be set.</p>"));
                $(".modal").modal('show')
                return;
            }
            if (Session.orig.id == Session.dest.id){
                $(".modal-title").html(_t("Warning"));
                $(".modal-body").html(_t("<p>Origin and Destination must be different.</p>"));
                $(".modal").modal('show')
                return;
            }
            this._rpc({
                model: 'stock.warehouse',
                method: 'create_picking',
                args: [[Session.orig.id],Session.product_list,Session.dest.id],
            }).then(function(res){
                $(".modal-title").html(_t("Result"));
                if (res.length){
                    $(".modal-body").html(_t("<p>"+res+"</p>"));
                }
                else if (!res){
                    $(".modal-body").html(_t("<p>Error creating the picking.</p>"));
                }
                else {
                    self.do_action('binhex_material_move.binhex_end_screen');
                    return;
                }
                $(".modal").modal('show')
            });
        },
        "click .prod": function(e) {
            e.preventDefault();
        },
        "click .trash": function(e) {
            var prod_id = $(e.currentTarget).parent().attr('class').split(/prod_/)[1];
            $(e.currentTarget).parent().remove();
            Session.product_list[prod_id] && delete Session.product_list[prod_id];        
        },
        "change .qty": function(e){
            var prod_id = $(e.currentTarget).parent().attr('class').split(/prod_/)[1];
            Session.product_list[prod_id][1] = parseFloat($(e.currentTarget).val());
        },
        "click .check": function(e) {
            e.preventDefault();
            if (Object.keys(Session.product_list).length < 1){
                $(".modal-title").html(_t("Warning"));
                $(".modal-body").html(_t("<p>Number of products must be higher than 0.</p>"));
                $(".modal").modal('show')
                return;
            }
            if (!Session.orig){
                $(".modal-title").html(_t("Warning"));
                $(".modal-body").html(_t("<p>Origin must be set.</p>"));
                $(".modal").modal('show')
                return;
            }
            this._rpc({
                model: 'stock.warehouse',
                method: 'check_avail',
                args: [[Session.orig.id],Session.product_list],
            }).then(function(res){
                $(".modal-title").html(_t("Result"));
                if (res.length){
                    $(".modal-body").html(_t("<p>"+res+"</p>"));
                }
                else {
                    $(".modal-body").html(_t("<p>All seems correct.</p>"));
                }
                $(".modal").modal('show')
            });

        },
    },
    start: async function () {
        this._super();
        if (!Session.product_list)
            Session.product_list = {};
        core.bus.on('barcode_scanned', this, this._onBarcodeScanned);
        if (!Session.mats_categ_ids)
            this._rpc({
                model: 'res.company',
                method: 'search_read',
                args: [[],['category_materials_ids']],
            }).then(function(res){
                if (res.length > 0)
                    Session.mats_categ_ids = res[0].category_materials_ids;
            });
        this.$el.html( await QWeb.render("MatOrder", {widget: this, products: Session.product_list, orig: Session.orig, dest: Session.dest}));
    },
    _onBarcodeScanned: function(barcode) {
        var self = this;

        core.bus.off('barcode_scanned', this, this._onBarcodeScanned);

        this._rpc({
                model: 'stock.warehouse',
                method: 'check_barcode',
                args: [barcode,],
            }).then(function(res){
                if (res.length > 0){
                    if (res[0] == 'p')
                        if (!Session.product_list[res[1].id])
                            Session.product_list[res[1].id] = [res[1].name,parseFloat($("#code").html()) || 1];
                        else
                            Session.product_list[res[1].id][1] += parseFloat($("#code").html()) || 1;
                    else{
                        if (!Session.orig)
                            Session.orig = {"id": res[1].id, 'name': res[1].name};
                        else if (!Session.dest)
                            Session.dest = {"id": res[1].id, 'name': res[1].name};
                    }   
                    self.do_action("binhex_material_move.binhex_op_type_select");
                }
                else
                    core.bus.on('barcode_scanned', self, self._onBarcodeScanned);
            });
    }, 
});

var EndScreen = AbstractAction.extend({
    events: {
        "click .button_dismiss": function(e) {
            this.do_action('binhex_material_move.binhex_material_borrow');
        },
    },
    start: async function () {
        this._super();
        Session.product_list = {};
        Session.orig = undefined;
        Session.dest = undefined;
        this.$el.html( await QWeb.render("EndScreen"));
    },
});
core.action_registry.add('material_borrow', MaterialBorrow);
core.action_registry.add('type_selection', MatOrder);
core.action_registry.add('end_screen', EndScreen);
return {
    MaterialBorrow,
    MatOrder,
    EndScreen,
};
});
// END Odoo module encapsulation