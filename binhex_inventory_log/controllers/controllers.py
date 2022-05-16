# -*- coding: utf-8 -*-
from odoo import http

# class BinhexInventoryLog(http.Controller):
#     @http.route('/binhex_inventory_log/binhex_inventory_log/', auth='public')
#     def index(self, **kw):
#         return "Hello, world"

#     @http.route('/binhex_inventory_log/binhex_inventory_log/objects/', auth='public')
#     def list(self, **kw):
#         return http.request.render('binhex_inventory_log.listing', {
#             'root': '/binhex_inventory_log/binhex_inventory_log',
#             'objects': http.request.env['binhex_inventory_log.binhex_inventory_log'].search([]),
#         })

#     @http.route('/binhex_inventory_log/binhex_inventory_log/objects/<model("binhex_inventory_log.binhex_inventory_log"):obj>/', auth='public')
#     def object(self, obj, **kw):
#         return http.request.render('binhex_inventory_log.object', {
#             'object': obj
#         })