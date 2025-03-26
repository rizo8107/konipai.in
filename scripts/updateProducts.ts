import PocketBase from 'pocketbase';

const pb = new PocketBase('https://backend-pocketbase.7za6uc.easypanel.host');

interface Product {
  id: string;
  name: string;
  material?: string;
  dimensions?: string;
  care?: string[];
}

const updateProducts = async () => {
  try {
    // Get all products
    const products = await pb.collection('products').getFullList<Product>();
    console.log(`Found ${products.length} products to update`);

    // Update each product
    for (const product of products) {
      const updateData = {
        specifications: {
          material: product.material || 'Premium Material',
          dimensions: product.dimensions || 'Standard Size',
          weight: '0.5 kg',
          capacity: 'Standard',
          style: 'Modern',
          pattern: 'Solid',
          closure: 'Standard',
          waterResistant: false
        },
        care_instructions: {
          cleaning: product.care || [
            'Spot clean with mild soap and water',
            'Do not machine wash',
            'Air dry in shade',
            'Do not bleach'
          ],
          storage: [
            'Store in a cool, dry place',
            'Avoid direct sunlight',
            'Keep away from moisture',
            'Use dust bag when not in use'
          ]
        },
        usage_guidelines: {
          recommended_use: [
            'Distribute weight evenly for better durability',
            'Clean spills immediately to prevent staining',
            'Use internal pockets for organization',
            'Avoid overloading beyond capacity'
          ],
          pro_tips: [
            'Use bag hooks when placing on floors',
            'Rotate usage to maintain shape',
            'Store stuffed to maintain structure',
            'Apply water repellent spray for protection'
          ]
        }
      };

      // Update the product
      await pb.collection('products').update(product.id, updateData);
      console.log(`Updated product: ${product.name}`);
    }

    console.log('All products updated successfully');
  } catch (error) {
    console.error('Error updating products:', error);
  }
};

// Run the update
updateProducts(); 