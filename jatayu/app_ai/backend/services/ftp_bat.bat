@echo off
echo Setting up PriceAI local FTP server and data generator...

echo Installing required Python packages...
pip install pyftpdlib

echo Generating sample hospital CSV files...
python files_generating_code.py

echo Starting FTP server...
start cmd /k python ftp_server.py

echo Setup complete. FTP server is running.
echo.
echo Use the following settings in your PriceAI application:
echo Host: 127.0.0.1
echo Port: 21
echo Username: user
echo Password: password
echo Directory: /
echo.
echo The following CSV files are available on the FTP server:
echo - hospital1_*.csv  (General Hospital data)
echo - hospital2_*.csv  (Medical Center data)
echo - hospital3_*.csv  (Community Hospital data)
echo - hospital4_*.csv  (Regional Medical Center data)
echo - hospital5_*.csv  (University Hospital data)
echo - all_hospitals_prices_*.csv  (Combined data file)
echo - providers.csv    (Provider information)
echo - postal_codes.csv (Postal codes reference data)