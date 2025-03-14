
import { Product } from '../types/product';

export const products: Product[] = [
  {
    id: 1,
    name: "Classic Canvas Tote",
    description: "Our signature tote bag made from durable canvas with reinforced handles. Perfect for everyday use, shopping, or a day at the beach.",
    price: 49.99,
    images: [
      "/product-images/create-a-mockup-of-white-tote-bag--aesthetic-backg.png",
      "/product-images/create-a-mockup-of-white-tote-bag-a-girl-wearing-i.png",
      "/product-images/create-a-modern-mockup-of-white-tote-bag-with-brow.png"
    ],
    colors: [
      { name: "Natural", value: "natural", hex: "#F6EFE0" },
      { name: "Mint", value: "mint", hex: "#9CCBBD" },
      { name: "Black", value: "black", hex: "#222222" }
    ],
    features: [
      "100% organic cotton canvas",
      "Reinforced handles",
      "Interior pocket",
      "Water-resistant lining"
    ],
    dimensions: "14\" H x 17\" W x 5\" D",
    material: "16oz organic cotton canvas",
    care: [
      "Spot clean with mild soap",
      "Air dry only",
      "Do not bleach"
    ],
    category: "totes",
    tags: ["canvas", "everyday", "classic"],
    bestseller: true,
    new: false,
    inStock: true
  },
  {
    id: 2,
    name: "Pocket Canvas Tote",
    description: "A functional tote with multiple exterior pockets for organization. Great for work, school, or travel.",
    price: 59.99,
    images: [
      "/product-images/create-a-mockup-of-teal-tote-bag--aesthetic-backgr.png",
      "/product-images/create-a-mockup-of-white-jute-purse-aesthetic-back.png",
      "/product-images/create-a-mockup-of-white-paper--textured-college-n.png"
    ],
    colors: [
      { name: "Natural", value: "natural", hex: "#F6EFE0" },
      { name: "Mint", value: "mint", hex: "#9CCBBD" },
      { name: "Black", value: "black", hex: "#222222" }
    ],
    features: [
      "100% organic cotton canvas",
      "Multiple exterior pockets",
      "Zippered top closure",
      "Adjustable shoulder strap"
    ],
    dimensions: "13\" H x 16\" W x 4\" D",
    material: "18oz organic cotton canvas",
    care: [
      "Spot clean with mild soap",
      "Air dry only",
      "Do not bleach"
    ],
    category: "totes",
    tags: ["pockets", "organization", "travel"],
    bestseller: false,
    new: true,
    inStock: true
  },
  {
    id: 3,
    name: "Mini Canvas Tote",
    description: "A smaller version of our classic tote, perfect for essentials. Lightweight and compact.",
    price: 39.99,
    images: [
      "/product-images/create-a-mockup-of-white-jute-purse-aesthetic-back (1).png",
      "/product-images/create-a-mockup-of-white-texture-iphone-case-in-ae.png",
      "/product-images/create-a-mockup-of-white-tote-bag--aesthetic-backg (1).png"
    ],
    colors: [
      { name: "Natural", value: "natural", hex: "#F6EFE0" },
      { name: "Mint", value: "mint", hex: "#9CCBBD" }
    ],
    features: [
      "100% organic cotton canvas",
      "Short handles",
      "Interior zip pocket",
      "Magnetic snap closure"
    ],
    dimensions: "10\" H x 12\" W x 3\" D",
    material: "14oz organic cotton canvas",
    care: [
      "Spot clean with mild soap",
      "Air dry only",
      "Do not bleach"
    ],
    category: "totes",
    tags: ["mini", "compact", "essentials"],
    bestseller: false,
    new: true,
    inStock: true
  },
  {
    id: 4,
    name: "Market Canvas Tote",
    description: "Designed for grocery shopping with reinforced bottom and extra capacity. Folds flat for storage.",
    price: 45.99,
    images: [
      "/product-images/create-a-mockup-of-black-tote-bag--aesthetic-backg.png",
      "/product-images/create-a-mockup-of-white-tote-bag--aesthetic-backg.png",
      "/product-images/create-a-mockup-of-white-tote-bag-a-girl-wearing-i.png"
    ],
    colors: [
      { name: "Natural", value: "natural", hex: "#F6EFE0" },
      { name: "Mint", value: "mint", hex: "#9CCBBD" },
      { name: "Black", value: "black", hex: "#222222" }
    ],
    features: [
      "100% organic cotton canvas",
      "Reinforced bottom",
      "Extra wide handles",
      "Folds flat for storage"
    ],
    dimensions: "16\" H x 20\" W x 8\" D",
    material: "20oz organic cotton canvas",
    care: [
      "Machine washable, cold water",
      "Air dry only",
      "Do not bleach"
    ],
    category: "totes",
    tags: ["market", "grocery", "large"],
    bestseller: true,
    new: false,
    inStock: true
  },
  {
    id: 5,
    name: "Crossbody Canvas Tote",
    description: "A versatile tote that can be carried by hand or worn crossbody with the adjustable strap.",
    price: 64.99,
    images: [
      "/product-images/create-a-mockup-of-white-tote-bag--aesthetic-backg.png",
      "/product-images/create-a-mockup-of-white-tote-bag-a-girl-wearing-i.png",
      "/product-images/create-a-modern-mockup-of-white-tote-bag-with-brow.png"
    ],
    colors: [
      { name: "Natural", value: "natural", hex: "#F6EFE0" },
      { name: "Black", value: "black", hex: "#222222" }
    ],
    features: [
      "100% organic cotton canvas",
      "Adjustable crossbody strap",
      "Interior and exterior pockets",
      "Zippered top closure"
    ],
    dimensions: "12\" H x 15\" W x 4\" D",
    material: "16oz organic cotton canvas with leather trim",
    care: [
      "Spot clean with mild soap",
      "Air dry only",
      "Do not bleach"
    ],
    category: "crossbody",
    tags: ["crossbody", "versatile", "everyday"],
    bestseller: false,
    new: false,
    inStock: true
  },
  {
    id: 6,
    name: "Canvas Backpack Tote",
    description: "Convertible tote that transforms into a backpack. Perfect for commuting or travel.",
    price: 79.99,
    images: [
      "/product-images/create-a-mockup-of-black-tote-bag--aesthetic-backg.png",
      "/product-images/create-a-mockup-of-teal-tote-bag--aesthetic-backgr.png",
      "/product-images/create-a-mockup-of-white-jute-purse-aesthetic-back.png"
    ],
    colors: [
      { name: "Natural", value: "natural", hex: "#F6EFE0" },
      { name: "Mint", value: "mint", hex: "#9CCBBD" },
      { name: "Black", value: "black", hex: "#222222" }
    ],
    features: [
      "100% organic cotton canvas",
      "Convertible straps",
      "Multiple pockets",
      "Padded laptop sleeve"
    ],
    dimensions: "16\" H x 14\" W x 5\" D",
    material: "18oz organic cotton canvas with leather trim",
    care: [
      "Spot clean with mild soap",
      "Air dry only",
      "Do not bleach"
    ],
    category: "backpack",
    tags: ["convertible", "backpack", "travel"],
    bestseller: true,
    new: false,
    inStock: true
  }
];

export const getBestsellers = (limit: number = 4): Product[] => {
  return products.filter(product => product.bestseller).slice(0, limit);
};

export const getNewArrivals = (limit: number = 4): Product[] => {
  return products.filter(product => product.new).slice(0, limit);
};

export const getProductById = (id: number): Product | undefined => {
  return products.find(product => product.id === id);
};

export const getProductsByCategory = (category: string): Product[] => {
  return products.filter(product => product.category === category);
};

export const getRelatedProducts = (product: Product, limit: number = 4): Product[] => {
  return products
    .filter(p => p.id !== product.id && p.category === product.category)
    .slice(0, limit);
};
