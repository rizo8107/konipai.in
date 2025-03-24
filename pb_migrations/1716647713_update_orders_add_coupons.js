/// <reference path="../pb_data/types.d.ts" />

migrate((db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("orders");

  // Add new coupon-related fields to orders collection
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "coupon_code",
    "name": "coupon_code",
    "type": "text",
    "required": false,
    "unique": false,
    "options": {
      "min": null,
      "max": 50,
      "pattern": ""
    }
  }));

  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "coupon_id",
    "name": "coupon_id",
    "type": "relation",
    "required": false,
    "unique": false,
    "options": {
      "collectionId": "coupons",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": 1,
      "displayFields": ["code"]
    }
  }));

  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "discount_amount",
    "name": "discount_amount",
    "type": "number",
    "required": false,
    "unique": false,
    "options": {
      "min": 0,
      "max": null,
      "noDecimal": false
    }
  }));

  return dao.saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("orders");

  // Remove coupon fields when migrating down
  collection.schema.removeField("coupon_code");
  collection.schema.removeField("coupon_id");
  collection.schema.removeField("discount_amount");

  return dao.saveCollection(collection);
});
