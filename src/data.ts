import { Recipe } from './types';

export const RECIPES: Recipe[] = [
  {
    id: 'ndole-poulet',
    name: 'Ndolé au Poulet',
    description: 'A rich Cameroonian stew made with bitter leaves, nuts, and tender chicken. High-end editorial food photography style.',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800', // Ndolé proxy image (rich green stew)
    time: '45 min',
    difficulty: 'Medium',
    budget: 'Budget-friendly',
    score: 82,
    tags: ['High Protein', 'Authentic'],
    nutrition: {
      protein: 24,
      fat: 18,
      carbs: 12,
      fiber: 6,
      iron: 4.2,
      vitC: 12
    },
    ingredients: [
      { id: '1', name: 'Ndolé leaves', quantity: '2 large handfuls', metric: '≈ 200g', isEssential: true },
      { id: '2', name: 'Ground crayfish', quantity: '1 small palm', metric: '≈ 30g' },
      { id: '3', name: 'Chicken pieces', quantity: '3 medium pieces' },
      { id: '4', name: 'Onion', quantity: '1 medium bulb' },
      { id: '5', name: 'Palm oil', quantity: 'half a small cup', metric: '≈ 50ml' },
      { id: '6', name: 'Groundnut paste', quantity: '2 tablespoons', isEssential: true }
    ],
    steps: [
      'Thoroughly wash the Ndolé leaves multiple times to reduce bitterness, then boil them until tender and drain.',
      'In a large pot, sear the chicken pieces with sliced onions and a pinch of salt until browned and partially cooked.',
      'Blend the groundnuts into a smooth paste and add to the chicken. Stir in the Ndolé leaves and ground crayfish.',
      'Heat palm oil in a separate pan, sauté remaining onions, and pour over the Ndolé mixture. Simmer for 10 minutes and serve.'
    ],
    cookware: ['Large pot', 'Wooden spoon', 'Frying pan', 'Blender']
  },
  {
    id: 'eru',
    name: 'Eru',
    description: 'A vibrant dark green Cameroonian vegetable soup rich with finely shredded leaves and assorted meats.',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800', // Eru proxy image
    time: '60 min',
    difficulty: 'Medium',
    budget: 'Mid-range',
    score: 74,
    tags: ['Fiber Rich'],
    nutrition: { protein: 20, fat: 15, carbs: 10, fiber: 8, iron: 3.5, vitC: 15 },
    ingredients: [],
    steps: [],
    cookware: ['Wok', 'Mortar and Pestle', 'Serving bowl']
  },
  {
    id: 'koki',
    name: 'Koki Beans',
    description: 'A bright golden-orange steamed black-eyed pea pudding wrapped in vibrant green plantain leaves.',
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=800', // Koki/Beans proxy
    time: '90 min',
    difficulty: 'Hard',
    budget: 'Budget-friendly',
    score: 68,
    tags: ['Vegetarian'],
    nutrition: { protein: 15, fat: 5, carbs: 45, fiber: 10, iron: 5, vitC: 5 },
    ingredients: [],
    steps: [],
    cookware: ['Banana leaves', 'Steamer pot', 'Mixing bowl']
  },
  {
    id: 'achu',
    name: 'Achu Soup',
    description: 'An elegant presentation of Achu Soup with pale yellow pounded cocoyam and vibrant orange-red soup.',
    image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&q=80&w=800', // Achu/Soup proxy
    time: '40 min',
    difficulty: 'Medium',
    budget: 'Mid-range',
    score: 69,
    tags: ['Traditional'],
    nutrition: { protein: 12, fat: 30, carbs: 35, fiber: 5, iron: 2.8, vitC: 8 },
    ingredients: [],
    steps: [],
    cookware: ['Pounding mortar', 'Cocoyam leaves', 'Large saucepan']
  },
  {
    id: 'beignets',
    name: 'Beignets de Haricots',
    description: 'Golden, crispy deep-fried black-eyed pea fritters. Cameroonian street food made healthy.',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=800', // Beignets proxy
    time: '30 min',
    difficulty: 'Easy',
    budget: 'Budget-friendly',
    score: 65,
    tags: ['High Protein', 'Snack'],
    nutrition: { protein: 18, fat: 12, carbs: 25, fiber: 7, iron: 3, vitC: 4 },
    ingredients: [],
    steps: [],
    cookware: ['Deep fryer', 'Slotted spoon', 'Paper towels']
  }
];
