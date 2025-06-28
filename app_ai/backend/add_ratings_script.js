// One-time script to add ratings to existing hospital data
// This is what I actually ran to update your existing data

const { db } = require('./services/firebase-config');

// Generate realistic rating distribution based on average rating and review count
function generateRatingDistribution(averageRating, totalReviews) {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  
  if (averageRating >= 4.5) {
    distribution[5] = Math.floor(totalReviews * 0.7);
    distribution[4] = Math.floor(totalReviews * 0.25);
    distribution[3] = Math.floor(totalReviews * 0.04);
    distribution[2] = Math.floor(totalReviews * 0.01);
  } else if (averageRating >= 4.0) {
    distribution[5] = Math.floor(totalReviews * 0.5);
    distribution[4] = Math.floor(totalReviews * 0.35);
    distribution[3] = Math.floor(totalReviews * 0.12);
    distribution[2] = Math.floor(totalReviews * 0.02);
    distribution[1] = Math.floor(totalReviews * 0.01);
  } else if (averageRating >= 3.5) {
    distribution[4] = Math.floor(totalReviews * 0.3);
    distribution[3] = Math.floor(totalReviews * 0.4);
    distribution[5] = Math.floor(totalReviews * 0.15);
    distribution[2] = Math.floor(totalReviews * 0.1);
    distribution[1] = Math.floor(totalReviews * 0.05);
  }
  
  const currentTotal = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  const difference = totalReviews - currentTotal;
  
  if (difference > 0) {
    const targetRating = Math.round(averageRating);
    distribution[targetRating] += difference;
  }
  
  return distribution;
}

async function addRandomRatings() {
  try {
    console.log('Adding random ratings to existing hospitals...');
    
    // Get all hospitals
    const hospitalsSnapshot = await db.collection('hospitals').get();
    console.log('Processing', hospitalsSnapshot.size, 'hospitals');
    
    let processed = 0;
    const batchSize = 100;
    
    for (let i = 0; i < hospitalsSnapshot.docs.length; i += batchSize) {
      const batch = db.batch();
      const batchDocs = hospitalsSnapshot.docs.slice(i, i + batchSize);
      
      for (const doc of batchDocs) {
        const hospitalData = doc.data();
        
        // 🎲 Generate random rating between 3.5 and 4.8
        const randomRating = Math.round((3.5 + Math.random() * 1.3) * 10) / 10;
        
        // 💾 Update hospital with random rating
        batch.update(doc.ref, { hospitalRating: randomRating });
        
        // 📊 Create rating summary
        const randomReviewCount = Math.floor(5 + Math.random() * 20);
        const ratingDistribution = generateRatingDistribution(randomRating, randomReviewCount);
        
        const serviceRatingRef = db.collection('provider_ratings')
          .doc(`${hospitalData.hospitalId}_${hospitalData.service.description}`);
        const overallRatingRef = db.collection('provider_ratings')
          .doc(`${hospitalData.hospitalId}_overall`);
        
        const ratingData = {
          providerId: hospitalData.hospitalId,
          service: hospitalData.service.description,
          averageRating: randomRating,
          totalReviews: randomReviewCount,
          ratingDistribution,
          lastUpdated: new Date(),
          isInitial: true // 🏷️ Mark as initial random data
        };
        
        const overallRatingData = {
          ...ratingData,
          service: 'overall'
        };
        
        batch.set(serviceRatingRef, ratingData);
        batch.set(overallRatingRef, overallRatingData);
        
        processed++;
      }
      
      await batch.commit();
      console.log('Processed', Math.min(processed, hospitalsSnapshot.size), 'of', hospitalsSnapshot.size, 'hospitals');
    }
    
    console.log('✅ Successfully added random ratings to all hospitals!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the script
addRandomRatings();