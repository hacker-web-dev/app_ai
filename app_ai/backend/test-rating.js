const sentimentService = require('./services/sentimentAnalysisService');

async function testRating() {
  console.log('Testing AI-based rating system...\n');
  
  const testComments = [
    "I like it's good",
    "good but I will never visit",
    "amazing care and professional staff",
    "worst experience ever, terrible service",
    "the service was okay, nothing special",
    "absolutely fantastic! highly recommend",
    "oh great, another long wait",
    "super nice doctor, very caring",
    "avoid this place at all costs",
    "excellent treatment, saved my life"
  ];

  for (const comment of testComments) {
    try {
      const rating = await sentimentService.commentToStarRating(comment);
      console.log(`Comment: "${comment}"`);
      console.log(`AI Rating: ${rating}/5`);
      console.log('---');
    } catch (error) {
      console.error(`Error processing "${comment}":`, error.message);
      console.log('---');
    }
  }
}

testRating().catch(console.error);