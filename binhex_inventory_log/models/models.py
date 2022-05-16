# Copyright 2022 Binhex Systems Solutions
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).
# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
import pytz
import datetime
import re

import logging
_logger = logging.getLogger(__name__)

class Warehouse(models.Model):
    _inherit = 'stock.warehouse'
    '''
    Zonas horarias de pytz desactualizadas
    '''
    one_hour_less_tz = ['Africa/Juba', 'America/Campo_Grande', 'America/Cuiaba', 'Pacific/Fiji', 'America/Sao_Paulo', 'Brazil/East', 'Europe/Volgograd']
    one_hour_more_tz = ['America/Dawson', 'America/Whitehorse', 'Canada/Yukon', 'Pacific/Norfolk']
    three_hours_more_tz = ['Antarctica/Casey']

    @api.model
    def check_barcode_purchases(self, barcode):
        p = self.env['product.product'].search_read(['|','|','|',['barcode', '=', barcode],['barcode', '=', barcode.replace("'","-")],['name', '=', barcode],['name', '=', barcode.replace("'","-")]],['name', 'display_name', 'standard_price'])
        s = self.env['res.partner'].search_read([['supplier','=',True],'|','|','|',['barcode', '=', barcode],['barcode', '=', barcode.replace("'","-")],['name', '=', barcode],['name', '=', barcode.replace("'","-")]],['display_name'])
        l = self.env['stock.location'].search_read(['|','|','|',['barcode', '=', barcode],['barcode', '=', barcode.replace("'","-")],['name', '=', barcode],['name', '=', barcode.replace("'","-")]],['display_name'])
        w = []
        if (len(l) > 0 and not self.env.user.has_group("binhex_material_move.group_use_locations")):
            w = self.env['stock.warehouse'].search_read([['lot_stock_id', 'parent_of', l[0]['id']]],['name'])
            l = []

        return {
            'p': p,
            's': s,
            'l': l,
            'w': w,
        }
    
    '''
    Convierte en UTC la hora seleccionada por el usuario según su zona horaria
    La versión del paquete pytz está desactualizado y hay algunas zonas horarias que no tienen su diferencia horaria actualizada
    '''
    def get_utc_time(self, selected_date, tz):
        utc_now = pytz.utc.localize(datetime.datetime.utcnow ())
        tz_now = utc_now.astimezone(pytz.timezone (tz))
        minute_diff = tz_now.strftime ('%z')[3:5] 

        fix = 0
        if tz in self.one_hour_less_tz:
            fix = -1
        elif tz in self.one_hour_more_tz:
            fix = 1
        elif tz in self.three_hours_more_tz:
            fix = 3

        hour_diff = int(tz_now.strftime ('%z')[0:3]) + fix
        
        if hour_diff >= 0 and hour_diff <= 9:
            hour_diff = '+0' + str(hour_diff)
        elif hour_diff <= 0 and hour_diff >= -9:
            hour_diff = '-0' + str(hour_diff)[1]
        elif hour_diff >= 10:
            hour_diff = '+' + str(hour_diff)

        date = re.compile(r'\d\d\d\d-\d\d-\d\d')
        date = date.search(selected_date).group()
        year = date[0:4]
        month = date[5:7]
        day = date[8:10]

        time = re.compile(r'\d\d:\d\d')
        time = time.search(selected_date).group()
        hour = time[0:2]
        minute = time[3:5]

        datetime_selected_date = datetime.datetime.combine(datetime.date(int(year), int(month), int(day)), 
                                datetime.time(int(hour), int(minute)))
        hours_added = datetime.timedelta(hours = int(hour_diff))
        utc_date_and_time = datetime_selected_date - hours_added
        return utc_date_and_time.strftime("%Y-%m-%d %H:%M")
    
    @api.model
    def create_purchase(self, products, supplier, dest, validate, ref, rec_date, respon=False, sign=False):
        products = {int(k):v for k,v in products.items()}
        supplier = self.env['res.partner'].browse([supplier])[0]

        if self.env.user.has_group("binhex_material_move.group_use_locations"):
            dest = self.env['stock.location'].browse([dest])[0]
        else:
            dest = self.env['stock.warehouse'].browse([dest])[0].lot_stock_id

        pick_type = self.env['stock.picking.type'].search([('code','=','incoming'),('default_location_dest_id','parent_of',dest.id)],limit=1)
        user = self.env['res.users'].browse(self.env.uid)

        purchase = self.env['purchase.order'].create({
            'name': (self.env['ir.sequence'].next_by_code('purchase.order') or '') + _(' to ') + str(dest.name),
            'partner_id': supplier.id,
            'picking_type_id': pick_type.id,
            'responsable': respon,
            'res_signature': sign,
            'partner_ref': ref,
            'date_planned': self.get_utc_time(rec_date, user.tz),
        })

        p_ids = self.env['product.product'].browse(products.keys())
        user = self.env['res.users'].browse(self.env.uid)
        for p1 in p_ids:
            move = self.env['purchase.order.line'].create({
                'name': p1.name,
                'product_id':p1.id,
                'product_qty': products[p1.id][1],
                'order_id': purchase.id,
                'date_planned': purchase.date_planned,
                'product_uom': p1.uom_id.id,
                'price_unit': products[p1.id][2],
            })
        purchase.button_confirm()

        for pick in purchase.picking_ids:
            for move in pick.move_lines:
                move.write({'location_dest_id': dest.id, 'quantity_done': move.product_uom_qty})
                move.move_line_ids.write({'location_dest_id': dest.id})
        if validate:
            purchase.picking_ids.button_validate()
        return True

    @api.model
    def warehouse_ops_count(self):
        out_ = self.env['stock.picking'].search_count([('picking_type_code','=','outgoing'),('state','=','assigned')])
        inc_ = self.env['stock.picking'].search_count([('picking_type_code','=','incoming'),('state','=','assigned')])
        int_ = self.env['stock.picking'].search_count([('picking_type_code','=','internal'),('state','=','assigned')])
        return {'out': out_, 'inc': inc_, 'int': int_}

    @api.model
    def warehouse_ops_views(self, operation):
        domain = [['state','=','assigned']]
        name = ""
        if operation == 'inc':
            domain += [['picking_type_code','=','incoming']]
            name = _("Receipts")
        elif operation == 'int':
            domain += [['picking_type_code','=','internal']]
            name = _("Internal Transfers")
        elif operation == 'out':
            domain += [['picking_type_code','=','outgoing']]
            name = _("Delivery Orders")
        return {
            'name': name,
            'type': 'ir.actions.act_window',
            'res_model': 'stock.picking',
            'views': [[self.env.ref("binhex_inventory_log.binhex_stock_picking_kanban").id, 'kanban']],
            'target': 'fullscreen',
            'domain': domain,
        }

    @api.model
    def get_picking(self, pick_id):
        picking = self.env['stock.picking'].search([('id', '=', pick_id)], limit=1)
        return {'picking': picking.read(), 'lines': picking.move_lines.read()}

    @api.model
    def validate_picking(self, pick_id, lines, b_order, dest, respon=False, sign=False):
        lines = {int(k):v for k,v in lines.items()}
        pick = self.env['stock.picking'].search([('id', '=', pick_id)], limit=1)
        if dest:
            pick.write({'location_dest_id': dest['id']})
        pick.write({
                'responsable': respon,
                'res_signature': sign,
                })
        need_BO = False
        for move in pick.move_ids_without_package:
            move.write({'quantity_done': lines[move.id]['quantity_done']})
            if move.product_uom_qty > move.quantity_done:
                need_BO = True
        if need_BO:
            backorder = self.env['stock.backorder.confirmation'].create({'pick_ids': [(6, _, [pick.id])]}) #{'pick_ids': [(6, _, [pick.id])], 'backorder_confirmation_line_ids': [(0, 0, {'to_backorder': True, 'picking_id': pick.id})]})
            if b_order == 1 or b_order == '1':
                return backorder.with_context(button_validate_picking_ids = [pick.id]).process()
            else:
                return backorder.process_cancel_backorder()
        return pick.with_context(skip_overprocessed_check=True).button_validate()

    @api.model
    def check_barcode_validation(self, barcode, list_moves):
        list_moves = [int(k) for k in list_moves]
        p = self.env['product.product'].search(['|','|','|',['barcode', '=', barcode],['barcode', '=', barcode.replace("'","-")],['name', '=', barcode],['name', '=', barcode.replace("'","-")]]).mapped('id')
        l = self.env['stock.location'].search_read(['|','|','|',['barcode', '=', barcode],['barcode', '=', barcode.replace("'","-")],['name', '=', barcode],['name', '=', barcode.replace("'","-")]],['display_name'])
        if len(p) == 0:
            return {'l': l, 'moves': []}
        moves = self.env['stock.move'].search_read([('id','in',list_moves),('product_id','in',p)],['name'])
        return {'l': l, 'moves': moves}

    @api.model
    def quick_info_barcode(self, barcode):
        p = self.env['product.product'].search_read(['|','|','|',['barcode', '=', barcode],['barcode', '=', barcode.replace("'","-")],['name', '=', barcode],['name', '=', barcode.replace("'","-")]],['display_name'])
        l = self.env['stock.location'].search_read(['|','|','|',['barcode', '=', barcode],['barcode', '=', barcode.replace("'","-")],['name', '=', barcode],['name', '=', barcode.replace("'","-")]],['display_name'])
        self.env['stock.quant']._merge_quants()
        self.env['stock.quant']._unlink_zero_quants()
        if len(p) > 0:
            quants = self.env['stock.quant'].search([('product_id', '=', p[0]['id'])]).filtered(lambda quant: quant.location_id.usage == 'internal').read(['location_id', 'reserved_quantity', 'quantity'])
            return {'mode': 'p', 'name': p[0]['display_name'], 'quants': quants}
        elif len(l) > 0:
            quants = self.env['stock.quant'].search_read([('location_id', 'child_of', l[0]['id'])], ['product_id', 'reserved_quantity', 'quantity'])
            return {'mode': 'l', 'name': l[0]['display_name'], 'quants': quants}
        else:
            return False  

    @api.model
    def quick_info_by_id(self, id, mode):
        if mode == 'p':
            p = self.env['product.product'].search_read([['id', '=', id]],['display_name'])
        else:
            l = self.env['stock.location'].search_read([['id', '=', id]],['display_name'])
        self.env['stock.quant']._merge_quants()
        self.env['stock.quant']._unlink_zero_quants()
        if mode == 'p' and len(p) > 0:
            quants = self.env['stock.quant'].search([('product_id', '=', p[0]['id'])]).filtered(lambda quant: quant.location_id.usage == 'internal').read(['location_id', 'reserved_quantity', 'quantity'])
            return {'mode': 'p', 'name': p[0]['display_name'], 'quants': quants}
        elif mode == 'l' and len(l) > 0:
            quants = self.env['stock.quant'].search_read([('location_id', 'child_of', l[0]['id'])], ['product_id', 'reserved_quantity', 'quantity'])
            return {'mode': 'l', 'name': l[0]['display_name'], 'quants': quants}
        else:
            return False    

    @api.model
    def create_inventory(self, lines):
        for loc_k in lines.keys():
            inv = self.env['stock.inventory'].create({
                'name': _("InvApp ") + lines[loc_k]['name'] + ' ' + str(fields.Date.today()), 
                'location_id': loc_k,
                'filter': 'partial',
                })
            inv.action_start()
            for prod_k in lines[loc_k].keys():
                if prod_k != 'name':
                    self.env['stock.inventory.line'].create({
                        'inventory_id': inv.id,
                        'product_id': int(prod_k),
                        'location_id': loc_k,
                        'product_qty': lines[loc_k][prod_k]['qty'],
                        })
            inv.action_validate()

class Purchase(models.Model):
    _inherit = "purchase.order"
    res_signature = fields.Binary(string=_("Respon Signature"))
    responsable = fields.Many2one("hr.employee", string=_("Responsable"))
