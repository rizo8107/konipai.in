import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase('https://backend-pocketbase.7za6uc.easypanel.host');

async function addSampleProduct() {
    try {
        // Authenticate as admin
        await pb.admins.authWithPassword(
            process.env.POCKETBASE_ADMIN_EMAIL || '',
            process.env.POCKETBASE_ADMIN_PASSWORD || ''
        );
        console.log('Successfully authenticated as admin');

        // Create a sample product
        const sampleProduct = {
            name: "Classic Canvas Tote Bag",
            description: "A versatile and durable canvas tote bag perfect for everyday use. Features reinforced handles and a spacious main compartment.",
            price: 29.99,
            colors: JSON.stringify({
                available: ["Natural", "Black", "Navy Blue"],
                primary: "Natural"
            }),
            features: JSON.stringify([
                "Reinforced handles",
                "Water-resistant canvas",
                "Interior pocket",
                "Magnetic closure",
                "Fits 15\" laptop"
            ]),
            dimensions: "16\"H x 14\"W x 4\"D",
            material: "100% Cotton Canvas",
            care: JSON.stringify([
                "Machine wash cold",
                "Do not bleach",
                "Line dry",
                "Iron on low heat if needed"
            ]),
            category: "Bags",
            tags: JSON.stringify([
                "tote",
                "canvas",
                "eco-friendly",
                "everyday",
                "casual"
            ]),
            bestseller: true,
            new: false,
            inStock: true,
            reviews: 4.5
        };

        // Create the product
        console.log('Creating sample product...');
        const record = await pb.collection('products').create(sampleProduct);
        console.log('Sample product created successfully:', record);

        // Fetch and verify the product
        console.log('\nFetching created product...');
        const createdProduct = await pb.collection('products').getOne(record.id);
        console.log('Fetched product details:', createdProduct);

    } catch (error) {
        console.error('Error adding sample product:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
        process.exit(1);
    }
}

// Run the function
console.log('Starting to add sample product...');
addSampleProduct(); 