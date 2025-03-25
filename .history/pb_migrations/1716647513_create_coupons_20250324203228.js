/// <reference path="../pb_data/types.d.ts" />

migrate((db) => {
  // Create coupons collection
  const collection = new Collection({
    name: 'coupons',
    type: 'base',
    system: false,
    schema: [
      {
        name: 'code',
        type: 'text',
        system: false,
        required: true,
        unique: true,
        options: {
          min: 3,
          max: 50,
          pattern: '',
        },
      },
      {
        name: 'type',
        type: 'select',
        system: false,
        required: true,
        options: {
          maxSelect: 1,
          values: ['percentage', 'fixed_amount'],
        },
      },
      {
        name: 'amount',
        type: 'number',
        system: false,
        required: true,
        options: {
          min: 0,
          max: null,
        },
      },
      {
        name: 'active',
        type: 'bool',
        system: false,
        required: false,
        options: {},
      },
      {
        name: 'expires_at',
        type: 'date',
        system: false,
        required: false,
        options: {
          min: '',
          max: '',
        },
      },
      {
        name: 'min_order_value',
        type: 'number',
        system: false,
        required: false,
        options: {
          min: 0,
          max: null,
        },
      },
      {
        name: 'max_uses',
        type: 'number',
        system: false,
        required: false,
        options: {
          min: 0,
          max: null,
        },
      },
      {
        name: 'current_uses',
        type: 'number',
        system: false,
        required: false,
        options: {
          min: 0,
          max: null,
        },
      },
      {
        name: 'description',
        type: 'text',
        system: false,
        required: false,
        options: {
          min: null,
          max: 255,
          pattern: '',
        },
      },
    ],
    indexes: [
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_coupon_code ON coupons (code)',
    ],
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  // Revert: delete the coupons collection
  return Dao(db).deleteCollection('coupons');
});
