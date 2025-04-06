// file-import.service.js (partial update)
const ftp = require('basic-ftp');
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const { v4: uuidv4 } = require('uuid');
const { admin, db } = require('./firebase-config');

// Remove any other Firebase initialization code
// The rest of the file remains the same...

class FileImportService {
  constructor() {
    this.client = new ftp.Client();
    this.client.ftp.verbose = false; // Set to true for debugging
    this.tempDir = path.join(__dirname, 'temp');
  }

  async connect(config) {
    try {
      await this.client.access({
        host: config.host,
        port: config.port || 21,
        user: config.user,
        password: config.password,
        secure: config.secure !== undefined ? config.secure : false
      });
      console.log('Connected to FTP server');
      return true;
    } catch (error) {
      console.error('Failed to connect to FTP server:', error);
      throw error;
    }
  }

  async listFiles(directory = '/') {
    try {
      const fileList = await this.client.list(directory);
      return fileList;
    } catch (error) {
      console.error('Failed to list files:', error);
      throw error;
    }
  }

  async downloadFile(remotePath, fileName) {
    // Ensure temp directory exists
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }

    const localPath = path.join(this.tempDir, fileName);
    
    try {
      await this.client.downloadTo(localPath, remotePath);
      console.log(`Downloaded ${fileName}`);
      return localPath;
    } catch (error) {
      console.error(`Failed to download ${fileName}:`, error);
      throw error;
    }
  }

  async processCSVFile(filePath) {
    return new Promise((resolve, reject) => {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      Papa.parse(fileContent, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          console.log(`Processed ${results.data.length} rows from CSV`);
          resolve(results.data);
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          reject(error);
        }
      });
    });
  }

  async storeDataInFirestore(fileName, data) {
    // Determine which collection to use based on file name
    let collectionName;
    
    if (fileName.includes('providers')) {
      collectionName = 'providers';
    } else if (fileName.includes('postal_codes')) {
      collectionName = 'postal_codes';
    } else if (fileName.includes('hospital')) {
      collectionName = 'hospital_prices';
    } else {
      // Use a generic name for other files
      collectionName = 'imported_data';
    }
    
    console.log(`Storing data in Firestore collection: ${collectionName}`);
    
    // Create batches (Firestore has a limit of 500 operations per batch)
    const batches = [];
    let currentBatch = db.batch();
    let operationCount = 0;
    const MAX_OPERATIONS = 450; // Less than 500 to be safe
    
    // Process the data differently based on the collection
    if (collectionName === 'providers') {
      // Store provider data
      for (const item of data) {
        if (operationCount >= MAX_OPERATIONS) {
          batches.push(currentBatch);
          currentBatch = db.batch();
          operationCount = 0;
        }
        
        // Create a document ID from the hospital ID if available
        const docId = item['Hospital ID'] || uuidv4();
        const docRef = db.collection(collectionName).doc(docId);
        
        // Format the data for providers
        const providerData = {
          id: item['Hospital ID'] || docId,
          name: item['Hospital Name'],
          type: item['Hospital Type'],
          address: {
            street: item['Street'],
            city: item['City'],
            state: item['State'],
            postalCode: item['Postal Code']
          },
          location: {
            // GeoPoint for Firestore spatial queries
            coordinates: [parseFloat(item['Longitude']), parseFloat(item['Latitude'])],
            geopoint: new admin.firestore.GeoPoint(
              parseFloat(item['Latitude']), 
              parseFloat(item['Longitude'])
            )
          },
          contact: {
            phone: item['Phone'],
            email: item['Email'],
            website: item['Website']
          },
          acceptedInsurance: item['Accepted Insurance'].split(',').map(ins => ins.trim()),
          importedAt: admin.firestore.FieldValue.serverTimestamp(),
          sourceFile: fileName
        };
        
        currentBatch.set(docRef, providerData);
        operationCount++;
      }
    } else if (collectionName === 'postal_codes') {
      // Store postal code data
      for (const item of data) {
        if (operationCount >= MAX_OPERATIONS) {
          batches.push(currentBatch);
          currentBatch = db.batch();
          operationCount = 0;
        }
        
        // Create a document ID from the postal code
        const docId = item['Postal Code'].toString();
        const docRef = db.collection(collectionName).doc(docId);
        
        // Format the data for postal codes
        const postalData = {
          code: item['Postal Code'].toString(),
          city: item['City'],
          state: item['State'],
          location: {
            // GeoPoint for Firestore spatial queries
            coordinates: [parseFloat(item['Longitude']), parseFloat(item['Latitude'])],
            geopoint: new admin.firestore.GeoPoint(
              parseFloat(item['Latitude']), 
              parseFloat(item['Longitude'])
            )
          },
          importedAt: admin.firestore.FieldValue.serverTimestamp(),
          sourceFile: fileName
        };
        
        currentBatch.set(docRef, postalData);
        operationCount++;
      }
    } else {
      // Store hospital price data
      for (const item of data) {
        if (operationCount >= MAX_OPERATIONS) {
          batches.push(currentBatch);
          currentBatch = db.batch();
          operationCount = 0;
        }
        
        const docRef = db.collection(collectionName).doc(uuidv4());
        
        // Format the data for hospital prices
        const priceData = {
          serviceDescription: item['Service Description'],
          serviceCode: item['Service Code'],
          setting: item['Setting'],
          standardCharge: parseFloat(item['Standard Charge'] || 0),
          hospitalId: item['Hospital ID'],
          hospitalName: item['Hospital Name'],
          postalCode: item['Postal Code'].toString(),
          location: {
            city: item['City'],
            state: item['State'],
            coordinates: [parseFloat(item['Longitude']), parseFloat(item['Latitude'])],
            geopoint: new admin.firestore.GeoPoint(
              parseFloat(item['Latitude']), 
              parseFloat(item['Longitude'])
            )
          },
          importedAt: admin.firestore.FieldValue.serverTimestamp(),
          sourceFile: fileName
        };
        
        // Add insurance data if present
        if (item['Insurance'] && item['Plan Name']) {
          priceData.insurance = item['Insurance'];
          priceData.planName = item['Plan Name'];
          priceData.negotiatedAmount = parseFloat(item['Negotiated Amount'] || 0);
        }
        
        currentBatch.set(docRef, priceData);
        operationCount++;
      }
    }
    
    // Add the last batch
    batches.push(currentBatch);
    
    // Commit all batches
    console.log(`Committing ${batches.length} batches to Firestore`);
    for (let i = 0; i < batches.length; i++) {
      try {
        await batches[i].commit();
        console.log(`Committed batch ${i+1}/${batches.length}`);
      } catch (error) {
        console.error(`Failed to commit batch ${i+1}/${batches.length}:`, error);
        throw error;
      }
    }
    
    console.log(`Successfully stored ${data.length} records from ${fileName}`);
    
    // Create a log entry
    await db.collection('file_imports').add({
      fileName: fileName,
      collectionName: collectionName,
      recordCount: data.length,
      importedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return {
      success: true,
      recordCount: data.length,
      collectionName: collectionName
    };
  }
  
  async cleanupTempFiles() {
    if (fs.existsSync(this.tempDir)) {
      fs.readdirSync(this.tempDir).forEach(file => {
        fs.unlinkSync(path.join(this.tempDir, file));
      });
      console.log('Cleaned up temporary files');
    }
  }
  
  async disconnect() {
    await this.client.close();
    console.log('Disconnected from FTP server');
  }
  
  async importAllFiles(config) {
    try {
      // Connect to FTP
      await this.connect(config);
      
      // List files
      const files = await this.listFiles(config.directory || '/');
      const csvFiles = files.filter(file => file.name.endsWith('.csv'));
      
      console.log(`Found ${csvFiles.length} CSV files to process`);
      
      const results = [];
      
      // Process all CSV files
      for (const file of csvFiles) {
        // Download file
        const localPath = await this.downloadFile(file.name, file.name);
        
        // Process CSV
        const data = await this.processCSVFile(localPath);
        
        // Store in Firebase
        const result = await this.storeDataInFirestore(file.name, data);
        
        results.push({
          fileName: file.name,
          recordCount: data.length,
          collectionName: result.collectionName
        });
      }
      
      // Cleanup
      await this.cleanupTempFiles();
      await this.disconnect();
      
      return {
        success: true,
        filesProcessed: csvFiles.length,
        results
      };
    } catch (error) {
      console.error('Import process failed:', error);
      
      // Attempt cleanup
      try {
        await this.cleanupTempFiles();
        await this.disconnect();
      } catch (cleanupError) {
        console.error('Cleanup failed:', cleanupError);
      }
      
      throw error;
    }
  }
}

module.exports = new FileImportService();