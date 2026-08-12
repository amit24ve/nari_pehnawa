// ─────────────────────────────────────────────────────────────
//  Global category product + filter data
//  Add / edit entries here — no need to touch any page file
// ─────────────────────────────────────────────────────────────

const IMGS = {
  saree: '/gob-saree-1.png',
  lehenga: '/gob-lehenga-1.png',
  kurta: '/gob-kurta-set-1.png',
  kurta2: '/gob-kurta-set-2.png',
  suit: '/gob-suit-set-1.png',
  anarkali: '/gob-anarkali-1.png',
  coord: '/gob-coord-set-1.png',
  festive: '/gob-festive-wear-1.png',
  dress: '/gob-dress-1.png',
  palazzo: '/gob-palazzo-set-1.png',
  salwar: '/gob-salwar-suit-1.png',
};

// ── helpers ───────────────────────────────────────────────────
const makeProduct = (id, name, brand, price, originalPrice, discount, image, tags = [], rating = 4, reviews = 0) => ({
  id, name, brand, price, originalPrice, discount, image, tags, rating,
  reviews: reviews || Math.floor(Math.random() * 800 + 50),
  onSale: !!discount,
  isNew: id % 3 === 0,
});

// ── Product pools ─────────────────────────────────────────────

export const PRODUCT_POOLS = {
  // ── WOMEN'S INDIAN WEAR ──────────────────────────────────────
  sarees: [
    makeProduct(101, 'Banarasi Silk Saree - Royal Blue', 'Nykaa Fashion', 5499, 7999, 31, IMGS.saree, ['silk', 'banarasi', 'blue', 'wedding']),
    makeProduct(102, 'Kanjivaram Silk Saree - Maroon Gold', 'Fabindia', 8999, 12000, 25, IMGS.salwar, ['kanjivaram', 'silk', 'maroon', 'festive']),
    makeProduct(103, 'Georgette Printed Saree - Peach', 'Global Online Bazar', 2199, 3499, 37, IMGS.saree, ['georgette', 'printed', 'peach', 'casual']),
    makeProduct(104, 'Pure Cotton Block Print Saree', 'Fabindia', 1899, 2499, 24, IMGS.kurta, ['cotton', 'block print', 'casual']),
    makeProduct(105, 'Chiffon Embroidered Saree - Pink', 'Global Online Bazar', 3299, 4500, 27, IMGS.saree, ['chiffon', 'embroidered', 'pink', 'party']),
    makeProduct(106, 'Designer Net Saree - Bridal Red', 'Kalki Fashion', 11999, 16000, 25, IMGS.festive, ['net', 'bridal', 'red', 'wedding']),
    makeProduct(107, 'Linen Handloom Saree - Teal', 'Fabindia', 3499, null, null, IMGS.coord, ['linen', 'handloom', 'teal', 'office']),
    makeProduct(108, 'Organza Saree - Pastel Mint', 'Global Online Bazar', 4799, 5999, 20, IMGS.saree, ['organza', 'pastel', 'party']),
    makeProduct(109, 'Tussar Silk Saree - Mustard', 'Jaypore', 6499, 8500, 24, IMGS.festive, ['tussar', 'silk', 'mustard', 'festive']),
    makeProduct(110, 'Cotton Kalamkari Saree', 'Fabindia', 2499, null, null, IMGS.kurta2, ['cotton', 'kalamkari', 'casual']),
    makeProduct(111, 'Patola Silk Saree - Multi', 'Kalki Fashion', 7999, 9999, 20, IMGS.saree, ['patola', 'silk', 'festive']),
    makeProduct(112, 'Mysore Crepe Saree - Lavender', 'Global Online Bazar', 2899, 3999, 28, IMGS.palazzo, ['crepe', 'lavender', 'casual']),
  ],

  lehengas: [
    makeProduct(201, 'Bridal Lehenga Choli - Red Gold', 'Kalki Fashion', 24999, 35000, 29, IMGS.lehenga, ['bridal', 'red', 'gold', 'wedding']),
    makeProduct(202, 'Embroidered Lehenga Set - Navy', 'Global Online Bazar', 8999, 12000, 25, IMGS.festive, ['embroidered', 'navy', 'party', 'wedding']),
    makeProduct(203, 'Georgette Floral Lehenga - Pink', 'Nykaa Fashion', 5499, 7999, 31, IMGS.lehenga, ['georgette', 'floral', 'pink', 'festive']),
    makeProduct(204, 'Velvet Zari Lehenga - Maroon', 'Kalki Fashion', 16999, 22000, 23, IMGS.lehenga, ['velvet', 'zari', 'maroon', 'bridal']),
    makeProduct(205, 'Kids Lehenga Choli - Peach', 'Global Online Bazar', 2499, 3499, 29, IMGS.dress, ['kids', 'peach', 'festive']),
    makeProduct(206, 'Organza Mirror Work Lehenga', 'Nykaa Fashion', 9999, 13500, 26, IMGS.lehenga, ['organza', 'mirror work', 'festive']),
    makeProduct(207, 'Sharara Set - Lavender Silk', 'Global Online Bazar', 4999, 7000, 29, IMGS.palazzo, ['sharara', 'silk', 'lavender', 'wedding']),
    makeProduct(208, 'Anarkali Lehenga Set - Teal Green', 'Jaypore', 7499, 9999, 25, IMGS.anarkali, ['anarkali', 'teal', 'festive']),
  ],

  'kurta-sets': [
    makeProduct(301, 'Cotton Anarkali Kurta Set - Peach', 'Global Online Bazar', 2899, 3999, 28, IMGS.kurta, ['cotton', 'anarkali', 'peach', 'casual']),
    makeProduct(302, 'Chikankari Kurta with Palazzo - White', 'Fabindia', 3499, 4999, 30, IMGS.kurta2, ['chikankari', 'white', 'palazzo', 'casual']),
    makeProduct(303, 'Straight Cut Kurta Trouser Set', 'Global Online Bazar', 2199, 2999, 27, IMGS.salwar, ['straight', 'ethnic', 'casual', 'office']),
    makeProduct(304, 'Ethnic Digital Print Kurta Set', 'Nykaa Fashion', 1999, 2999, 33, IMGS.kurta, ['printed', 'digital print', 'summer']),
    makeProduct(305, 'Rayon Embroidered Kurta Palazzo', 'Global Online Bazar', 2599, 3499, 26, IMGS.palazzo, ['rayon', 'embroidered', 'palazzo', 'casual']),
    makeProduct(306, 'Silk Blend Festive Kurta Set', 'Kalki Fashion', 5999, 8000, 25, IMGS.festive, ['silk', 'festive', 'party']),
    makeProduct(307, 'A-Line Long Kurta with Pants', 'Fabindia', 3299, null, null, IMGS.kurta2, ['a-line', 'cotton', 'casual']),
    makeProduct(308, 'Floral Block Print Short Kurta', 'Global Online Bazar', 1699, 2299, 26, IMGS.kurta, ['block print', 'floral', 'summer', 'casual']),
    makeProduct(309, 'Linen Coord Kurta Set - Sage Green', 'Fabindia', 3999, 5500, 27, IMGS.coord, ['linen', 'coord', 'sage', 'office']),
    makeProduct(310, 'Bandhani Kurta Set - Multicolor', 'Jaypore', 2799, null, null, IMGS.kurta2, ['bandhani', 'colorful', 'casual']),
    makeProduct(311, 'Angrakha Style Kurta Set', 'Global Online Bazar', 3199, 4499, 29, IMGS.kurta, ['angrakha', 'ethnic', 'festive']),
    makeProduct(312, 'Designer Patiala Suit Set', 'Nykaa Fashion', 2499, 3299, 24, IMGS.salwar, ['patiala', 'punjabi', 'casual']),
  ],

  'suit-sets': [
    makeProduct(401, 'Unstitched Lawn Suit Set - Floral', 'Global Online Bazar', 1599, 2199, 27, IMGS.suit, ['lawn', 'floral', 'unstitched']),
    makeProduct(402, 'Embroidered Anarkali Suit - Royal Blue', 'Kalki Fashion', 6999, 9500, 26, IMGS.anarkali, ['embroidered', 'anarkali', 'blue', 'festive']),
    makeProduct(403, 'Cotton Salwar Suit - Beige Printed', 'Fabindia', 2299, 2999, 23, IMGS.salwar, ['cotton', 'printed', 'casual']),
    makeProduct(404, 'Heavy Work Bridal Suit - Red', 'Kalki Fashion', 18999, 25000, 24, IMGS.festive, ['bridal', 'heavy work', 'red']),
    makeProduct(405, 'Georgette Churidar Suit - Mustard', 'Global Online Bazar', 3199, 4499, 29, IMGS.suit, ['georgette', 'churidar', 'mustard']),
    makeProduct(406, 'Palazzo Suit with Dupatta - Green', 'Nykaa Fashion', 2799, 3799, 26, IMGS.palazzo, ['palazzo', 'green', 'casual']),
    makeProduct(407, 'Silk Punjabi Suit - Pink Gold', 'Global Online Bazar', 4999, 6999, 29, IMGS.festive, ['silk', 'punjabi', 'pink', 'festive']),
    makeProduct(408, 'Linen Straight Suit - Off White', 'Fabindia', 3499, null, null, IMGS.suit, ['linen', 'straight', 'office', 'casual']),
  ],

  dresses: [
    makeProduct(501, 'Floral Midi Dress - Summer Bliss', 'Global Online Bazar', 1899, 2699, 30, IMGS.dress, ['floral', 'midi', 'summer', 'casual']),
    makeProduct(502, 'Off-Shoulder Maxi Dress - Pink', 'Nykaa Fashion', 2499, 3499, 29, IMGS.dress, ['off-shoulder', 'maxi', 'party']),
    makeProduct(503, 'Cotton A-Line Dress - Stripes', 'Fabindia', 1699, 2299, 26, IMGS.kurta, ['cotton', 'a-line', 'stripes', 'casual']),
    makeProduct(504, 'Bodycon Party Dress - Black', 'Global Online Bazar', 2199, 2999, 27, IMGS.dress, ['bodycon', 'party', 'black']),
    makeProduct(505, 'Wrap Dress - Peacock Print', 'Nykaa Fashion', 2799, 3799, 26, IMGS.dress, ['wrap', 'printed', 'casual']),
    makeProduct(506, 'Boho Tiered Skirt Dress', 'Jaypore', 3299, 4500, 27, IMGS.festive, ['boho', 'tiered', 'casual']),
    makeProduct(507, 'Shift Dress - Solid Lilac', 'Global Online Bazar', 1499, 1999, 25, IMGS.dress, ['shift', 'solid', 'office', 'casual']),
    makeProduct(508, 'Ruffle Hem Mini Dress - Coral', 'Nykaa Fashion', 1899, 2499, 24, IMGS.dress, ['ruffle', 'mini', 'party']),
    makeProduct(509, 'Ethnic Printed Wrap Dress', 'Global Online Bazar', 2099, 2899, 28, IMGS.kurta2, ['ethnic', 'wrap', 'printed', 'casual']),
    makeProduct(510, 'Cold Shoulder Dress - Teal', 'Nykaa Fashion', 2399, null, null, IMGS.dress, ['cold shoulder', 'teal', 'party']),
    makeProduct(511, 'Kimono Sleeve Dress - Ivory', 'Fabindia', 3199, 4299, 26, IMGS.kurta, ['kimono', 'ivory', 'casual']),
    makeProduct(512, 'Power Shoulder Formal Dress', 'Global Online Bazar', 2699, 3799, 29, IMGS.dress, ['formal', 'office', 'power']),
  ],

  anarkali: [
    makeProduct(601, 'Floor-Length Anarkali - Peacock Blue', 'Global Online Bazar', 4999, 6999, 29, IMGS.anarkali, ['floor length', 'peacock', 'blue', 'festive']),
    makeProduct(602, 'Georgette Anarkali Suit - Wine', 'Kalki Fashion', 6999, 9000, 22, IMGS.anarkali, ['georgette', 'wine', 'wedding']),
    makeProduct(603, 'Cotton Anarkali Kurta - Mint', 'Fabindia', 2799, null, null, IMGS.kurta, ['cotton', 'mint', 'casual']),
    makeProduct(604, 'Embroidered Anarkali Set - Gold', 'Nykaa Fashion', 7499, 10500, 29, IMGS.festive, ['embroidered', 'gold', 'bridal']),
    makeProduct(605, 'Layered Net Anarkali - Purple', 'Global Online Bazar', 5499, 7999, 31, IMGS.anarkali, ['net', 'purple', 'party']),
    makeProduct(606, 'Pakistani Style Anarkali - Pink', 'Kalki Fashion', 8999, 12000, 25, IMGS.anarkali, ['pakistani', 'pink', 'wedding']),
    makeProduct(607, 'Lucknowi Chikankari Anarkali', 'Jaypore', 4299, 5999, 28, IMGS.kurta2, ['chikankari', 'lucknowi', 'casual']),
    makeProduct(608, 'A-Line Anarkali with Dupatta', 'Global Online Bazar', 3599, 4999, 28, IMGS.anarkali, ['a-line', 'casual', 'festive']),
  ],

  'coord-sets': [
    makeProduct(701, 'Matching Coord Set - Lavender', 'Global Online Bazar', 2499, 3499, 29, IMGS.coord, ['coord', 'lavender', 'casual']),
    makeProduct(702, 'Tropical Print Coord Set', 'Nykaa Fashion', 2999, 3999, 25, IMGS.coord, ['tropical', 'printed', 'casual']),
    makeProduct(703, 'Floral Shorts Co-Ord Set', 'Global Online Bazar', 1999, 2699, 26, IMGS.dress, ['floral', 'shorts', 'summer']),
    makeProduct(704, 'Blazer Pants Co-Ord Set - Black', 'Nykaa Fashion', 3999, 5499, 27, IMGS.coord, ['blazer', 'black', 'formal', 'party']),
    makeProduct(705, 'Ethnic Angrakhi Coord Set', 'Jaypore', 3499, null, null, IMGS.kurta2, ['ethnic', 'angrakhi', 'festive']),
    makeProduct(706, 'Tie-Dye Coord Set - Indigo', 'Global Online Bazar', 2299, 2999, 23, IMGS.coord, ['tie-dye', 'indigo', 'casual']),
  ],

  // ── MEN'S ────────────────────────────────────────────────────
  'mens-fashion': [
    makeProduct(1001, 'Classic Cotton Kurta - White', 'Manyavar', 1499, 1999, 25, IMGS.kurta, ['cotton', 'kurta', 'white', 'casual']),
    makeProduct(1002, 'Sherwani Set - Royal Blue', 'Manyavar', 12999, 18000, 28, IMGS.festive, ['sherwani', 'blue', 'wedding']),
    makeProduct(1003, 'Kurta Pajama Set - Mint', 'Fabindia', 2799, null, null, IMGS.coord, ['kurta pajama', 'mint', 'festive']),
    makeProduct(1004, 'Printed Nehru Jacket Set', 'Manyavar', 4499, 5999, 25, IMGS.suit, ['nehru jacket', 'printed', 'festive']),
    makeProduct(1005, 'Slim Fit Formal Shirt - Navy', 'Global Online Bazar', 1299, 1799, 28, IMGS.salwar, ['shirt', 'formal', 'navy']),
    makeProduct(1006, 'Casual Linen Shirt - Beige', 'Fabindia', 1699, null, null, IMGS.kurta2, ['linen', 'shirt', 'casual']),
    makeProduct(1007, 'Dhoti Kurta Set - Off White', 'Manyavar', 3999, 5499, 27, IMGS.kurta, ['dhoti', 'off white', 'festive']),
    makeProduct(1008, 'Jodhpuri Suit Set - Beige', 'Manyavar', 8999, 12000, 25, IMGS.suit, ['jodhpuri', 'beige', 'wedding']),
  ],

  sherwanis: [
    makeProduct(1101, 'Embroidered Sherwani - Ivory Gold', 'Manyavar', 17999, 24000, 25, IMGS.festive, ['sherwani', 'ivory', 'gold', 'wedding']),
    makeProduct(1102, 'Velvet Sherwani Set - Wine', 'Manyavar', 22999, 32000, 28, IMGS.suit, ['velvet', 'wine', 'wedding']),
    makeProduct(1103, 'Jodhpuri Bandhgala Suit', 'Global Online Bazar', 9999, 13500, 26, IMGS.coord, ['jodhpuri', 'bandhgala', 'wedding']),
    makeProduct(1104, 'Digital Print Sherwani - Blue', 'Manyavar', 14999, 19999, 25, IMGS.festive, ['digital print', 'blue', 'festive']),
    makeProduct(1105, 'Kids Sherwani Set - Red', 'Global Online Bazar', 3499, 4999, 30, IMGS.dress, ['kids', 'sherwani', 'red', 'festive']),
    makeProduct(1106, 'Achkan Style Coat - Cream', 'Manyavar', 7999, 9999, 20, IMGS.suit, ['achkan', 'cream', 'festive']),
  ],

  // ── KIDS ─────────────────────────────────────────────────────
  'kids-fashion': [
    makeProduct(2001, 'Girls Lehenga Choli - Peach', 'Global Online Bazar', 1499, 1999, 25, IMGS.lehenga, ['kids', 'lehenga', 'peach', 'festive']),
    makeProduct(2002, 'Boys Sherwani Set - Maroon', 'Global Online Bazar', 2499, 3499, 29, IMGS.festive, ['kids', 'sherwani', 'maroon']),
    makeProduct(2003, 'Girls Frock - Floral Print', 'Hopscotch', 999, 1499, 33, IMGS.dress, ['kids', 'frock', 'floral', 'casual']),
    makeProduct(2004, 'Boys Kurta Pajama - Ivory', 'Global Online Bazar', 1299, 1799, 28, IMGS.kurta, ['kids', 'kurta pajama', 'ivory']),
    makeProduct(2005, 'Girls Anarkali Set - Purple', 'Hopscotch', 1799, 2499, 28, IMGS.anarkali, ['kids', 'anarkali', 'purple', 'festive']),
    makeProduct(2006, 'Boys Dhoti Kurta - Golden', 'Global Online Bazar', 1599, 2199, 27, IMGS.kurta2, ['kids', 'dhoti', 'golden']),
    makeProduct(2007, 'Infant Onesie Set - 3pc', 'Mothercare', 899, 1199, 25, IMGS.dress, ['infant', 'onesie', 'casual']),
    makeProduct(2008, 'Girls Salwar Suit - Sky Blue', 'Global Online Bazar', 1199, 1699, 29, IMGS.salwar, ['kids', 'salwar suit', 'blue', 'casual']),
  ],

  // ── BEAUTY ───────────────────────────────────────────────────
  'beauty-health': [
    makeProduct(3001, 'Vitamin C Brightening Serum', 'Minimalist', 699, 999, 30, IMGS.coord, ['skincare', 'vitamin c', 'serum', 'brightening']),
    makeProduct(3002, 'SPF 50 Sunscreen Gel - 60ml', 'Dot & Key', 549, 799, 31, IMGS.dress, ['sunscreen', 'spf50', 'gel']),
    makeProduct(3003, 'Hydrating Face Moisturizer', 'Plum', 399, 549, 27, IMGS.kurta, ['moisturizer', 'hydrating', 'skincare']),
    makeProduct(3004, 'Rose Hip Hair Oil - 100ml', 'Mamaearth', 449, 599, 25, IMGS.palazzo, ['hair oil', 'rosehip', 'hair care']),
    makeProduct(3005, 'Matte Liquid Lipstick - Berry', 'NY Bae', 299, 399, 25, IMGS.festive, ['lipstick', 'matte', 'berry', 'makeup']),
    makeProduct(3006, 'Rice Water Shampoo - 250ml', 'WOW', 529, 699, 24, IMGS.saree, ['shampoo', 'rice water', 'hair care']),
    makeProduct(3007, 'Ubtan Face Wash - 100ml', 'Biotique', 199, 299, 33, IMGS.coord, ['face wash', 'ubtan', 'skincare']),
    makeProduct(3008, 'Long-Lasting Kajal Pencil', 'Lakme', 199, 249, 20, IMGS.anarkali, ['kajal', 'eye', 'makeup']),
    makeProduct(3009, 'Collagen Boosting Under Eye Cream', 'Minimalist', 849, 1099, 23, IMGS.kurta2, ['eye cream', 'collagen', 'skincare']),
    makeProduct(3010, 'Protein Conditioner - 300ml', 'Tresemmé', 349, 449, 22, IMGS.dress, ['conditioner', 'protein', 'hair care']),
    makeProduct(3011, 'Lavender Body Butter - 200g', 'The Body Shop', 1299, 1699, 24, IMGS.lehenga, ['body butter', 'lavender', 'body care']),
    makeProduct(3012, 'Multivitamin Gummies - 60 ct', 'Wellbeing Nutrition', 599, 799, 25, IMGS.palazzo, ['vitamins', 'supplements', 'wellness']),
  ],

  // ── HOME & LIVING ────────────────────────────────────────────
  'home-living': [
    makeProduct(4001, 'King Size Cotton Bedsheet Set', 'Global Online Bazar', 1499, 1999, 25, IMGS.kurta, ['bedsheet', 'cotton', 'king size']),
    makeProduct(4002, 'Embroidered Cushion Cover Set of 5', 'Jaypore', 999, 1499, 33, IMGS.coord, ['cushion', 'embroidered', 'decor']),
    makeProduct(4003, 'Handloom Throw Blanket - Indigo', 'Fabindia', 2499, null, null, IMGS.salwar, ['blanket', 'handloom', 'indigo']),
    makeProduct(4004, 'Floral Table Runner - 6 Seater', 'Global Online Bazar', 799, 999, 20, IMGS.palazzo, ['table runner', 'floral', 'dining']),
    makeProduct(4005, 'Door Curtain Pair - Block Print', 'Fabindia', 1799, 2299, 22, IMGS.kurta2, ['curtain', 'block print', 'door']),
    makeProduct(4006, 'Scented Soy Wax Candles Set', 'Global Online Bazar', 599, 799, 25, IMGS.dress, ['candles', 'soy wax', 'decor']),
    makeProduct(4007, 'Terracotta Vase - Handcrafted', 'Jaypore', 1299, null, null, IMGS.festive, ['vase', 'terracotta', 'decor']),
    makeProduct(4008, 'Quilted Diwan Set - Rajasthani', 'Global Online Bazar', 3499, 4999, 30, IMGS.lehenga, ['diwan', 'quilted', 'rajasthani']),
  ],

  // ── JEWELLERY ────────────────────────────────────────────────
  jewellery: [
    makeProduct(5001, 'Kundan Bridal Necklace Set', 'Tanishq Style', 4999, 6999, 29, IMGS.festive, ['kundan', 'necklace', 'bridal', 'gold plated']),
    makeProduct(5002, 'Oxidised Silver Jhumka Earrings', 'Global Online Bazar', 799, 1199, 33, IMGS.anarkali, ['oxidised', 'jhumka', 'earrings']),
    makeProduct(5003, 'Meenakari Bangles Set of 4', 'Jaypore', 1299, 1799, 28, IMGS.lehenga, ['meenakari', 'bangles', 'festive']),
    makeProduct(5004, 'Temple Gold Maang Tikka', 'Global Online Bazar', 999, 1499, 33, IMGS.festive, ['maang tikka', 'temple', 'gold']),
    makeProduct(5005, 'Polki Diamond Ring - Sterling Silver', 'Tanishq Style', 2499, 3499, 29, IMGS.dress, ['polki', 'ring', 'silver']),
    makeProduct(5006, 'Layered Pearl Necklace', 'Nykaa Fashion', 1499, 1999, 25, IMGS.saree, ['pearl', 'necklace', 'layered', 'casual']),
    makeProduct(5007, 'Anklets (Payal) - Silver', 'Global Online Bazar', 599, 799, 25, IMGS.palazzo, ['anklet', 'payal', 'silver']),
    makeProduct(5008, 'Nose Pin with Chain - Gold', 'Jaypore', 799, null, null, IMGS.kurta, ['nose pin', 'gold', 'traditional']),
  ],

  // ── FOOTWEAR ─────────────────────────────────────────────────
  footwear: [
    makeProduct(6001, 'Block Heel Sandals - Tan Brown', 'Mochi', 1999, 2799, 29, IMGS.coord, ['heels', 'sandals', 'tan', 'casual']),
    makeProduct(6002, "Women's Kolhapuri Flats - Beige", 'Global Online Bazar', 999, 1399, 29, IMGS.kurta, ['kolhapuri', 'flats', 'ethnic']),
    makeProduct(6003, "Men's Nagra Shoes - Red", 'Mochi', 2499, 3499, 29, IMGS.salwar, ['nagra', 'mens', 'ethnic', 'festive']),
    makeProduct(6004, "Women's Embroidered Jutti - Pink", 'Global Online Bazar', 1299, 1799, 28, IMGS.festive, ['jutti', 'embroidered', 'ethnic']),
    makeProduct(6005, "Men's Formal Oxford Shoes", 'Bata', 2999, null, null, IMGS.suit, ['oxford', 'formal', 'mens']),
    makeProduct(6006, "Women's Sneakers - White", 'Puma', 3499, 4499, 22, IMGS.dress, ['sneakers', 'white', 'casual']),
    makeProduct(6007, "Kids School Shoes - Black", 'Bata', 899, 1199, 25, IMGS.anarkali, ['kids', 'school shoes', 'black']),
    makeProduct(6008, "Platform Block Mules - Nude", 'Nykaa Fashion', 1799, 2499, 28, IMGS.coord, ['mules', 'platform', 'nude', 'party']),
  ],

  // ── FESTIVE ──────────────────────────────────────────────────
  'festive-wear': [
    makeProduct(7001, 'Banarasi Silk Lehenga - Crimson', 'Kalki Fashion', 19999, 28000, 29, IMGS.lehenga, ['banarasi', 'lehenga', 'crimson', 'bridal']),
    makeProduct(7002, 'Embellished Saree - Emerald', 'Global Online Bazar', 8999, 11999, 25, IMGS.festive, ['embellished', 'saree', 'emerald']),
    makeProduct(7003, 'Velvet Anarkali Gown - Royal Purple', 'Kalki Fashion', 9999, 13999, 29, IMGS.anarkali, ['velvet', 'anarkali', 'purple', 'gown']),
    makeProduct(7004, 'Bridal Sherwani - Cream Gold', 'Manyavar', 24999, 35000, 29, IMGS.suit, ['sherwani', 'bridal', 'cream', 'gold']),
    makeProduct(7005, 'Zardosi Work Suit Set', 'Kalki Fashion', 13999, 18999, 26, IMGS.festive, ['zardosi', 'suit', 'work']),
    makeProduct(7006, 'Mirror Work Chaniya Choli', 'Global Online Bazar', 7499, 9999, 25, IMGS.festive, ['mirror work', 'chaniya', 'garba']),
    makeProduct(7007, 'Kids Festive Lehenga Set', 'Hopscotch', 2499, 3499, 29, IMGS.lehenga, ['kids', 'lehenga', 'festive']),
    makeProduct(7008, 'Men Kurta Pajama Shawl Set', 'Manyavar', 5999, 7999, 25, IMGS.kurta, ['kurta', 'shawl', 'mens', 'festive']),
  ],

  // ── NEW ARRIVALS (mix) ───────────────────────────────────────
  'new-arrivals': [
    makeProduct(9001, 'Organza Saree - Pastels', 'Global Online Bazar', 3499, null, null, IMGS.saree, ['saree', 'organza', 'new']),
    makeProduct(9002, 'Embroidered Kurta Set - Sage', 'Global Online Bazar', 2899, null, null, IMGS.kurta, ['kurta', 'sage', 'new']),
    makeProduct(9003, 'Velvet Anarkali - Berry', 'Global Online Bazar', 5999, null, null, IMGS.anarkali, ['anarkali', 'velvet', 'new']),
    makeProduct(9004, 'Midi Dress - Stone Wash', 'Global Online Bazar', 1999, null, null, IMGS.dress, ['dress', 'midi', 'new']),
    makeProduct(9005, 'Coord Set - Dusty Rose', 'Global Online Bazar', 2499, null, null, IMGS.coord, ['coord', 'dusty rose', 'new']),
    makeProduct(9006, 'Lehenga Choli - Powder Blue', 'Global Online Bazar', 7999, null, null, IMGS.lehenga, ['lehenga', 'blue', 'new']),
    makeProduct(9007, 'Block Print Palazzo Set', 'Global Online Bazar', 1799, null, null, IMGS.palazzo, ['palazzo', 'block print', 'new']),
    makeProduct(9008, 'Ombre Dupatta Suit Set', 'Global Online Bazar', 3299, null, null, IMGS.suit, ['suit', 'ombre', 'new']),
    makeProduct(9009, 'Mirror Work Kurti - Indigo', 'Global Online Bazar', 1599, null, null, IMGS.kurta2, ['kurti', 'mirror work', 'new']),
    makeProduct(9010, 'Tie-Dye Co-Ord Set', 'Global Online Bazar', 2199, null, null, IMGS.coord, ['coord', 'tie-dye', 'new']),
    makeProduct(9011, 'Floral Kaftan Dress', 'Global Online Bazar', 1899, null, null, IMGS.dress, ['kaftan', 'floral', 'new']),
    makeProduct(9012, 'Traditional Mojari - Embroidered', 'Global Online Bazar', 1499, null, null, IMGS.festive, ['mojari', 'embroidered', 'new']),
  ],

  // ── SALE ─────────────────────────────────────────────────────
  sale: [
    makeProduct(8001, 'Banarasi Saree - Clearance', 'Global Online Bazar', 1999, 5999, 67, IMGS.saree, ['saree', 'sale', 'banarasi']),
    makeProduct(8002, 'Anarkali Suit Set - FLAT 50% OFF', 'Global Online Bazar', 2499, 4999, 50, IMGS.anarkali, ['anarkali', 'sale']),
    makeProduct(8003, 'Lehenga Choli - End of Season', 'Global Online Bazar', 3999, 9999, 60, IMGS.lehenga, ['lehenga', 'sale']),
    makeProduct(8004, 'Kurta Set - Mega Sale', 'Global Online Bazar', 999, 2499, 60, IMGS.kurta, ['kurta', 'sale']),
    makeProduct(8005, 'Coord Set - 55% Off', 'Global Online Bazar', 1299, 2899, 55, IMGS.coord, ['coord', 'sale']),
    makeProduct(8006, 'Palazzo Suit - Clearance', 'Global Online Bazar', 1499, 3999, 63, IMGS.palazzo, ['palazzo', 'sale']),
    makeProduct(8007, 'Dress - Flat 40% Off', 'Global Online Bazar', 1199, 1999, 40, IMGS.dress, ['dress', 'sale']),
    makeProduct(8008, 'Sherwani Set - Heavy Discount', 'Global Online Bazar', 5999, 14999, 60, IMGS.suit, ['sherwani', 'sale']),
    makeProduct(8009, 'Saree - End of Season Offer', 'Global Online Bazar', 899, 2499, 64, IMGS.saree, ['saree', 'sale']),
    makeProduct(8010, 'Festive Lehenga - Clearance Sale', 'Global Online Bazar', 4499, 12999, 65, IMGS.festive, ['lehenga', 'sale', 'festive']),
    makeProduct(8011, 'Jewellery Set - Mega Offer', 'Global Online Bazar', 799, 1999, 60, IMGS.anarkali, ['jewellery', 'sale']),
    makeProduct(8012, 'Home Linen Set - Clearance', 'Global Online Bazar', 699, 1799, 61, IMGS.kurta2, ['home', 'linen', 'sale']),
  ],
};

