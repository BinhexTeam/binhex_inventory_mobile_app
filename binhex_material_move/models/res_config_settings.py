# Copyright 2022 Binhex Systems Solutions
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).
# -*- coding: utf-8 -*-


from odoo import fields, models, _


class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    group_use_locations = fields.Boolean(string=_('Use Locations instead of Warehouses'),
        implied_group="binhex_material_move.group_use_locations")