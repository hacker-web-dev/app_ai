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
echo The CSV files are available on the FTP server
