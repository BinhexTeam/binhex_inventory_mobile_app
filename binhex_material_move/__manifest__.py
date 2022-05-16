# -*- coding: utf-8 -*-
{
    'name': "Binhex Material Move",

    'summary': """
        Module containing backend functionalities of binhex_inventory_log.""",

    'description': """
        Application settings and other functionality are added.
    """,

    'author': "Binhex Systems Solutions",
    'website': "https://binhex.es/",

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/12.0/odoo/addons/base/data/ir_module_category_data.xml
    # for the full list
    'category': 'Warehouse',
    'version': '0.1',

    # any module necessary for this one to work correctly
    'depends': ['stock','product','hr'],

    # always loaded
    'data': [
        # 'security/ir.model.access.csv',
        'security/security.xml',
        'views/res_config_settings_views.xml',
        'views/views.xml',
        'views/web_asset_backend_template.xml',
    ],
    'qweb': [
        "static/src/xml/templates.xml",
    ],
}