// Aliases — so any URL slug maps to the right pool
export const CATEGORY_ALIAS = {
  // ── Nari Pehnawa kurti types ──────────────────────────────────────────────
  'anarkali-kurtis':     'anarkali',
  'straight-kurtis':    'kurta-sets',
  'aline-kurtis':       'kurta-sets',
  'a-line-kurtis':      'kurta-sets',
  'printed-kurtis':     'kurta-sets',
  'embroidered-kurtis': 'kurta-sets',
  'denim-kurtis':       'kurta-sets',
  'kaftan-kurtis':      'dresses',
  'chikankari-kurtis':  'kurta-sets',
  'palazzo-set-kurtis': 'kurta-sets',
  'angrakha-kurtis':    'kurta-sets',
  // ── Nari Pehnawa home decoration ─────────────────────────────────────────
  'vases-planters':       'home-living',
  'wall-decor':           'home-living',
  'lighting-lamps':       'home-living',
  'cushions-covers':      'home-living',
  'rugs-carpets':         'home-living',
  'pooja-essentials':     'home-living',
  'candles-fragrances':   'home-living',
  'photo-frames-art':     'home-living',
  // ── women ─────────────────────────────────────────────────────────────────
  'womens-fashion': 'kurta-sets',
  'salwar-suits': 'suit-sets',
  'kurtas': 'kurta-sets',
  'kurta-sets': 'kurta-sets',
  'palazzo-sets': 'kurta-sets',
  'coord-sets': 'coord-sets',
  'dupattas': 'kurta-sets',
  'womens-tops': 'dresses',
  'womens-jeans': 'dresses',
  'skirts': 'dresses',
  'jumpsuits': 'dresses',
  'womens-blazers': 'dresses',
  'womens-hoodies': 'dresses',
  'womens-western': 'dresses',
  'bridal': 'festive-wear',
  'party-wear': 'festive-wear',
  'casual-wear': 'kurta-sets',
  'office-wear': 'kurta-sets',
  'plus-size': 'kurta-sets',
  'wedding': 'festive-wear',
  // ── men ───────────────────────────────────────────────────────────────────
  'mens-fashion': 'mens-fashion',
  'mens-kurtas': 'mens-fashion',
  'kurta-pajama': 'mens-fashion',
  'nehru-jackets': 'mens-fashion',
  'mens-shirts': 'mens-fashion',
  'sherwanis': 'sherwanis',
  // ── kids ──────────────────────────────────────────────────────────────────
  'kids-fashion': 'kids-fashion',
  'girls-dresses': 'kids-fashion',
  'boys-ethnic': 'kids-fashion',
  // ── beauty ────────────────────────────────────────────────────────────────
  'beauty-health': 'beauty-health',
  'skincare': 'beauty-health',
  'makeup': 'beauty-health',
  // ── home ──────────────────────────────────────────────────────────────────
  'home-living': 'home-living',
  'home-decor': 'home-living',
  'bedsheets': 'home-living',
  'curtains': 'home-living',
  // ── jewellery & footwear ──────────────────────────────────────────────────
  'jewellery': 'jewellery',
  'footwear': 'footwear',
  // ── virtual ───────────────────────────────────────────────────────────────
  'new-arrivals': 'new-arrivals',
  'sale': 'sale',
};

