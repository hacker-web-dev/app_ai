// file-import.service.js (modified for consolidated CSV)
const ftp = require('basic-ftp');
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const { v4: uuidv4 } = require('uuid');
const { admin, db } = require('./firebase-config');

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

  async storeConsolidatedDataInFirestore(fileName, data) {
    console.log(`Processing consolidated hospital data file: ${fileName}`);
    
    // Create tracking maps for providers and services
    const providerMap = new Map();
    const serviceMap = new Map();
    
    // Create batches (Firestore has a limit of 500 operations per batch)
    const batches = [];
    let currentBatch = db.batch();
    let operationCount = 0;
    const MAX_OPERATIONS = 450; // Less than 500 to be safe
    
    // First pass: Extract unique providers
    console.log('Extracting unique providers from data...');
    for (const item of data) {
      const hospitalId = item['Hospital ID'];
      
      if (hospitalId && !providerMap.has(hospitalId)) {
        providerMap.set(hospitalId, {
          id: hospitalId,
          name: item['Hospital Name'],
          type: item['Hospital Type'],
          address: {
            street: item['Street'],
            city: item['City'],
            state: item['State'],
            postalCode: item['Postal Code']
          },
          location: {
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
          acceptedInsurance: item['Accepted Insurance'] ? 
            item['Accepted Insurance'].split(',').map(ins => ins.trim()) : [],
          importedAt: admin.firestore.FieldValue.serverTimestamp(),
          sourceFile: fileName
        });
      }
    }
    
    // Second pass: Store providers
    console.log(`Storing ${providerMap.size} unique providers...`);
    for (const [providerId, providerData] of providerMap.entries()) {
      if (operationCount >= MAX_OPERATIONS) {
        batches.push(currentBatch);
        currentBatch = db.batch();
        operationCount = 0;
      }
      
      const docRef = db.collection('providers').doc(providerId);
      currentBatch.set(docRef, providerData);
      operationCount++;
    }
    
    // Third pass: Store price data and service information
    console.log('Processing price data and services...');
    for (const item of data) {
      if (operationCount >= MAX_OPERATIONS) {
        batches.push(currentBatch);
        currentBatch = db.batch();
        operationCount = 0;
      }
      
      // Create a unique identifier for each price entry
      const priceDocId = uuidv4();
      const docRef = db.collection('hospital_prices').doc(priceDocId);
      
      // Format the price data
      const priceData = {
        id: priceDocId,
        serviceDescription: item['Service Description'],
        serviceCode: item['Service Code'],
        setting: item['Setting'],
        standardCharge: parseFloat(item['Standard Charge'] || 0),
        hospitalId: item['Hospital ID'],
        hospitalName: item['Hospital Name'],
        postalCode: item['Postal Code'] ? item['Postal Code'].toString() : '',
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
        
        // Calculate savings if both prices are available
        if (priceData.standardCharge && priceData.negotiatedAmount) {
          priceData.savings = priceData.standardCharge - priceData.negotiatedAmount;
          priceData.savingsPercentage = (priceData.savings / priceData.standardCharge) * 100;
        }
      }
      
      // Add comments if available
      if (item['Comments']) {
        priceData.comments = item['Comments'];
      }
      
      currentBatch.set(docRef, priceData);
      operationCount++;
      
      // Track unique services for service catalog
      const serviceKey = `${item['Service Code']}_${item['Service Description']}`;
      if (!serviceMap.has(serviceKey)) {
        serviceMap.set(serviceKey, {
          code: item['Service Code'],
          description: item['Service Description'],
          importedAt: admin.firestore.FieldValue.serverTimestamp(),
          sourceFile: fileName
        });
      }
    }
    
    // Fourth pass: Store services catalog
    console.log(`Storing ${serviceMap.size} unique services...`);
    for (const [serviceKey, serviceData] of serviceMap.entries()) {
      if (operationCount >= MAX_OPERATIONS) {
        batches.push(currentBatch);
        currentBatch = db.batch();
        operationCount = 0;
      }
      
      // Use service code as document ID
      const docRef = db.collection('services').doc(serviceData.code);
      currentBatch.set(docRef, serviceData);
      operationCount++;
    }
    
    // Add the last batch
    if (operationCount > 0) {
      batches.push(currentBatch);
    }
    
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
    
    // Create a summary of what was imported
    const summary = {
      fileName: fileName,
      totalRecords: data.length,
      providersImported: providerMap.size,
      pricesImported: data.length,
      servicesImported: serviceMap.size
    };
    
    // Create an import log
    await db.collection('file_imports').add({
      ...summary,
      importedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`Successfully imported consolidated data from ${fileName}`);
    console.log(summary);
    
    return {
      success: true,
      ...summary
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
  
  async importConsolidatedFile(config) {
    try {
      // Connect to FTP
      await this.connect(config);
      
      // List files
      const files = await this.listFiles(config.directory || '/');
      
      // Find consolidated file (assumes naming pattern)
      const consolidatedFile = files.find(file => 
        file.name.startsWith('consolidated_hospital_data_') && file.name.endsWith('.csv')
      );
      
      if (!consolidatedFile) {
        throw new Error('No consolidated hospital data file found on FTP server');
      }
      
      console.log(`Found consolidated file: ${consolidatedFile.name}`);
      
      // Download file
      const localPath = await this.downloadFile(consolidatedFile.name, consolidatedFile.name);
      
      // Process CSV
      const data = await this.processCSVFile(localPath);
      
      // Store in Firebase
      const result = await this.storeConsolidatedDataInFirestore(consolidatedFile.name, data);
      
      // Cleanup
      await this.cleanupTempFiles();
      await this.disconnect();
      
      return result;
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
  
  // Keep the existing importAllFiles method for backwards compatibility
  async importAllFiles(config) {
    // Check if we should use the consolidated import
    if (config.useConsolidated) {
      return this.importConsolidatedFile(config);
    }
    
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
        // Check if this is a consolidated file
        if (file.name.startsWith('consolidated_hospital_data')) {
          console.log(`Processing consolidated file: ${file.name}`);
          
          // Download file
          const localPath = await this.downloadFile(file.name, file.name);
          
          // Process CSV
          const data = await this.processCSVFile(localPath);
          
          // Store in Firebase using consolidated method
          const result = await this.storeConsolidatedDataInFirestore(file.name, data);
          results.push(result);
        } else {
          // Download file
          const localPath = await this.downloadFile(file.name, file.name);
          
          // Process CSV
          const data = await this.processCSVFile(localPath);
          
          // Store in Firebase using original method
          // This branch is kept for backward compatibility but may not be needed
          throw new Error('Non-consolidated files are no longer supported. Please use the consolidated format.');
        }
      }
      
      // Cleanup
      await this.cleanupTempFiles();
      await this.disconnect();
      
      return {
        success: true,
        filesProcessed: results.length,
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