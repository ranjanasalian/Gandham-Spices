import artisanProcessImg from "../images/Artisan process.webp";
import biryaniImg from "../images/Biriyani.webp";
import rasamImg from "../images/Rasam.webp";
import biryaniGroundedImg from "../images/Biriyani grounded.webp";
import rasamGroundedImg from "../images/Rasam powder grounded.webp";
import homeImg from "../images/home.webp";
import recipeImg from "../images/recipe.webp";

export const navLinks = [
  { label: "Home", type: "route", href: "/" },
  { label: "Our Story", type: "scroll", target: "story" },
  { label: "Our Blends", type: "scroll", target: "blends" },
  { label: "Recipes", type: "scroll", target: "recipes" },
  { label: "Talk to Us", type: "scroll", target: "contact" },
];

export const heroContent = {
  headline: "Bring the Lost Fragrance Back to Your Kitchen.",
  subheadline:
    "Small-batch, hand-roasted spice blends that bridge the gap between tradition and your busy life.",
  ctaLabel: "Explore Our Blends",
  media: {
    type: "image",
    src: homeImg,
  },
};

export const storyContent = {
  heading: "OUR ARTISAN PROCESS",
  meaning:
    "In Sanskrit, “Gandham” means fragrance. It is the aroma of roasted coriander escaping the grinder, the curl of pepper steam that wakes up a pot of rasam-the scent of home cooking.",
  mission:
    "We follow a hands-on approach: slow-roasting, hand-grinding, and testing every batch ourselves to ensure the richness of home-style cooking fits perfectly into your modern life.",
  promise:
    'We only pack what we would serve at our own table, the whole spices, thoughtfully roasted and ground to keep the fragrance of your home-cooked meals alive."',
  image: artisanProcessImg,
};

export const products = [
  {
    id: "biryani",
    slug: "biryani",
    name: "Biryani Marination Mix",
    description: "The secret to authentic, aromatic biryani.",
    price: "₹150 / 100g",
    image: biryaniImg,
    ctaLabel: "View Recipe & Usage",
    ctaTarget: "/recipes/biryani",
  },
  {
    id: "rasam",
    slug: "rasam",
    name: "Temple-Style Rasam Powder",
    description:
      "Tangy, delicious, and soulful—just like South Indian temples.",
    price: "₹90 / 100g",
    image: rasamImg,
    ctaLabel: "View Recipe & Usage",
    ctaTarget: "/recipes/rasam",
  },
];

export const recipes = [
  {
    id: "biryani",
    slug: "biryani",
    title: "Biryani Marination Mix Powder",
    heroImage: biryaniGroundedImg,
    recipeHubImage: recipeImg,
    subtitle: "Directions for Use – Chicken Biryani (Serves 2–3)",
    ingredients: [
      "Chicken – 500 g",
      "Curd – 500 ml (½ litre)",
      "Salt – to taste",
      "Red chilli powder – 1 tsp (adjust to taste)",
      "Biryani Marination Mix – 2½ tbsp",
      "Ginger-garlic paste – 1½ tbsp",
      "Ghee – 2–3 tbsp",
      "Green chilli – 1 (or 2–3 for extra spice)",
      "Mint leaves – few",
      "Coriander leaves – few",
      "Onion – 3–4 medium, thinly sliced",
      "Rice – 2 glasses",
      "Water – as required",
    ],
    name: "Biryani Marination Mix",
    instructionsImage: biryaniGroundedImg,
    steps: [
      "Marinate 500 g chicken with 500 ml curd, salt to taste, 1 tsp chilli powder, 2½ tbsp Biryani Marination Mix, 1½ tbsp ginger-garlic paste, mint & coriander leaves. Rest for 1 hour.",
      "Heat 2–3 tbsp ghee in a cooker. Fry 3–4 sliced onions till golden. Keep half aside.",
      "Add marinated chicken, cook till boiling. Adjust salt & spice. Add little water if needed.",
      "Add 2 glasses rice + 1 glass water. Mix gently. Top with fried onions, mint & coriander. Close lid, cook for 1 whistle only. Rest & serve hot.",
    ],
  },
  {
    id: "rasam",
    slug: "rasam",
    title: "Temple-Style Rasam Powder",
    heroImage: rasamGroundedImg,
    subtitle: "Directions for Use",
    placeholder:
      "Detailed directions are on the way. Check back soon for the temple-style rasam ritual.",
    ingredients: [
      "4 tomatoes, cubed",
      "1 small piece ginger, smashed",
      "2–3 green chilies",
      "½ cup dal (optional)",
      "½ cup tamarind water",
      "1 tsp jaggery",
      "½ tsp turmeric",
      "salt to taste",
      "3–4 tsp Gandham Rasam Powder",
      "Tadka: 1 tsp coconut oil, ½–1 tsp mustard seeds, 2 dry red chilies, curry leaves",
      "Coriander leaves for garnish",
    ],
    name: "Rasam Powder-Temple Style",
    instructionsImage: rasamGroundedImg,
    steps: [
      "Cook ½ cup dal with 4 cubed tomatoes, 1 small smashed ginger, 2–3 slit green chilies, ½ tsp turmeric, 1 tsp jaggery, ½ cup tamarind water, and salt to taste in a pressure cooker for 1–2 whistles.",
      "Once the cooker has cooled, open the lid, place it on the stove, add 3–4 tsp Gandham Rasam Powder, bring it to a boil, and simmer for 3–4 minutes.",
      "Prepare the tadka: heat 1 tsp coconut oil, add ½ tsp mustard seeds, 2 dry byadgi chilies, and 2–3 curry leaves, then pour over the rasam.",
      "Garnish with coriander leaves and serve hot.",
    ],
  },
];

export const testimonials = [
  {
    quote:
      "Every jar smells like someone just roasted the spices in their backyard. The biryani mix took me straight to my grandmother’s kitchen.",
    name: "Anya Prabhu",
    title: "Food stylist, Bengaluru",
  },
  {
    quote:
      "Clients keep asking how our rasam suddenly tastes “temple-grade.” Gandham is now the not-so-secret weapon at our supper club.",
    name: "Chef Mira D’Souza",
    title: "Founder, Coastline Table",
  },
  {
    quote:
      "I trust the blends because I know there are no shortcuts—no fillers, no colors, just patience in a pouch.",
    name: "Arjun Rao",
    title: "Home cook & spice collector",
  },
];

export const socialProof = {
  instagramHandle: "@gandham.spices",
  instagramUrl: "https://instagram.com/gandham.spices",
};

export const contactContent = {
  tagline: "Talk to Us",
  description:
    "Need a custom blend, bulk order, or chef collaboration? Drop us a note and we will reply within 24 hours.",
  addressTagline: "Made with love in Brahmavar",
  form: {
    name: "Full Name",
    email: "Email Address",
    message: "How can we help?",
  },
};
