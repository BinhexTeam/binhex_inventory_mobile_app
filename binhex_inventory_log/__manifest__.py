# -*- coding: utf-8 -*-
{
    'name': "Inventory Mobile App",

    'summary': """
        Inventory mobile app interface""",

    'description': """
        The module allows you to carry out warehouse movements in a faster and easier way.
    """,

    'author': "Binhex Systems Solutions",
    'website': "https://binhex.es/",

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/12.0/odoo/addons/base/data/ir_module_category_data.xml
    # for the full list
    'category': 'Warehouse',
    'version': '0.1',

    # any module necessary for this one to work correctly
    'depends': ['base', 'binhex_material_move','sale_stock','purchase','web_digital_sign'],

    # always loaded
    'data': [
        'views/web_asset_backend_template.xml',
        'views/views.xml',
    ],
    'qweb': [
        "static/src/xml/templates.xml",
    ],
}