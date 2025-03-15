import PocketBase, { ClientResponseError } from 'pocketbase';
import dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090');

interface CollectionOptions {
    listRule: string | null;
    viewRule: string | null;
    createRule: string | null;
    updateRule: string | null;
    deleteRule: string | null;
}

interface SchemaField {
    name: string;
    type: string;
    required: boolean;
    options?: Record<string, unknown>;
    [key: string]: unknown;
}

async function recreateCollection(name: string, schema: SchemaField[], options: Partial<CollectionOptions> = {}) {
    try {
        // Try to get the collection
        try {
            const collection = await pb.collections.getOne(name);
            console.log(`Deleting existing collection ${name}...`);
            await pb.collections.delete(collection.id);
        } catch (error) {
            if (!(error instanceof ClientResponseError && error.status === 404)) {
                throw error;
            }
        }

        // Create new collection
        console.log(`Creating collection ${name}...`);
        await pb.collections.create({
            name,
            type: 'base',
            schema,
            ...options
        });
        console.log(`Collection ${name} created successfully with all fields`);
    } catch (error) {
        console.error(`Error recreating collection ${name}:`, error);
        throw error;
    }
}

async function updateCollection(pb: PocketBase, name: string, schema: SchemaField[], options: Partial<CollectionOptions> = {}) {
    try {
        await pb.collections.update(name, {
            schema,
            ...options
        });
        console.log(`Collection "${name}" updated successfully`);
    } catch (error) {
        try {
            await pb.collections.create({
                name,
                type: 'base',
                schema,
                listRule: null,
                viewRule: null,
                createRule: null,
                updateRule: null,
                deleteRule: null,
                ...options
            });
            console.log(`Collection "${name}" created successfully`);
        } catch (createError) {
            console.error(`Error creating collection "${name}":`, createError);
        }
    }
}

async function initializePocketBase() {
    try {
        // Authenticate as admin using the admin API
        await pb.admins.authWithPassword(
            process.env.POCKETBASE_ADMIN_EMAIL || '',
            process.env.POCKETBASE_ADMIN_PASSWORD || ''
        );

        console.log('Successfully authenticated as admin');

        // Recreate Products Collection
        const productsSchema = [
            {
                name: 'name',
                type: 'text',
                required: true,
            },
            {
                name: 'description',
                type: 'text',
                required: true,
            },
            {
                name: 'price',
                type: 'number',
                required: true,
                min: 0,
            },
            {
                name: 'images',
                type: 'file[]',
                required: true,
                options: {
                    maxSelect: 10,
                    maxSize: 5242880,
                    mimeTypes: ["image/jpg", "image/jpeg", "image/png", "image/webp"]
                }
            },
            {
                name: 'colors',
                type: 'json',
                required: true,
            },
            {
                name: 'features',
                type: 'text[]',
                required: true,
                options: {
                    maxSelect: 10
                }
            },
            {
                name: 'dimensions',
                type: 'text',
                required: true,
            },
            {
                name: 'material',
                type: 'text',
                required: true,
            },
            {
                name: 'care',
                type: 'text[]',
                required: true,
                options: {
                    maxSelect: 10
                }
            },
            {
                name: 'category',
                type: 'select',
                required: true,
                options: {
                    values: ['totes', 'crossbody', 'backpack']
                }
            },
            {
                name: 'tags',
                type: 'text[]',
                required: true,
                options: {
                    maxSelect: 10
                }
            },
            {
                name: 'bestseller',
                type: 'bool',
                required: true,
            },
            {
                name: 'new',
                type: 'bool',
                required: true,
            },
            {
                name: 'inStock',
                type: 'bool',
                required: true,
            },
            {
                name: 'reviews',
                type: 'number',
                required: false,
                min: 0,
            }
        ];

        await updateCollection(pb, 'products', productsSchema, {
            listRule: "",
            viewRule: "",
            createRule: "@request.auth.id != ''",
            updateRule: "@request.auth.id != '' && @request.auth.type = 'admin'",
            deleteRule: "@request.auth.id != '' && @request.auth.type = 'admin'"
        });

        // Recreate Addresses Collection first (since Orders depends on it)
        const addressesSchema = [
            {
                name: 'user',
                type: 'relation',
                required: true,
                options: {
                    collectionId: '_pb_users_auth_',
                    cascadeDelete: true,
                    maxSelect: 1
                }
            },
            {
                name: 'street',
                type: 'text',
                required: true,
            },
            {
                name: 'city',
                type: 'text',
                required: true,
            },
            {
                name: 'state',
                type: 'text',
                required: true,
            },
            {
                name: 'postalCode',
                type: 'text',
                required: true,
            },
            {
                name: 'country',
                type: 'text',
                required: true,
            },
            {
                name: 'isDefault',
                type: 'bool',
                required: true,
            }
        ];

        await updateCollection(pb, 'addresses', addressesSchema, {
            listRule: "@request.auth.id = user",
            viewRule: "@request.auth.id = user",
            createRule: "@request.auth.id != ''",
            updateRule: "@request.auth.id = user",
            deleteRule: "@request.auth.id = user"
        });

        // Recreate Orders Collection
        const ordersSchema = [
            {
                name: 'user',
                type: 'relation',
                required: true,
                options: {
                    collectionId: '_pb_users_auth_',
                    cascadeDelete: false,
                    maxSelect: 1
                }
            },
            {
                name: 'products',
                type: 'json',
                required: true,
            },
            {
                name: 'subtotal',
                type: 'number',
                required: true,
                min: 0,
            },
            {
                name: 'total',
                type: 'number',
                required: true,
                min: 0,
            },
            {
                name: 'shipping_cost',
                type: 'number',
                required: true,
                min: 0,
            },
            {
                name: 'status',
                type: 'select',
                required: true,
                options: {
                    values: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
                }
            },
            {
                name: 'payment_status',
                type: 'select',
                required: true,
                options: {
                    values: ['pending', 'paid', 'failed', 'refunded'],
                }
            },
            {
                name: 'shipping_address',
                type: 'relation',
                required: true,
                options: {
                    collectionId: 'addresses',
                    cascadeDelete: false,
                    maxSelect: 1
                }
            },
            {
                name: 'customer_name',
                type: 'text',
                required: true,
            },
            {
                name: 'customer_email',
                type: 'text',
                required: true,
            },
            {
                name: 'customer_phone',
                type: 'text',
                required: true,
            }
        ];

        await updateCollection(pb, 'orders', ordersSchema, {
            listRule: 'user.id = @request.auth.id',
            viewRule: 'user.id = @request.auth.id',
            createRule: '@request.auth.id != ""',
            updateRule: 'user.id = @request.auth.id',
            deleteRule: 'user.id = @request.auth.id'
        });

        // Add Carts Collection
        const cartsSchema = [
            {
                name: 'user',
                type: 'relation',
                required: true,
                options: {
                    collectionId: '_pb_users_auth_',
                    cascadeDelete: true,
                    maxSelect: 1
                }
            },
            {
                name: 'items',
                type: 'json',
                required: true,
            }
        ];

        await updateCollection(pb, 'carts', cartsSchema, {
            listRule: 'user.id = @request.auth.id',
            viewRule: 'user.id = @request.auth.id',
            createRule: '@request.auth.id != ""',
            updateRule: 'user.id = @request.auth.id',
            deleteRule: 'user.id = @request.auth.id'
        });

        console.log('PocketBase initialization completed successfully');
    } catch (error) {
        console.error('Error initializing PocketBase:', error);
        process.exit(1);
    }
}

initializePocketBase(); 