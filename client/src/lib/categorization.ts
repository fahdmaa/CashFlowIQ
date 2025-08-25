// Simple keyword-based auto-categorization
const categoryKeywords = {
  "Food & Dining": [
    "restaurant", "food", "dining", "cafe", "coffee", "starbucks", "mcdonalds", "burger", 
    "pizza", "grocery", "supermarket", "walmart", "target", "whole foods", "kroger",
    "eat", "lunch", "dinner", "breakfast", "drink", "bar", "pub", "deli"
  ],
  "Transportation": [
    "gas", "fuel", "shell", "exxon", "bp", "chevron", "uber", "lyft", "taxi", "bus",
    "train", "subway", "metro", "parking", "toll", "car", "auto", "mechanic", "repair",
    "insurance", "registration", "dmv"
  ],
  "Entertainment": [
    "movie", "cinema", "theater", "netflix", "spotify", "hulu", "disney", "amazon prime",
    "game", "gaming", "xbox", "playstation", "steam", "concert", "music", "show",
    "park", "zoo", "museum", "entertainment", "fun", "hobby"
  ],
  "Shopping": [
    "amazon", "ebay", "clothing", "clothes", "shoes", "fashion", "electronics", "phone",
    "computer", "laptop", "shopping", "store", "mall", "outlet", "retail", "purchase",
    "buy", "order", "delivery", "merchandise"
  ],
  "Bills & Utilities": [
    "electric", "electricity", "water", "gas bill", "internet", "phone bill", "cable",
    "utilities", "rent", "mortgage", "insurance", "subscription", "membership", "fee",
    "service", "bank", "credit card", "loan", "payment"
  ],
  "Income": [
    "salary", "paycheck", "wages", "income", "deposit", "payment received", "refund",
    "bonus", "commission", "freelance", "consulting", "dividend", "interest"
  ]
};

export function categorizeTransaction(description: string): string {
  const lowerDescription = description.toLowerCase();
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (lowerDescription.includes(keyword)) {
        return category;
      }
    }
  }
  
  return "Shopping"; // default category
}