// ── Dynamic filters per category type ────────────────────────
export const CATEGORY_FILTERS = {
  clothing: {
    priceRange: [0, 25000],
    sections: [
      { id: 'occasion', label: 'Occasion', options: ['Wedding', 'Party', 'Festive', 'Casual', 'Office', 'Bridal'] },
      { id: 'fabric', label: 'Fabric', options: ['Cotton', 'Silk', 'Georgette', 'Chiffon', 'Linen', 'Rayon', 'Velvet', 'Net', 'Organza'] },
      { id: 'color', label: 'Color', options: ['Red', 'Pink', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', 'White', 'Black', 'Gold', 'Multicolor'] },
      { id: 'size', label: 'Size', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'] },
      { id: 'discount', label: 'Discount', options: ['10% & above', '25% & above', '40% & above', '50% & above'] },
    ],
  },
  beauty: {
    priceRange: [0, 3000],
    sections: [
      { id: 'concern', label: 'Skin Concern', options: ['Brightening', 'Hydrating', 'Anti-Ageing', 'Acne', 'Sun Protection', 'Dark Circles'] },
      { id: 'skinType', label: 'Skin Type', options: ['Oily', 'Dry', 'Combination', 'Sensitive', 'Normal', 'All Skin Types'] },
      { id: 'brand', label: 'Brand', options: ['Minimalist', 'Mamaearth', 'Plum', 'Dot & Key', 'WOW', 'Biotique', 'Lakme'] },
      { id: 'discount', label: 'Discount', options: ['10% & above', '20% & above', '30% & above'] },
    ],
  },
  home: {
    priceRange: [0, 10000],
    sections: [
      { id: 'material', label: 'Material', options: ['Cotton', 'Linen', 'Polyester', 'Silk', 'Jute', 'Velvet', 'Satin'] },
      { id: 'color', label: 'Color', options: ['White', 'Beige', 'Blue', 'Green', 'Multicolor', 'Red', 'Yellow', 'Grey'] },
      { id: 'occasion', label: 'Occasion', options: ['Festive', 'Casual', 'Wedding', 'Daily Use', 'Gifting'] },
      { id: 'discount', label: 'Discount', options: ['10% & above', '20% & above', '30% & above'] },
    ],
  },
  jewellery: {
    priceRange: [0, 15000],
    sections: [
      { id: 'type', label: 'Jewellery Type', options: ['Necklace', 'Earrings', 'Bangles', 'Ring', 'Anklet', 'Maang Tikka', 'Set'] },
      { id: 'material', label: 'Material', options: ['Gold Plated', 'Silver', 'Oxidised', 'Kundan', 'Polki', 'Pearl', 'Beaded'] },
      { id: 'occasion', label: 'Occasion', options: ['Bridal', 'Wedding', 'Party', 'Casual', 'Daily Wear', 'Office'] },
      { id: 'discount', label: 'Discount', options: ['10% & above', '25% & above', '40% & above'] },
    ],
  },
  footwear: {
    priceRange: [0, 8000],
    sections: [
      { id: 'type', label: 'Type', options: ['Flats', 'Heels', 'Sandals', 'Sneakers', 'Formal Shoes', 'Ethnic', 'Boots', 'Slippers'] },
      { id: 'occasion', label: 'Occasion', options: ['Casual', 'Formal', 'Ethnic', 'Party', 'Sports', 'Wedding'] },
      { id: 'size', label: 'Size (UK)', options: ['3', '4', '5', '6', '7', '8', '9', '10'] },
      { id: 'color', label: 'Color', options: ['Black', 'Brown', 'Tan', 'White', 'Gold', 'Silver', 'Pink', 'Nude'] },
      { id: 'discount', label: 'Discount', options: ['10% & above', '25% & above', '40% & above'] },
    ],
  },
};

// Map pool key → filter set
export const POOL_FILTER_MAP = {
  sarees: 'clothing', lehengas: 'clothing', 'kurta-sets': 'clothing',
  'suit-sets': 'clothing', dresses: 'clothing', anarkali: 'clothing',
  'coord-sets': 'clothing', 'festive-wear': 'clothing', 'mens-fashion': 'clothing',
  sherwanis: 'clothing', 'kids-fashion': 'clothing', 'new-arrivals': 'clothing',
  sale: 'clothing', 'beauty-health': 'beauty', 'home-living': 'home',
  jewellery: 'jewellery', footwear: 'footwear',
};

// Map category/slug → banner image + label
export const CATEGORY_BANNERS = {
  default:              { bg: 'from-[#8B0000] via-[#6B0000] to-[#3d0000]',  label: 'Explore Collection' },
  // Kurti types
  'anarkali-kurtis':    { bg: 'from-[#8B0000] via-[#6B0000] to-[#3d0000]',  label: '✨ Anarkali Kurtis' },
  'straight-kurtis':    { bg: 'from-[#a52a2a] via-[#8B0000] to-[#5d0000]',  label: '👗 Straight Kurtis' },
  'aline-kurtis':       { bg: 'from-teal-900 via-cyan-900 to-blue-900',      label: '🌸 A-Line Kurtis' },
  'printed-kurtis':     { bg: 'from-pink-800 via-rose-900 to-red-900',       label: '🎨 Printed Kurtis' },
  'embroidered-kurtis': { bg: 'from-amber-900 via-orange-900 to-red-900',    label: '💎 Embroidered Kurtis' },
  'denim-kurtis':       { bg: 'from-slate-900 via-blue-900 to-indigo-900',   label: '👖 Denim Kurtis' },
  'kaftan-kurtis':      { bg: 'from-purple-900 via-pink-900 to-rose-900',    label: '🌺 Kaftan Kurtis' },
  'chikankari-kurtis':  { bg: 'from-rose-900 via-pink-800 to-fuchsia-900',   label: '🪡 Chikankari Kurtis' },
  'palazzo-set-kurtis': { bg: 'from-emerald-900 via-teal-900 to-cyan-900',   label: '✨ Palazzo Set Kurtis' },
  'angrakha-kurtis':    { bg: 'from-[#8B0000] via-amber-900 to-orange-900',  label: '🏺 Angrakha Kurtis' },
  // Home Decoration
  'vases-planters':     { bg: 'from-lime-900 via-green-900 to-emerald-900',  label: '🌿 Vases & Planters' },
  'wall-decor':         { bg: 'from-stone-900 via-amber-900 to-yellow-900',  label: '🖼️ Wall Decor' },
  'lighting-lamps':     { bg: 'from-yellow-800 via-amber-800 to-orange-900', label: '💡 Lighting & Lamps' },
  'cushions-covers':    { bg: 'from-sky-900 via-blue-900 to-indigo-900',     label: '🛋️ Cushions & Covers' },
  'rugs-carpets':       { bg: 'from-rose-900 via-red-900 to-pink-900',       label: '🪴 Rugs & Carpets' },
  'pooja-essentials':   { bg: 'from-amber-900 via-orange-900 to-yellow-900', label: '🪔 Pooja Essentials' },
  'candles-fragrances': { bg: 'from-purple-900 via-violet-900 to-indigo-900',label: '🕯️ Candles & Fragrances' },
  'photo-frames-art':   { bg: 'from-slate-900 via-gray-900 to-zinc-900',     label: '🖼️ Photo Frames & Art' },
  // Legacy / fallback
  anarkali:             { bg: 'from-[#8B0000] via-[#6B0000] to-[#3d0000]',  label: '👗 Anarkali' },
  'kurta-sets':         { bg: 'from-teal-900 via-cyan-900 to-blue-900',      label: '✨ Kurta Sets' },
  'new-arrivals':       { bg: 'from-pink-700 via-rose-800 to-red-900',       label: '🆕 New Arrivals' },
  sale:                 { bg: 'from-red-900 via-rose-900 to-pink-900',       label: '🔥 SALE — Upto 70% Off!' },
};

export function getProductsForSlug(slug) {
  const normalized = (slug || '').toLowerCase().replace(/\s+/g, '-');
  const poolKey = CATEGORY_ALIAS[normalized] || normalized;
  return PRODUCT_POOLS[poolKey] || PRODUCT_POOLS['new-arrivals'];
}

export function getFiltersForSlug(slug) {
  const normalized = (slug || '').toLowerCase().replace(/\s+/g, '-');
  const poolKey = CATEGORY_ALIAS[normalized] || normalized;
  const filterKey = POOL_FILTER_MAP[poolKey] || 'clothing';
  return CATEGORY_FILTERS[filterKey];
}

export function getBannerForSlug(slug) {
  const normalized = (slug || '').toLowerCase().replace(/\s+/g, '-');
  const poolKey = CATEGORY_ALIAS[normalized] || normalized;
  return CATEGORY_BANNERS[poolKey] || CATEGORY_BANNERS.default;
}
