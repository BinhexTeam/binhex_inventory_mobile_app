// START odoo module encapsulation
odoo.define('binhex_inventory_log.warehouse_ops', function (require) {
"use strict";

var AbstractAction = require('web.AbstractAction');
var ajax = require('web.ajax');
var core = require('web.core');

var Session = require('web.session');
var _t = core._t;

var QWeb = core.qweb;

var WhOps = AbstractAction.extend({
    /* EVENTS */
     events: {
        "click .receipts": function(){ 
            var self = this;
            this._rpc({
                model: 'stock.warehouse',
                method: 'warehouse_ops_views',
                args: ["inc"],
            }).then(function(action){
                self.do_action(action);
            });
        },
        "click .int_trans": function(){ 
            var self = this;
            this._rpc({
                model: 'stock.warehouse',
                method: 'warehouse_ops_views',
                args: ["int"],
            }).then(function(action){
                self.do_action(action);
            });
        },
        "click .deliv_ord": function(){ 
            var self = this;
            this._rpc({
                model: 'stock.warehouse',
                method: 'warehouse_ops_views',
                args: ["out"],
            }).then(function(action){
                self.do_action(action);
            });
        },
        "click .back": function() {
            this.do_action('binhex_inventory_log.binhex_main_screen',{
                    clear_breadcrumbs: true
                });
        },
    },
    start: async function () {
        this._super();
        var self = this;
        this._rpc({
                model: 'stock.warehouse',
                method: 'warehouse_ops_count',
                args: [],
            }).then(function(count){
                self.$el.html( QWeb.render("WhOpsXML", {count: count}));
            });
    },
});
core.action_registry.add('wh_ops', WhOps);
return WhOps;
});