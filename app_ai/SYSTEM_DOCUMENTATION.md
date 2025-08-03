# 🏥 Healthcare Price Comparison System - Complete Guide

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [FTP Data Management](#ftp-data-management)
3. [Data Processing & Storage](#data-processing--storage)
4. [Feedback & Rating System](#feedback--rating-system)
5. [Data Retrieval & API](#data-retrieval--api)
6. [Complete Workflow Examples](#complete-workflow-examples)
7. [Architecture Diagrams](#architecture-diagrams)

---

## 🎯 System Overview

This healthcare price comparison system helps users find and compare medical service prices across different hospitals and insurance plans. The system consists of:

- **FTP Server**: Local data server for CSV files
- **Data Generator**: Creates sample hospital data
- **Firebase**: Cloud database for storing processed data
- **API Server**: Backend services for data processing
- **Frontend**: User interface for searching and comparing

### 🔄 High-Level Data Flow

```
CSV Files → FTP Server → Backend Processing → Firebase → Frontend Display
    ↓           ↓              ↓               ↓           ↓
Hospital    File Import    Data Processing   Storage    User Interface
  Data      Service       & Validation      Layer      & Search
```

---

## 📁 FTP Data Management

### 🖥️ FTP Server Setup

The FTP server (`backend/services/ftp_server.py:13-49`) serves hospital data files locally:

| **Component** | **Details** |
|---------------|-------------|
| **Host** | 127.0.0.1 (localhost) |
| **Port** | 21 |
| **Username** | user |
| **Password** | password |
| **Directory** | `hospital_files/` |
| **Permissions** | Read/Write (elradfmw) |

### 🚀 Starting the FTP Server

**Automated Setup** (`backend/services/ftp_bat.bat:1-23`):
```batch
@echo off
echo Setting up PriceAI local FTP server...

# Install dependencies
pip install pyftpdlib

# Generate sample data
python files_generating_code.py

# Start FTP server
start cmd /k python ftp_server.py
```

**Manual Steps**:
1. Navigate to `backend/services/`
2. Run `python files_generating_code.py` to generate sample data
3. Run `python ftp_server.py` to start the server

### 📊 Sample Data Generation

The data generator (`backend/services/files_generating_code.py:75-203`) creates:

| **Data Type** | **Count** | **Details** |
|---------------|-----------|-------------|
| **Hospitals** | 5 | General Hospital, Medical Center, etc. |
| **Services** | 10 | MRI, X-Ray, Blood Tests, etc. |
| **Insurance Plans** | 15 | Aetna, Humana, United Healthcare |
| **Price Records** | ~375 | Combinations of hospitals × services × insurance |

**Sample Generated Data Structure**:
```csv
Hospital ID,Hospital Name,Service Description,Standard Charge,Insurance,Negotiated Amount
hospital1,General Hospital,CHG MRI BRAIN,1250.00,Aetna,987.50
hospital2,Medical Center,CHEST X-RAY,180.00,Humana,156.00
```

---

## 🔄 Data Processing & Storage

### 📥 File Import Process

The import service (`backend/services/file-import.service.js:283-329`) handles:

1. **FTP Connection** (`file-import.service.js:16-31`)
2. **File Download** (`file-import.service.js:43-59`)
3. **CSV Processing** (`file-import.service.js:61-79`)
4. **Firebase Storage** (`file-import.service.js:81-267`)

### 🗄️ Database Schema

The system stores data in Firebase collections:

#### 🏥 **Providers Collection**
```javascript
{
  id: "hospital1",
  name: "General Hospital",
  type: "Hospital",
  address: {
    street: "123 Main St",
    city: "Philadelphia", 
    state: "PA",
    postalCode: "19103"
  },
  location: {
    coordinates: [-75.1652, 39.9526],
    geopoint: GeoPoint(39.9526, -75.1652)
  },
  contact: {
    phone: "(555) 123-4567",
    email: "info@hospital1.com",
    website: "https://www.hospital1.com"
  },
  acceptedInsurance: ["Aetna", "Humana", "United Healthcare"]
}
```

#### 💰 **Hospital Prices Collection**
```javascript
{
  id: "uuid-123",
  serviceDescription: "CHG MRI BRAIN",
  serviceCode: "70551",
  setting: "OUTPATIENT",
  standardCharge: 1250.00,
  hospitalId: "hospital1",
  hospitalName: "General Hospital",
  insurance: "Aetna",
  planName: "Aetna Commercial",
  negotiatedAmount: 987.50,
  savings: 262.50,
  savingsPercentage: 21.0,
  location: {
    city: "Philadelphia",
    state: "PA",
    geopoint: GeoPoint(39.9526, -75.1652)
  }
}
```

#### 🏷️ **Services Collection**
```javascript
{
  code: "70551",
  description: "CHG MRI BRAIN",
  settings: ["OUTPATIENT"]
}
```

---

## ⭐ Feedback & Rating System

### 🗄️ **Database Structure - Where Ratings Live**

**Important:** We have **1 Firebase database** with **multiple collections**. Ratings get stored in **3 different places** to keep everything fast and organized:

```
Firebase Database (Single Database)
├── providers (hospital basic info)
├── hospital_prices (service costs from FTP)
├── provider_feedback (individual user reviews) ⭐
├── provider_ratings (calculated averages) ⭐  
├── hospitals (main hospital records with ratings) ⭐
└── services (medical procedures)
```

### 📍 **The 3 Places Where Ratings Are Stored:**

#### 1️⃣ **provider_feedback** - Individual Reviews
```javascript
// Every single user review gets stored here
{
  id: "review_123",
  providerId: "hospital1", 
  rating: 4,
  review: "Staff was friendly, quick service",
  userId: "user456",
  timestamp: "2024-01-15"
}
```

#### 2️⃣ **provider_ratings** - Calculated Summaries  
```javascript
// System calculates averages from all individual reviews
{
  providerId: "hospital1",
  averageRating: 4.2,        // Average of ALL user reviews
  totalReviews: 8,           // Count of real user reviews
  ratingDistribution: {      // How many of each star rating
    1: 0, 2: 1, 3: 2, 4: 3, 5: 2
  },
  isInitial: false           // Real user data (not fake)
}
```

#### 3️⃣ **hospitals** - Main Hospital Records
```javascript
// Hospital info WITH the current rating
{
  hospitalId: "hospital1",
  name: "General Hospital", 
  address: "123 Main St",
  hospitalRating: 4.2,       // SAME as provider_ratings average
  // ... other hospital details
}
```

### 🔄 **What Happens When User Submits a Rating**

Let's say a user rates "General Hospital" with **3 stars**:

```javascript
// User action
submitFeedback({
  providerId: "hospital1",
  rating: 3,
  review: "Long wait time but good treatment"
});
```

**The system updates ALL 3 places automatically:**

| Step | Collection | What Happens |
|------|------------|--------------|
| 1️⃣ | **provider_feedback** | ✅ Adds new review record |
| 2️⃣ | **provider_ratings** | ✅ Recalculates average: 4.2 → 3.9 |
| 3️⃣ | **hospitals** | ✅ Updates hospitalRating: 4.2 → 3.9 |

### 🤔 **Why Store in 3 Places?**

- **provider_feedback:** Keep individual reviews to show users "what others said"
- **provider_ratings:** Quick lookup for averages without calculating every time  
- **hospitals:** Fast search results without needing to join multiple tables

### 🔄 Complete Rating Workflow

The rating system (`backend/services/feedbackService.js`) processes user feedback through multiple stages:

#### 1️⃣ **Initial Ratings** (`backend/add_ratings_script.js:40-105`)

When the system starts, it generates initial ratings for all hospitals:

```javascript
// Random rating between 3.5 and 4.8
const randomRating = Math.round((3.5 + Math.random() * 1.3) * 10) / 10;

// Rating distribution based on average
const distribution = generateRatingDistribution(randomRating, totalReviews);

// Example result:
{
  providerId: "hospital1",
  service: "CHG MRI BRAIN", 
  averageRating: 4.2,
  totalReviews: 15,
  ratingDistribution: { 1: 0, 2: 1, 3: 2, 4: 7, 5: 5 },
  isInitial: true
}
```

#### 2️⃣ **User Feedback Submission** (`feedbackService.js:14-83`)

Users can submit feedback in three ways:

| **Input Type** | **Processing** | **Example** |
|----------------|----------------|-------------|
| **Rating Only** | Direct storage | User rates 4 stars → stored as 4.0 |
| **Review Only** | AI generates rating | "Terrible service" → AI gives 1.5 stars |
| **Both** | Sentiment adjusts rating | 5 stars + "awful" → adjusted to 3.2 stars |

**AI Rating Generation** (`sentimentAnalysisService.js:84-126`):
```javascript
const prompt = `Rate this healthcare review on 1-5 stars:
Comment: "The staff was incredibly rude and the wait time was 3 hours"
Consider: tone, sentiment, sarcasm, intensity
Respond with only a number (1-5):`;

// AI Response: 1.5
```

#### 3️⃣ **Real-Time Rating Updates** (`feedbackService.js:90-167`)

When feedback is submitted:

1. **Calculate new average** from all user reviews
2. **Replace initial ratings** with real user data
3. **Update hospital records** with new ratings
4. **Propagate changes** to search results

**Before User Feedback**:
```javascript
{
  averageRating: 4.2,  // Initial random rating
  totalReviews: 15,    // Simulated reviews  
  isInitial: true      // Marked as fake data
}
```

**After User Feedback**:
```javascript
{
  averageRating: 3.8,  // Real user average
  totalReviews: 3,     // Actual user reviews
  isInitial: false     // Marked as real data
}
```

### 📊 Rating Distribution Examples

**High-Rated Hospital (4.5+ stars)**:
| Stars | Count | Percentage |
|-------|-------|------------|
| 5⭐ | 14 | 70% |
| 4⭐ | 5 | 25% |
| 3⭐ | 1 | 4% |
| 2⭐ | 0 | 1% |
| 1⭐ | 0 | 0% |

**Average Hospital (3.5-4.0 stars)**:
| Stars | Count | Percentage |
|-------|-------|------------|
| 5⭐ | 3 | 15% |
| 4⭐ | 6 | 30% |
| 3⭐ | 8 | 40% |
| 2⭐ | 2 | 10% |
| 1⭐ | 1 | 5% |

---

## 🔍 Data Retrieval & API

### 🎯 Provider Search Process

The search system (`backend/services/providerSearch.js:72-161`) works in stages:

#### 1️⃣ **Location-Based Search**
```javascript
// User enters postal code
const userLocation = await geocodePostalCode("19103");
// Returns: { lat: 39.9526, lng: -75.1652 }

// Find nearby providers within 15km
const nearbyProviders = providers.filter(provider => {
  const distance = calculateDistance(userLocation, providerLocation);
  return distance <= 15;
});
```

#### 2️⃣ **Service Filtering**
```javascript
// If user specifies a service (e.g., "MRI")
const providersWithService = [];
for (const provider of nearbyProviders) {
  const hasService = await db.collection('hospital_prices')
    .where('hospitalId', '==', provider.id)
    .where('serviceCode', '==', '70551')
    .get();
  
  if (!hasService.empty) {
    providersWithService.push(provider);
  }
}
```

#### 3️⃣ **Rating Integration**
```javascript
// Add ratings to each provider
const ratings = await getMultipleProviderRatings(providerIds, serviceCode);
providers.forEach(provider => {
  const rating = ratings[provider.id];
  provider.rating = rating ? rating.averageRating : 0;
  provider.totalReviews = rating ? rating.totalReviews : 0;
});
```

### 💰 Price Comparison Process

**Getting Service Pricing** (`providerSearch.js:170-251`):

```javascript
const pricing = {
  available: true,
  provider: { id: "hospital1", name: "General Hospital" },
  service: "70551",
  standardCharge: { amount: 1250.00, setting: "OUTPATIENT" },
  insuranceOptions: [
    {
      insurance: "Aetna",
      plan: "Aetna Commercial", 
      negotiatedAmount: 987.50,
      savings: "262.50",
      savingsPercentage: "21.0"
    },
    {
      insurance: "Humana",
      plan: "Humana Medicare HMO",
      negotiatedAmount: 1100.00, 
      savings: "150.00",
      savingsPercentage: "12.0"
    }
  ]
};
```

### 🎯 Recommendation Engine

**Smart Recommendations** (`providerSearch.js:284-339`):

1. **Find nearby providers** offering the service
2. **Get pricing** for each provider
3. **Sort by price** (insurance first, then standard)
4. **Add quality ratings** for each provider
5. **Return top 5** recommendations

**Example Recommendation**:
```javascript
{
  provider: {
    id: "hospital2",
    name: "Medical Center", 
    distance: "2.1 km",
    rating: 4.3,
    totalReviews: 27
  },
  pricing: {
    standardCharge: { amount: 1150.00 },
    insuranceOptions: [
      {
        insurance: "Aetna",
        negotiatedAmount: 890.00,
        savings: "260.00"
      }
    ]
  }
}
```

---

## 🔄 Complete Workflow Examples

### 🚀 Example 1: Setting Up the System

**Step 1: Start FTP Server**
```bash
cd backend/services
python files_generating_code.py  # Generates sample data
python ftp_server.py            # Starts FTP server on localhost:21
```

**Step 2: Import Data**
```javascript
// Backend automatically imports on startup
const config = {
  host: '127.0.0.1',
  port: 21,
  user: 'user', 
  password: 'password',
  directory: '/',
  useConsolidated: true
};

await fileImportService.importAllFiles(config);
// Result: 375 records imported across 5 hospitals
```

**Step 3: Verify Data**
```javascript
// Check Firebase collections
const providers = await db.collection('providers').get();
console.log(`${providers.size} providers imported`);

const prices = await db.collection('hospital_prices').get(); 
console.log(`${prices.size} price records imported`);
```

### 🔍 Example 2: User Searching for MRI

**Step 1: User Input**
```javascript
const searchCriteria = {
  postalCode: "19103",
  serviceCode: "70551",        // MRI Brain
  insurance: "Aetna",
  maxDistance: 15              // km
};
```

**Step 2: System Processing**
```javascript
// 1. Geocode postal code
const userLocation = { lat: 39.9526, lng: -75.1652 };

// 2. Find nearby providers  
const nearbyProviders = [
  { id: "hospital1", name: "General Hospital", distance: 0.8 },
  { id: "hospital2", name: "Medical Center", distance: 2.1 },
  { id: "hospital3", name: "Community Hospital", distance: 4.5 }
];

// 3. Filter by service availability
const providersWithMRI = [
  { id: "hospital1", distance: 0.8 },
  { id: "hospital3", distance: 4.5 }
];

// 4. Get pricing for each
const recommendations = [
  {
    provider: { id: "hospital1", name: "General Hospital", distance: "0.8 km" },
    pricing: {
      standardCharge: 1250.00,
      insuranceOptions: [{ insurance: "Aetna", negotiatedAmount: 987.50 }]
    }
  },
  {
    provider: { id: "hospital3", name: "Community Hospital", distance: "4.5 km" },
    pricing: {
      standardCharge: 1180.00,
      insuranceOptions: [{ insurance: "Aetna", negotiatedAmount: 920.00 }]
    }
  }
];
```

**Step 3: User Response**
```javascript
// User sees comparison table:
| Hospital | Distance | Standard Price | Aetna Price | Savings |
|----------|----------|----------------|-------------|---------|
| Community Hospital | 4.5 km | $1,180 | $920 | $260 (22%) |
| General Hospital | 0.8 km | $1,250 | $987.50 | $262.50 (21%) |
```

### ⭐ Example 3: User Submitting Feedback

**Step 1: User Experience**
```javascript
// User visits General Hospital for MRI
const experience = {
  providerId: "hospital1",
  service: "CHG MRI BRAIN",
  review: "The staff was very professional and the facility was clean. However, the wait time was longer than expected."
};
```

**Step 2: AI Processing**
```javascript
// AI analyzes the sentiment
const aiAnalysis = {
  generatedRating: 3.5,  // Mixed review = 3.5 stars
  sentiment: "neutral",
  confidence: 0.8
};
```

**Step 3: Database Updates (ALL 3 Collections)**

**Before User Feedback:**
```javascript
// provider_ratings collection:
{
  averageRating: 4.2,    // Initial random rating
  totalReviews: 15,      // Simulated count
  isInitial: true        // Fake data flag
}

// hospitals collection:
{
  hospitalId: "hospital1",
  name: "General Hospital",
  hospitalRating: 4.2    // Same as provider_ratings
}

// provider_feedback collection:
// (empty - no real user reviews yet)
```

**After User Feedback (System Updates ALL 3):**
```javascript
// 1️⃣ provider_feedback - NEW RECORD ADDED:
{
  id: "review_abc123",
  providerId: "hospital1",
  service: "CHG MRI BRAIN", 
  rating: 3.5,           // AI generated rating
  review: "The staff was professional...",
  userId: "user456",
  timestamp: "2024-01-15T10:30:00Z"
}

// 2️⃣ provider_ratings - RECALCULATED:
{
  averageRating: 3.5,    // Real user rating (only 1 review now)
  totalReviews: 1,       // Actual user count  
  isInitial: false       // Real data flag
}

// 3️⃣ hospitals - RATING UPDATED:
{
  hospitalId: "hospital1",
  name: "General Hospital",
  hospitalRating: 3.5    // Updated to match provider_ratings
}
```

**Result:** The new 3.5-star rating appears immediately in search results because the `hospitals` collection was updated!

### 🔄 Example 4: Real-Time Data Updates

**Multiple Users Submit Feedback**:

```javascript
// User 1: "Excellent service, very fast!" → AI gives 4.8 stars
// User 2: Rates 2 stars + "Poor communication" → Adjusted to 1.8 stars  
// User 3: Rates 4 stars + "Good overall experience" → Adjusted to 4.2 stars

// Final hospital rating calculation:
const finalRating = (4.8 + 1.8 + 4.2) / 3 = 3.6 stars;

// Updated in real-time across the system:
const hospitalRecord = {
  hospitalId: "hospital1",
  hospitalRating: 3.6,     // Updated in main hospitals collection
  lastUpdated: "2024-01-15T10:30:00Z"
};
```

---

## 📐 Architecture Diagrams

### 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Data Source   │    │  Processing     │    │    Storage      │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ CSV Files   │ │───▶│ │ FTP Server  │ │───▶│ │  Firebase   │ │
│ │ (Hospital   │ │    │ │ (localhost) │ │    │ │ (Cloud DB)  │ │
│ │  Data)      │ │    │ └─────────────┘ │    │ └─────────────┘ │
│ └─────────────┘ │    │        │        │    │        │        │
└─────────────────┘    │ ┌─────────────┐ │    │ ┌─────────────┐ │
                       │ │File Import  │ │    │ │Collections: │ │
                       │ │Service      │ │    │ │• providers  │ │
                       │ │(Node.js)    │ │    │ │• prices     │ │
                       │ └─────────────┘ │    │ │• ratings    │ │
                       └─────────────────┘    │ │• feedback   │ │
                                              │ └─────────────┘ │
                                              └─────────────────┘
                                                       │
                       ┌─────────────────┐    ┌─────────────────┐
                       │  Application    │    │   User Layer    │
                       │                 │    │                 │
                       │ ┌─────────────┐ │    │ ┌─────────────┐ │
                       │ │   API       │ │◀───│ │  Frontend   │ │
                       │ │ (Express)   │ │    │ │  (React)    │ │
                       │ └─────────────┘ │    │ └─────────────┘ │
                       │        │        │    │        │        │
                       │ ┌─────────────┐ │    │ ┌─────────────┐ │
                       │ │Search &     │ │    │ │User Actions:│ │
                       │ │Rating       │ │    │ │• Search     │ │
                       │ │Services     │ │    │ │• Compare    │ │
                       │ └─────────────┘ │    │ │• Rate       │ │
                       └─────────────────┘    │ └─────────────┘ │
                                              └─────────────────┘
```

### 🔄 Data Flow Diagram

```
┌─────────────┐    FTP Protocol    ┌─────────────┐    HTTP API    ┌─────────────┐
│   CSV Data  │ ──────────────────▶│  Backend    │ ─────────────▶ │  Frontend   │
│             │     Port 21        │  Services   │   Port 3000    │   React     │
└─────────────┘                    └─────────────┘                └─────────────┘
       │                                  │                              │
       ▼                                  ▼                              ▼
┌─────────────┐                    ┌─────────────┐                ┌─────────────┐
│ Hospital    │                    │  Firebase   │                │ User        │
│ • Providers │                    │  • Storage  │                │ • Search    │
│ • Services  │                    │  • Queries  │                │ • Compare   │
│ • Pricing   │                    │  • Updates  │                │ • Rate      │
│ • Insurance │                    │  • Real-time│                │ • Review    │
└─────────────┘                    └─────────────┘                └─────────────┘
```

### ⭐ Rating System Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Initial   │    │    User     │    │     AI      │    │   Final     │
│   Ratings   │    │  Feedback   │    │ Processing  │    │   Update    │
│             │    │             │    │             │    │             │
│ Random 3.5- │    │ Text Review │    │ Sentiment   │    │ New Average │
│ 4.8 stars   │───▶│ or Rating   │───▶│ Analysis    │───▶│ Calculation │
│ (Simulated) │    │ (Real User) │    │ & Rating    │    │ (Real Data) │
│             │    │             │    │ Generation  │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
 isInitial: true    User Input        AI Model         isInitial: false
 totalReviews: 15   "Good service"    Returns: 4.2     totalReviews: 1
 averageRating:4.2  OR rating: 5      Adjusted: 4.5    averageRating:4.2
```

---

## 🎯 Key Benefits for Beginners

### ✅ **Simple to Understand**
- Clear separation of concerns
- Each service has a specific purpose
- Easy to trace data flow from CSV to user

### ✅ **Real-Time Updates**
- Feedback immediately updates ratings
- Search results reflect latest data
- No caching delays

### ✅ **Flexible Rating System**
- Accepts ratings, reviews, or both
- AI generates ratings from text
- Handles sarcasm and sentiment

### ✅ **Scalable Architecture**
- Firebase handles millions of records
- API designed for high concurrency
- Modular services for easy maintenance

### ✅ **User-Friendly**
- Intuitive search interface
- Clear price comparisons
- Easy feedback submission

---

## 🚀 Quick Start Guide

1. **Install Dependencies**: `npm install` in backend and frontend
2. **Start FTP Server**: Run `backend/services/ftp_bat.bat`
3. **Start Backend**: `npm start` in backend directory
4. **Start Frontend**: `npm run dev` in frontend directory  
5. **Open Browser**: Navigate to `http://localhost:5173`
6. **Search**: Enter postal code "19103" and search for "MRI"
7. **Compare**: View hospitals, prices, and ratings
8. **Rate**: Submit feedback to see real-time updates

The system is now ready for healthcare price comparison with live ratings!