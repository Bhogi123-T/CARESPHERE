from flask import Blueprint, jsonify, request
from backend.models import PharmacyInventory, db

pharmacy_bp = Blueprint('pharmacy_bp', __name__)

def seed_pharmacy_inventory():
    if PharmacyInventory.query.count() == 0:
        default_items = [
            {'name': 'O- Negative Blood Bags', 'category': 'Blood Bank', 'stock': 12, 'status': 'OPTIMAL'},
            {'name': 'Anti-Venom (Snake)', 'category': 'Emergency', 'stock': 4, 'status': 'LOW'},
            {'name': 'Adrenaline Auto-Injectors', 'category': 'Emergency', 'stock': 50, 'status': 'OPTIMAL'},
            {'name': 'Tetanus Toxoid', 'category': 'Vaccines', 'stock': 0, 'status': 'OUT_OF_STOCK'},
            {'name': 'IV Fluids (Saline)', 'category': 'Fluids', 'stock': 150, 'status': 'OPTIMAL'},
            {'name': 'Portable Oxygen Cylinders', 'category': 'Respiratory', 'stock': 2, 'status': 'LOW'},
        ]
        for item in default_items:
            db.session.add(PharmacyInventory(
                name=item['name'],
                category=item['category'],
                stock=item['stock'],
                status=item['status']
            ))
        db.session.commit()

@pharmacy_bp.route('/inventory', methods=['GET'])
def get_inventory():
    seed_pharmacy_inventory()
    items = PharmacyInventory.query.all()
    result = []
    for i in items:
        result.append({
            'id': i.id,
            'name': i.name,
            'category': i.category,
            'stock': i.stock,
            'status': i.status
        })
    return jsonify(result), 200

@pharmacy_bp.route('/inventory/<int:item_id>', methods=['POST'])
def update_inventory(item_id):
    item = PharmacyInventory.query.get(item_id)
    if not item:
        return jsonify({"msg": "Item not found"}), 404
        
    data = request.json
    item.stock = data.get('stock', item.stock)
    item.status = data.get('status', item.status)
    
    db.session.commit()
    
    return jsonify({
        'id': item.id,
        'name': item.name,
        'category': item.category,
        'stock': item.stock,
        'status': item.status
    }), 200
