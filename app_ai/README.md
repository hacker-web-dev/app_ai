# Healthcare Pricing Platform

## Overview

A comprehensive healthcare pricing comparison platform that helps patients find and compare medical services across different providers. The system integrates intelligent sentiment analysis for patient feedback and real-time pricing data to provide smart recommendations.

## 🏗️ Architecture Overview

### System Components
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express
- **Database**: Firebase Firestore
- **Analytics Services**: Hugging Face (Sentiment Analysis)
- **External APIs**: Google Maps Geocoding
- **Data Sources**: CSV-based hospital data via FTP

---

## 📋 Non-Functional Requirements (NFR)

### 1. Performance Requirements

#### Response Time
- **Page Load Time**: ≤ 2 seconds for all pages
- **Search Results**: ≤ 3 seconds for provider search
- **Feedback Submission**: ≤ 1 second response time
- **API Response**: ≤ 500ms for individual API calls

#### Throughput
- **Concurrent Users**: Support 1000+ simultaneous users
- **Search Queries**: Handle 100+ searches per second
- **Database Operations**: 500+ reads/writes per second

#### Resource Utilization
- **CPU Usage**: ≤ 70% under normal load
- **Memory Usage**: ≤ 4GB per server instance
- **Database Connections**: ≤ 100 concurrent connections

### 2. Availability Requirements

#### Uptime
- **Target Availability**: 99.99% uptime (≤ 52.6 minutes downtime/year)
- **Planned Maintenance**: ≤ 2 hours/month during off-peak hours
- **Recovery Time**: ≤ 5 minutes for service restoration

#### Disaster Recovery
- **Data Backup**: Real-time replication with Firebase
- **Geographic Redundancy**: Multi-region deployment
- **Failover Time**: ≤ 30 seconds automatic failover

### 3. Scalability Requirements

#### Horizontal Scaling
- **Auto-scaling**: Automatic instance scaling based on load
- **Load Balancing**: Distribute traffic across multiple instances
- **Database Scaling**: Automatic Firestore scaling

#### Vertical Scaling
- **Resource Allocation**: Dynamic CPU/memory allocation
- **Storage Scaling**: Unlimited Firestore storage capacity

#### Growth Projections
- **User Growth**: Support 10x user growth (10,000+ users)
- **Data Growth**: Handle 100x data increase
- **Geographic Expansion**: Multi-region deployment ready

### 4. Security Requirements

#### Authentication & Authorization
- **User Authentication**: Firebase Authentication
- **API Security**: JWT token-based authentication
- **Role-Based Access**: User/Admin role separation

#### Data Protection
- **Data Encryption**: TLS 1.3 for data in transit
- **Database Security**: Firebase security rules
- **API Rate Limiting**: Prevent abuse and DDoS

### 5. Usability Requirements

#### User Experience
- **Mobile Responsive**: Support all device sizes
- **Cross-browser**: Chrome, Firefox, Safari, Edge support
- **Accessibility**: WCAG 2.1 AA compliance

#### Interface Requirements
- **Loading Indicators**: Visual feedback for all operations
- **Error Handling**: User-friendly error messages
- **Offline Support**: Basic offline functionality

---

