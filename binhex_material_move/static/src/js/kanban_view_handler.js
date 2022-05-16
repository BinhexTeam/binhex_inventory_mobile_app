odoo.define('binhex_material_move.kanban_view_handler', function(require) {
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
            this.record.id.raw_value,this.record.name.raw_value
            if (!Session.product_list[this.record.id.raw_value])
                Session.product_list[this.record.id.raw_value] = [this.record.name.raw_value, 1, this.record.standard_price.raw_value];
            else
                Session.product_list[this.record.id.raw_value][1] += 1;
             if (!this.state.context.n_action)
                this.do_action("binhex_material_move.binhex_op_type_select");
            else
                this.do_action(this.state.context.n_action);
            
        } else if (this.modelName === 'stock.warehouse' && this.$el.parents('.o_warehouse_selection').length) {
            if (this.state.context.type == "orig"){
            	Session.orig = {"id": this.record.id.raw_value, 'name': this.record.name.raw_value, 'display_name': this.record.display_name.raw_value};
            } else {
            	Session.dest = {"id": this.record.id.raw_value, 'name': this.record.name.raw_value, 'display_name': this.record.display_name.raw_value};
            }
            if (!this.state.context.n_action)
                this.do_action("binhex_material_move.binhex_op_type_select");
            else
                this.do_action(this.state.context.n_action);
            
        } else if (this.modelName === 'stock.location' && this.$el.parents('.o_location_selection').length) {
            if (this.state.context.type == "orig"){
                Session.orig = {"id": this.record.id.raw_value, 'name': this.record.name.raw_value, 'display_name': this.record.display_name.raw_value};
            } else {
                Session.dest = {"id": this.record.id.raw_value, 'name': this.record.name.raw_value, 'display_name': this.record.display_name.raw_value};
            }
             if (!this.state.context.n_action)
                this.do_action("binhex_material_move.binhex_op_type_select");
            else
                this.do_action(this.state.context.n_action);
            
        } else if (this.modelName === 'hr.employee' && this.$el.parents('.o_respon_selection').length) {
            Session.respon = {"id": this.record.id.raw_value, 'name': this.record.display_name.raw_value};
            if (!this.state.context.n_action)
                this.do_action("binhex_material_move.binhex_op_type_select");
            else
                this.do_action(this.state.context.n_action);
        } else {
            this._super.apply(this, arguments);
        }
    }
});

});