# Copyright 2022 Binhex Systems Solutions
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).
# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from datetime import datetime
import logging

_logger = logging.getLogger(__name__)

class Warehouse(models.Model):
    _inherit = "stock.warehouse"

    @api.model
    def check_avail(self, products, id):
        msg_error = ""
        products = {int(k):v for k,v in products.items()}
        p_ids = self.env['product.product'].browse(products.keys())
        loc = self.env.user.has_group("binhex_material_move.group_use_locations")
        for p in p_ids:
            if not loc:
                real_qty = p.with_context(warehouse=id).qty_available
            else:
                real_qty = p.with_context(location=id).qty_available
            if products[p.id][1] > real_qty:
                if len(msg_error) == 0:
                    msg_error += _("Not enough stock for:<br/>")
                msg_error += _("%s: current (%s)/ asked (%s)<br/>") % (p.name, real_qty, products[p.id][1])
        if len(msg_error) > 0:
            return msg_error
        return True

    @api.model
    def avail_prod(self, id):
        loc = self.env.user.has_group("binhex_material_move.group_use_locations")
        if not loc:
            products = self.env['product.product'].with_context(warehouse=id).search([('qty_available','>',0)])
        else:
            products = self.env['product.product'].with_context(location=id).search([('qty_available','>',0)])
        return products.mapped('id')

    @api.model
    def check_barcode(self, barcode):
        p = self.env['product.product'].search_read([['barcode', '=', barcode]],['name'])
        if (len(p) > 0):
            return ['p',p[0]]
        l = self.env['stock.location'].search_read([['barcode', '=', barcode]],['name'])
        if (len(l) > 0):
            if self.env.user.has_group("binhex_material_move.group_use_locations"):
                return ['l',l[0]]
            else:
                w = self.env['stock.warehouse'].search_read([['lot_stock_id', '=', l[0]['id']]],['name'])
                if (len(w) > 0):
                    return ['w',w[0]]
        return False

    @api.model
    def create_picking(self, products, orig, dest, respon=False, sign=False):
        check = self.check_avail(products, orig)
        if type(check) is str:
            return check
        products = {int(k):v for k,v in products.items()}
        if self.env.user.has_group("binhex_material_move.group_use_locations"):
            orig = self.env['stock.location'].browse([orig])[0]
            dest = self.env['stock.location'].browse([dest])[0]
        else:
            orig = self.env['stock.warehouse'].browse([orig])[0].lot_stock_id
            dest = self.env['stock.warehouse'].browse([dest])[0].lot_stock_id
        picking = self.env['stock.picking'].create({
            'name': str(orig.name)+_(" to ")+str(dest.name)+" "+str(datetime.today().strftime("%d/%m/%Y, %H:%M:%S")),
            'location_id': orig.id,
            'employee_id': False,
            'location_dest_id': dest.id,
            'picking_type_id': self.env.ref('stock.picking_type_internal').id,
            'responsable': respon,
            'res_signature': sign,
        })
        moves = []
        p_ids = self.env['product.product'].browse(products.keys())
        for p1 in p_ids:
            move = self.env['stock.move'].create({
                'name': p1.name,
                'product_id':p1.id,
                'product_uom_qty': products[p1.id][1],
                'product_uom':p1.uom_id.id,
                'picking_id': picking.id,
                'location_id': orig.id,
                'location_dest_id': dest.id,
            })
            moves.append(move)
        try:
            picking.action_confirm()
            picking.action_assign()
            for m in moves:
                m.quantity_done = m.product_uom_qty
            picking.action_done()
            return True
        except:
            return False

class Picking(models.Model):
    _inherit = "stock.picking"
    res_signature = fields.Binary(string=_("Respon Signature"))
    responsable = fields.Many2one("hr.employee", string=_("Responsable"))