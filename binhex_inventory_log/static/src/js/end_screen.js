// START odoo module encapsulation
odoo.define('binhex_inventory_log.end_screen_p', function (require) {
"use strict";
var AbstractAction = require('web.AbstractAction');
var core = require('web.core');
var Session = require('web.session');
var QWeb = core.qweb;

var EndScreenP = AbstractAction.extend({
    events: {
        "click .button_dismiss": function(e) {
            this.do_action('binhex_inventory_log.binhex_main_screen');
        },
    },
    start: async function () {
        this._super();
        Session.product_list = {};
        Session.supplier = undefined;
        Session.dest = undefined;
        Session.refsup = undefined;
        this.$el.html( await QWeb.render("EndScreenXML"));
    },
});
core.action_registry.add('end_screen_p', EndScreenP);
return EndScreenP;
});