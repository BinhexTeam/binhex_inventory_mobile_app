# -*- coding: utf-8 -*-
from odoo import http

# class BinhexMaterialMove(http.Controller):
#     @http.route('/binhex_material_move/binhex_material_move/', auth='public')
#     def index(self, **kw):
#         return "Hello, world"

#     @http.route('/binhex_material_move/binhex_material_move/objects/', auth='public')
#     def list(self, **kw):
#         return http.request.render('binhex_material_move.listing', {
#             'root': '/binhex_material_move/binhex_material_move',
#             'objects': http.request.env['binhex_material_move.binhex_material_move'].search([]),
#         })

#     @http.route('/binhex_material_move/binhex_material_move/objects/<model("binhex_material_move.binhex_material_move"):obj>/', auth='public')
#     def object(self, obj, **kw):
#         return http.request.render('binhex_material_move.object', {
#             'object': obj
#         })