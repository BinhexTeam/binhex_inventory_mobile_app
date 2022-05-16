// START odoo module encapsulation
odoo.define('binhex_inventory_log.purchases', function (require) {
"use strict";
var AbstractAction = require('web.AbstractAction');
var core = require('web.core');
var canvas = require('binhex_material_move.canvas');
var Session = require('web.session');
var _t = core._t;
var QWeb = core.qweb;

var Purchases = AbstractAction.extend({
    events: {
        "click .1": function() { $("#code").html($("#code").html() + "1");},
        "click .2": function() { $("#code").html($("#code").html() + "2");},
        "click .3": function() { $("#code").html($("#code").html() + "3");},
        "click .4": function() { $("#code").html($("#code").html() + "4");},
        "click .5": function() { $("#code").html($("#code").html() + "5");},
        "click .6": function() { $("#code").html($("#code").html() + "6");},
        "click .7": function() { $("#code").html($("#code").html() + "7");},
        "click .8": function() { $("#code").html($("#code").html() + "8");},
        "click .9": function() { $("#code").html($("#code").html() + "9");},
        "click .0": function() { $("#code").html($("#code").html() + "0");},
        "click .dot": function() { $("#code").html($("#code").html() + ".");},
        "click .del": function() { $("#code").html($("#code").html().slice(0, -1));},
        "click #supplier": function(e) {
            e.preventDefault();
            this.do_action('binhex_inventory_log.binhex_supplier_kanban_action',{
                    additional_context: {
                    },
                    clear_breadcrumbs: true
                });
        },
        "click #destPlace": function(e) {
            e.preventDefault();
            if (this.location) {
                this.do_action('binhex_material_move.binhex_location_kanban_action',{
                    additional_context: {
                        type: "dest",
                        n_action: "binhex_inventory_log.binhex_purchases",
                    },
                    clear_breadcrumbs: true
                });
            }
            else
                this.do_action('binhex_material_move.binhex_warehouse_kanban_action',{
                    additional_context: {
                        type: "dest",
                        n_action: "binhex_inventory_log.binhex_purchases",
                    },
                    clear_breadcrumbs: true
                });
        },
        "click #add": function(e) {
            e.preventDefault();
            var domain = []
            this.do_action('binhex_material_move.binhex_product_kanban_action',{
                    additional_context: {
                        domain: domain,
                        n_action: "binhex_inventory_log.binhex_purchases",
                    },
                    clear_breadcrumbs: true,
                });
        },
        "click .partner": function(e) {
            e.preventDefault();
            this.do_action('binhex_material_move.binhex_respon_kanban_action',{
                additional_context: {
                    n_action: "binhex_inventory_log.binhex_purchases",
                },
                clear_breadcrumbs: true
            });
        },
        "click .exit": function(e) {
            Session.product_list = {};
            Session.respon = undefined;
            Session.supplier = undefined;
            Session.dest = undefined;
            core.bus.off('barcode_scanned', this, this._onBarcodeScanned);
            this.do_action('binhex_inventory_log.binhex_main_screen',{
                    additional_context: {},
                    clear_breadcrumbs: true
                });
        },
        "click .validate": function(e) {
            var self = this;
            Session.validate = !Session.validate;
        },
        "click .start": function(e) {
            var self = this;
            if (Object.keys(Session.product_list).length < 1) {
                $(".modal-title").html(_t("Warning"));
                $(".modal-body").html(_t("<p>Number of products must be higher than 0.</p>"));
                $(".modal").modal('show')
                return;
            }
            if (!Session.supplier) {
                $(".modal-title").html(_t("Warning"));
                $(".modal-body").html(_t("<p>Supplier must be set.</p>"));
                $(".modal").modal('show')
                return;
            }
            if (!Session.dest) {
                $(".modal-title").html(_t("Warning"));
                $(".modal-body").html(_t("<p>Destination must be set.</p>"));
                $(".modal").modal('show')
                return;
            }
            if (Session.respon) {
                $(".modal-title").html(_t("Signature"));
                var html = "";
                html +=    "<div class='o_canvas_container'>";
                html += _t("<canvas id='myCanvas' class='o_signature_canvas'> Canvas not supported</canvas>");
                html +=    "<input name='signature' id='signature' type='hidden'/>";
                html +=    "<div class='o_canvas_clear_button_container'>";
                html += _t("<button id='clear' class='btn btn-primary'>Clear</button><br/>");
                html += _t("<button id='finish' class='btn btn-success'>Confirm</button><br/>");
                html +=    "</div></div>";
                $(".modal-body").html(html);
                $(".modal").modal('show');
                $("#finish").prop('disabled', true);
                $("#finish").click(function() {
                    $(".modal").modal('hide');
                    self.signed_purchase();
                });
                this.canvas.canvas_html_element($('#myCanvas'));
                this.canvas.clear_html_clickable_element($('#clear'));

                this.canvas.myCanvas.bind('mouseup', function(e) {
                    if(!self.canvas.its_signed) {
                        self.canvas.its_signed = true;
                        $("#finish").prop('disabled', false);
                    }
                });
                this.canvas.$clear.bind('click', function(e) {
                    if(self.canvas.its_signed) {
                        self.canvas.its_signed = false;
                        $("#finish").prop('disabled', true);
                    }
                });
                return;
            }
            this._rpc({
                model: 'stock.warehouse',
                method: 'create_purchase',
                args: [Session.product_list,Session.supplier.id,Session.dest.id,Session.validate,$("#refsup").val(), this.get_date()],
            }).then(function(res) {
                $(".modal-title").html(_t("Result"));
                if (res.length) {
                    $(".modal-body").html(_t("<p>"+res+"</p>"));
                }
                else if (!res) {
                    $(".modal-body").html(_t("<p>Error creating the picking.</p>"));
                }
                else {
                    self.do_action('binhex_inventory_log.binhex_end_screen_p');
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
        "change .qty": function(e) {
            var prod_id = $(e.currentTarget).parent().attr('class').split(/prod_/)[1];
            Session.product_list[prod_id][1] = parseFloat($(e.currentTarget).val());
        },
        "change .price": function(e) {
            var prod_id = $(e.currentTarget).parent().attr('class').split(/prod_/)[1];
            Session.product_list[prod_id][2] = parseFloat($(e.currentTarget).val());
        },
        "change #refsup": function(e) {
            Session.refsup = $(e.currentTarget).val();
        },
        "change #rec_date": function(e) {
            Session.rec_date = $(e.currentTarget).val();
            Session.oldRecDate = $(e.currentTarget).val();
        },
        "change #rec_time": function(e) {
            Session.rec_time = $(e.currentTarget).val();
            Session.oldRecTime = $(e.currentTarget).val();
        },
    },
    get_date: function () {
        let auxDate = '';
        if(Session.rec_date === '')
            auxDate += Session.today.slice(0, -6)
        else
            auxDate += Session.rec_date
        if(Session.rec_time === '')
            auxDate += ' 08:00'; //+ Session.today.slice(11)
        else
            auxDate += ' ' + Session.rec_time
        return auxDate
    },
    signed_purchase: function () {
        var self = this;
        let sig_64 = false;
        if(this.canvas.myCanvas[0].toDataURL()){
            sig_64 = sig_64.split(',')[1]
        }

        this.canvas.myCanvas[0].toDataURL();
        Session.firstTime = true;
        Session.oldRecDate = "";
        Session.oldRecTime = "";
        

        this._rpc({
                model: 'stock.warehouse',
                method: 'create_purchase',
                args: [Session.product_list,Session.supplier.id,Session.dest.id,Session.validate,$("#refsup").val(), this.get_date(), Session.respon.id, sig_64],
            }).then(function(res) {
                $(".modal-title").html(_t("Result"));
                if (res.length) {
                    $(".modal-body").html(_t("<p>"+res+"</p>"));
                }
                else if (!res) {
                    $(".modal-body").html(_t("<p>Error creating the picking.</p>"));
                }
                else {
                    self.do_action('binhex_inventory_log.binhex_end_screen_p');
                    return;
                }
                $(".modal").modal('show')
            });
    },
    start: async function () {
        this._super();
        var self = this;
        if (typeof(Session.validate) == "undefined")
            Session.validate = true;
        if (typeof(Session.refsup) == "undefined")
            Session.refsup = "";
        if (!Session.product_list)
            Session.product_list = {};
        if (typeof(Session.firstTime) == "undefined")
            Session.firstTime = true;
        if (typeof(Session.oldRecDate) == "undefined")
            Session.oldRecDate = "";
        if (typeof(Session.oldRecTime) == "undefined")
            Session.oldRecTime = "";
        if (typeof(Session.today) == "undefined")
            Session.today = "";
        this.canvas = new canvas();
        core.bus.on('barcode_scanned', this, this._onBarcodeScanned);

        this.getSession().user_has_group('binhex_material_move.group_use_locations').then(function(has_group) {
            self.location = has_group;
            if(Session.firstTime) {
                Session.firstTime = false
                const now = new Date();
                now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
                now.setMilliseconds(null)
                now.setSeconds(null)
                Session.oldRecDate = now.toISOString().slice(0, -14);
                Session.oldRecTime = now.toISOString().slice(11, -8);
                Session.rec_date = Session.oldRecDate
                Session.rec_time = Session.oldRecTime
                Session.today = now.toISOString().slice(0, -8).replace('T', ' ');
            }
            self.$el.html( 
                QWeb.render("PurchasesXML", {
                    widget: self, 
                    products: Session.product_list, 
                    supplier: Session.supplier, 
                    dest: Session.dest,
                    valid: Session.validate, 
                    respon: Session.respon,
                    refsup: Session.refsup,
                    rec_date: Session.oldRecDate,
                    rec_time: Session.oldRecTime
                })
            );
        });
    },
    _onBarcodeScanned: function(barcode) {
        var self = this;
        core.bus.off('barcode_scanned', this, this._onBarcodeScanned);
        this._rpc({
                model: 'stock.warehouse',
                method: 'check_barcode_purchases',
                args: [barcode,],
            }).then(function(res) {
                var modif = false;
                if (res['p'].length > 0) {
                    modif = true;
                    res['p'].forEach(function(p) {
                        if (!Session.product_list[p.id])
                            Session.product_list[p.id] = [p.name,parseFloat($("#code").html()) || 1, p.standard_price];
                        else
                            Session.product_list[p.id][1] += parseFloat($("#code").html()) || 1;
                    });
                }
                if (res['s'].length > 0) {
                    modif = true;
                    Session.supplier = {"id": res['s'][0].id, 'name': res['s'][0].display_name};
                }
                if (res['l'].length > 0) {
                    modif = true;
                    Session.dest = {"id": res['l'][0].id, 'name': res['l'][0].display_name};
                }
                if (res['w'].length > 0) {
                    modif = true;
                    Session.dest = {"id": res['w'][0].id, 'name': res['w'][0].name};
                }
                if (modif)
                    self.do_action("binhex_inventory_log.binhex_purchases",{clear_breadcrumbs: true});
                else{
                    //El lector detecta los - como '
                    barcode = barcode.replaceAll("'",'-');
                    self.barcode = barcode
                    $(".modal-title").html(_t("Barcode '"+ barcode +"' not found"));
                    var html = _t("<div class='row mb-2'><button class='btn btn-info c_product offset-2 col-8'>Create Product</button></div>")
                    html += _t("<div class='row mb-2'><button class='btn btn-info c_loc_ware offset-2 col-8'>Create Location/Warehouse</button></div>")
                    html += _t("<div class='row mb-2'><button class='btn btn-info c_supplier offset-2 col-8'>Create Supplier</button></div>")
                    $(".modal-body").html(html);
                    $(".c_product").click(function() {
                        $(".modal").modal('hide')
                        core.bus.on('barcode_scanned', self, self._onBarcodeScanned);
                        self.do_action({
                            type: 'ir.actions.act_window',
                            res_model: "product.template",
                            views: [[false, 'form']],
                            context: {'default_barcode': self.barcode}
                        });
                    });
                    $(".c_loc_ware").click(function() {
                        $(".modal").modal('hide')
                        core.bus.on('barcode_scanned', self, self._onBarcodeScanned);
                        var res_model = "stock.warehouse"
                        if (self.location)
                            res_model = "stock.location"
                        self.do_action({
                            type: 'ir.actions.act_window',
                            res_model: res_model,
                            views: [[false, 'form']],
                            context: {'default_barcode': self.barcode}
                        });
                    });
                    $(".c_supplier").click(function() {
                        $(".modal").modal('hide')
                        core.bus.on('barcode_scanned', self, self._onBarcodeScanned);
                        self.do_action({
                            type: 'ir.actions.act_window',
                            res_model: "res.partner",
                            views: [[false, 'form']],
                            context: {'default_barcode': self.barcode, 'default_supplier': true}
                        });
                    });
                    $(".modal_close").click(function() {
                        if (self.barcode) {
                            self.barcode = false
                            core.bus.on('barcode_scanned', self, self._onBarcodeScanned);
                        }
                    });
                    $(".modal").modal('show')
                }
            });
    }, 
});
core.action_registry.add('purchases', Purchases);
return Purchases
});
// END Odoo module encapsulation
