// // run-test.js
// const fileImportService = require('./file-import.service');

// // Configuration for the local FTP server
// const ftpConfig = {
//   host: '127.0.0.1',
//   port: 21,
//   user: 'user',
//   password: 'password',
//   secure: false, // Important for local FTP server (no SSL)
//   directory: '/'
// };

// async function importFilesFromFTP() {
//   console.log('Starting file import from FTP to Firestore...');
  
//   try {
//     // Run the import process
//     const result = await fileImportService.importAllFiles(ftpConfig);
    
//     console.log('\nImport completed successfully!');
//     console.log(`Processed ${result.filesProcessed} files`);
    
//     // Show details for each file
//     if (result.results && result.results.length > 0) {
//       console.log('\nFile details:');
//       result.results.forEach(file => {
//         console.log(`- ${file.fileName}: ${file.recordCount} records stored in collection '${file.collectionName}'`);
//       });
//     }
    
//     console.log('\nFiles have been imported to Firestore and are ready to use.');
    
//   } catch (error) {
//     console.error('\nImport failed:');
//     console.error(error.message);
    
//     if (error.message.includes('ECONNREFUSED')) {
//       console.error('\nCould not connect to FTP server. Please check:');
//       console.error('1. FTP server is running on localhost:21');
//       console.error('2. Username and password are correct');
//     }
//   }
// }

// // Run the import
// importFilesFromFTP();


// Import the service
const fileImportService = require('./file-import.service');

// Configure the FTP connection
const config = {
   host: '127.0.0.1',
    port: 21,
    user: 'user',
    password: 'password',
    secure: false, // Important for local FTP server (no SSL)
    directory: '/'
  };

// Run the import
fileImportService.importConsolidatedFile(config)
  .then(result => {
    console.log('Import completed successfully:', result);
  })
  .catch(error => {
    console.error('Import failed:', error);
  });