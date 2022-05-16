odoo.define('binhex_inventory_log.kanban_view_handler', function(require) {
"use strict";
var KanbanRecord = require('web.KanbanRecord');
var Session = require('web.session');
KanbanRecord.include({
    /**
     * @override
     * @private
     */
    _openRecord: function () {
        if (this.modelName === 'product.product' && this.$el.parents('.o_product_selection').length) {
            if (Session.inv_orig){
                if (!Session.lines[Session.inv_orig.id])
                    Session.lines[Session.inv_orig.id] = {'name':Session.inv_orig.display_name}
                if (!Session.lines[Session.inv_orig.id][this.record.id.raw_value])
                    Session.lines[Session.inv_orig.id][this.record.id.raw_value] = {name:this.record.name.raw_value,qty: 1};
                else
                    Session.lines[Session.inv_orig.id][this.record.id.raw_value].qty += 1;
                this.do_action("binhex_inventory_log.binhex_inv_upd");
            }
            else 
                this._super.apply(this, arguments);
            
        } else if (this.modelName === 'res.partner' && this.$el.parents('.o_supplier_selection').length) {
            Session.supplier = {"id": this.record.id.raw_value, 'name': this.record.display_name.raw_value};
            this.do_action("binhex_inventory_log.binhex_purchases");
        } else if (this.modelName === 'stock.picking' && this.$el.parents('.o_picking_selection').length) {
            Session.picking = {"id": this.record.id.raw_value};
            this.do_action("binhex_inventory_log.binhex_validate_wh_ops");  
        } else {
            this._super.apply(this, arguments);
        }
    }
});
});