## 🏛️ Layered Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│  React Frontend (Port 5173)                                    │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐    │
│  │   Landing Page  │ │   Search Page   │ │   Auth Pages    │    │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘    │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐    │
│  │ Hospital Table  │ │ Feedback Modal  │ │ Comparison View │    │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                               │ HTTPS/REST API
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API GATEWAY LAYER                      │
├─────────────────────────────────────────────────────────────────┤
│  Load Balancer + Rate Limiting + Authentication                │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐    │
│  │  Rate Limiter   │ │   CORS Policy   │ │  Auth Middleware│    │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       APPLICATION LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│  Node.js + Express Backend (Port 3000)                         │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐    │
│  │  Search Service │ │ Feedback Service│ │  Rating Service │    │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘    │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐    │
│  │ Geocoding Svc   │ │ Sentiment AI    │ │   FTP Service   │    │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       BUSINESS LOGIC LAYER                     │
├─────────────────────────────────────────────────────────────────┤
│  Core Business Rules & Processing                              │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐    │
│  │ Provider Search │ │ Price Comparison│ │ Rating Calc     │    │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘    │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐    │
│  │ Distance Calc   │ │ Sentiment Proc  │ │ Data Validation │    │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATA ACCESS LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│  Database Abstraction & External API Integration               │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐    │
│  │ Firebase SDK    │ │ Firestore ORM   │ │  Cache Manager  │    │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘    │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐    │
│  │  Google Maps    │ │ Hugging Face    │ │   FTP Client    │    │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       PERSISTENCE LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│  Data Storage & External Services                              │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐    │
│  │ Firebase Auth   │ │ Firestore DB    │ │  File Storage   │    │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘    │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐    │
│  │ External APIs   │ │   FTP Server    │ │   CDN Assets    │    │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          INTERNET                              │
│                     (User Requests)                            │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CDN / EDGE LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐    │
│  │   Cloudflare    │ │    Static CDN   │ │   SSL/TLS Cert  │    │
│  │   (DNS + DDoS)  │ │   (CSS/JS/IMG)  │ │   (Let's Encrypt│    │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘    │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     LOAD BALANCER                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐    │
│  │   HAProxy       │ │  Health Checks  │ │   Auto-scaling  │    │
│  │   (Round Robin) │ │   (Heartbeat)   │ │   (CPU/Memory)  │    │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘    │
└─────────────┬─────────────────┬─────────────────┬───────────────┘
              │                 │                 │
              ▼                 ▼                 ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  FRONTEND TIER  │ │  FRONTEND TIER  │ │  FRONTEND TIER  │
├─────────────────┤ ├─────────────────┤ ├─────────────────┤
│  React App      │ │  React App      │ │  React App      │
│  (Nginx Server) │ │  (Nginx Server) │ │  (Nginx Server) │
│  Port: 80/443   │ │  Port: 80/443   │ │  Port: 80/443   │
│  CPU: 2 cores   │ │  CPU: 2 cores   │ │  CPU: 2 cores   │
│  RAM: 2GB       │ │  RAM: 2GB       │ │  RAM: 2GB       │
└─────────────────┘ └─────────────────┘ └─────────────────┘
          │                   │                   │
          └─────────────┬─────────────────────────┘
                        │ API Calls
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API GATEWAY                                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐    │
│  │  Rate Limiting  │ │  Authentication │ │   API Routing   │    │
│  │  (1000 req/min) │ │   (JWT Tokens)  │ │  (Path-based)   │    │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘    │
└─────────────┬─────────────────┬─────────────────┬───────────────┘
              │                 │                 │
              ▼                 ▼                 ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  BACKEND TIER   │ │  BACKEND TIER   │ │  BACKEND TIER   │
├─────────────────┤ ├─────────────────┤ ├─────────────────┤
│  Node.js Express│ │  Node.js Express│ │  Node.js Express│
│  Port: 3000     │ │  Port: 3000     │ │  Port: 3000     │
│  CPU: 4 cores   │ │  CPU: 4 cores   │ │  CPU: 4 cores   │
│  RAM: 4GB       │ │  RAM: 4GB       │ │  RAM: 4GB       │
│  ┌─────────────┐ │ │  ┌─────────────┐ │ │  ┌─────────────┐ │
│  │   Services  │ │ │  │   Services  │ │ │  │   Services  │ │
│  │ - Search    │ │ │  │ - Search    │ │ │  │ - Search    │ │
│  │ - Feedback  │ │ │  │ - Feedback  │ │ │  │ - Feedback  │ │
│  │ - Rating    │ │ │  │ - Rating    │ │ │  │ - Rating    │ │
│  │ - Geocoding │ │ │  │ - Geocoding │ │ │  │ - Geocoding │ │
│  └─────────────┘ │ │  └─────────────┘ │ │  └─────────────┘ │
└─────────────────┘ └─────────────────┘ └─────────────────┘
          │                   │                   │
          └─────────────┬─────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐    │
│  │ Firebase/Google │ │  Hugging Face   │ │   FTP Server    │    │
│  │ ┌─────────────┐ │ │  ┌─────────────┐ │ │  ┌─────────────┐ │    │
│  │ │ Firestore   │ │ │  │ Sentiment   │ │ │  │ Hospital    │ │    │
│  │ │ Database    │ │ │  │ Analysis AI │ │ │  │ Data CSV    │ │    │
│  │ └─────────────┘ │ │  └─────────────┘ │ │  └─────────────┘ │    │
│  │ ┌─────────────┐ │ │  ┌─────────────┐ │ │  ┌─────────────┐ │    │
│  │ │ Firebase    │ │ │  │ RoBERTa     │ │ │  │ Scheduled   │ │    │
│  │ │ Auth        │ │ │  │ Model       │ │ │  │ Sync (2nd)  │ │    │
│  │ └─────────────┘ │ │  └─────────────┘ │ │  └─────────────┘ │    │
│  │ ┌─────────────┐ │ │                 │ │                 │    │
│  │ │ Google Maps │ │ │                 │ │                 │    │
│  │ │ Geocoding   │ │ │                 │ │                 │    │
│  │ └─────────────┘ │ │                 │ │                 │    │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema

### Firestore Collections

#### 1. hospitals
```json
{
  "hospitalId": "string",
  "hospitalName": "string", 
  "hospitalType": "string",
  "hospitalRating": "number",
  "address": {
    "street": "string",
    "city": "string", 
    "state": "string",
    "postalCode": "string"
  },
  "location": {
    "latitude": "number",
    "longitude": "number"
  },
  "contact": {
    "phone": "string",
    "email": "string",
    "website": "string"
  },
  "acceptedInsurance": ["string"],
  "service": {
    "description": "string",
    "code": "string", 
    "setting": "string"
  },
  "pricing": {
    "standardCharge": "number",
    "insurance": "string",
    "planName": "string", 
    "negotiatedAmount": "number",
    "comments": "string"
  }
}
```

#### 2. provider_feedback  
```json
{
  "providerId": "string",
  "service": "string",
  "rating": "number",
  "finalRating": "number", 
  "adjustedRating": "number",
  "review": "string",
  "userId": "string",
  "sentimentAnalysis": {
    "score": "number",
    "classification": "string", 
    "confidence": "number",
    "ratingAdjustment": "number"
  },
  "isRatingGenerated": "boolean",
  "timestamp": "timestamp",
  "createdAt": "string"
}
```

#### 3. provider_ratings
```json
{
  "providerId": "string", 
  "service": "string",
  "averageRating": "number",
  "totalReviews": "number",
  "ratingDistribution": {
    "1": "number",
    "2": "number", 
    "3": "number",
    "4": "number",
    "5": "number"
  },
  "lastUpdated": "timestamp",
  "isInitial": "boolean"
}
```

---

## 🔄 API Endpoints

### Core Endpoints

#### Search & Discovery
- `GET /api/providers/nearby` - Find providers by location
- `GET /api/providers/compare` - Compare multiple providers  
- `GET /api/recommendations` - Get smart recommendations
- `GET /api/services` - Search available services
- `GET /geocode/:postalCode` - Get coordinates

#### Feedback & Ratings  
- `POST /api/feedback` - Submit provider feedback
- `GET /api/providers/:id/ratings` - Get provider ratings
- `GET /api/providers/:id/reviews` - Get provider reviews
- `GET /api/providers/:id/sentiment` - Get sentiment stats

#### Data Management
- `POST /sync-ftp-data` - Sync hospital data from FTP
- `POST /admin/reprocess-sentiment` - Reprocess sentiment analysis

### API Rate Limits
- **Public Endpoints**: 100 requests/minute per IP
- **Authenticated Endpoints**: 1000 requests/minute per user
- **Admin Endpoints**: 10 requests/minute per admin

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18.3.1 + TypeScript
- **Build Tool**: Vite 5.4.2  
- **Styling**: Tailwind CSS 3.4.1
- **Icons**: Lucide React 0.344.0
- **HTTP Client**: Axios 1.8.4
- **Routing**: React Router DOM 7.4.1

### Backend  
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Analytics Service**: Hugging Face Transformers
- **File Processing**: CSV Parser
- **FTP Client**: basic-ftp

### DevOps & Deployment
- **Containerization**: Docker
- **Orchestration**: Kubernetes  
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Logging**: Winston + ELK Stack

---

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm 9+
- Firebase account
- Hugging Face API key
- Google Maps API key

### Frontend Setup
```bash
cd frontend/project
npm install
npm run dev
```

### Backend Setup  
```bash
cd backend/services
npm install
# Configure environment variables
cp .env.example .env
# Edit .env with your API keys
node server.js
```

### Environment Variables
```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# API Keys
GOOGLE_MAPS_API_KEY=your_google_maps_key
HUGGING_FACE_API_KEY=your_hf_api_key

# FTP Configuration  
FTP_HOST=your_ftp_host
FTP_USER=your_ftp_user
FTP_PASSWORD=your_ftp_password

# Server Configuration
PORT=3000
NODE_ENV=production
```

---

## 📈 Performance Monitoring

### Key Metrics
- **Response Time**: Average API response time
- **Throughput**: Requests per second
- **Error Rate**: 4xx/5xx error percentage  
- **User Sessions**: Active user count
- **Database Performance**: Query execution time

### Monitoring Tools
- **Application**: New Relic / DataDog
- **Infrastructure**: Prometheus + Grafana
- **Logs**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Uptime**: Pingdom / UptimeRobot

### Alerts & Thresholds
- **Response Time**: > 2 seconds
- **Error Rate**: > 1%
- **CPU Usage**: > 80%
- **Memory Usage**: > 90%
- **Disk Space**: > 85%

---

## 🔐 Security Implementation

### Authentication Flow
1. User registers/logs in via Firebase Auth
2. Frontend receives JWT token
3. Token included in API requests
4. Backend validates token with Firebase

### Data Protection
- **HTTPS**: All communications encrypted
- **CORS**: Restricted origins
- **Input Validation**: All user inputs sanitized
- **SQL Injection**: N/A (NoSQL Firestore)
- **XSS Protection**: React built-in protection

### Rate Limiting
```javascript
// Express rate limiting middleware
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
```

---

## 🧪 Testing Strategy

### Frontend Testing
- **Unit Tests**: React Testing Library + Jest
- **Integration Tests**: Cypress E2E testing
- **Performance Tests**: Lighthouse CI
- **Accessibility Tests**: axe-core

### Backend Testing
- **Unit Tests**: Mocha + Chai
- **API Tests**: Supertest
- **Load Tests**: Artillery / K6
- **Security Tests**: OWASP ZAP

### Test Coverage Goals
- **Unit Tests**: > 80% coverage
- **Integration Tests**: Critical user journeys
- **Performance Tests**: All major endpoints
- **Security Tests**: OWASP Top 10

---

## 📋 Deployment Checklist

### Pre-Production
- [ ] Environment variables configured
- [ ] Database migrations completed
- [ ] SSL certificates installed
- [ ] Monitoring tools configured
- [ ] Backup procedures tested
- [ ] Load testing completed
- [ ] Security audit passed

### Production Deployment
- [ ] Blue-green deployment strategy
- [ ] Health checks configured
- [ ] Auto-scaling policies set
- [ ] CDN cache configured
- [ ] Error tracking enabled
- [ ] Performance monitoring active

### Post-Deployment
- [ ] Smoke tests passed
- [ ] Metrics dashboards verified
- [ ] Alert notifications working
- [ ] Backup verification
- [ ] Performance baseline established

---

## 🆘 Troubleshooting Guide

### Common Issues

#### High Response Times
1. Check database query performance
2. Verify CDN cache hit ratio
3. Monitor CPU/memory usage
4. Review API rate limits

#### Authentication Errors
1. Verify Firebase configuration
2. Check JWT token expiration
3. Confirm API key validity
4. Review CORS settings

#### Database Connection Issues
1. Check Firestore service status
2. Verify connection limits
3. Review security rules
4. Monitor quota usage

### Emergency Procedures
1. **Service Outage**: Activate disaster recovery plan
2. **Data Breach**: Follow incident response protocol
3. **Performance Issues**: Scale resources automatically
4. **Security Alert**: Block suspicious traffic

---

## 📞 Support & Maintenance

### Support Contacts
- **Technical Lead**: [Your Name]
- **DevOps Team**: [Team Email]
- **Security Team**: [Security Email]

### Maintenance Schedule
- **Regular Updates**: Weekly security patches
- **Feature Releases**: Monthly deployments
- **Database Maintenance**: Monthly during off-peak
- **Security Audits**: Quarterly reviews

### Documentation Updates
- **API Documentation**: Swagger/OpenAPI specs
- **Architecture Updates**: Quarterly reviews
- **Runbooks**: Updated with each release
- **Incident Reports**: Post-mortem documentation

---

## 📊 Cost Analysis

### Infrastructure Costs (Monthly)
- **Frontend Hosting**: $50-100 (CDN + Static hosting)
- **Backend Servers**: $200-500 (3x instances)
- **Database**: $100-300 (Firebase Firestore)
- **External APIs**: $50-200 (Google Maps + Hugging Face)
- **Monitoring**: $50-100 (APM tools)
- **Total**: $450-1,200/month

### Scaling Projections
- **1,000 users**: Current infrastructure sufficient
- **10,000 users**: Add 2-3 backend instances (+$300)
- **100,000 users**: Multi-region deployment (+$2,000)

---

This comprehensive documentation covers all technical aspects, architecture decisions, and operational requirements for the Healthcare Pricing platform. The system is designed to be scalable, maintainable, and robust while meeting all specified non-functional requirements.