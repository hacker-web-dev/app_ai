import os
from pyftpdlib.authorizers import DummyAuthorizer
from pyftpdlib.handlers import FTPHandler
from pyftpdlib.servers import FTPServer

# FTP server settings
FTP_HOST = "127.0.0.1"
FTP_PORT = 21
FTP_USER = "user"
FTP_PASSWORD = "password"
FTP_DIRECTORY = os.path.abspath("hospital_files")  # Use the same directory where files are generated

def main():
    # Make sure the directory exists
    if not os.path.exists(FTP_DIRECTORY):
        os.makedirs(FTP_DIRECTORY)
        print(f"Created FTP directory: {FTP_DIRECTORY}")
    
    # Create authorizer
    authorizer = DummyAuthorizer()
    
    # Add user with read/write permissions
    authorizer.add_user(FTP_USER, FTP_PASSWORD, FTP_DIRECTORY, perm="elradfmw")
    
    # Create handler
    handler = FTPHandler
    handler.authorizer = authorizer
    
    # Create server
    server = FTPServer((FTP_HOST, FTP_PORT), handler)
    
    # Set parameters
    server.max_cons = 5
    server.max_cons_per_ip = 5
    
    print(f"FTP server starting on {FTP_HOST}:{FTP_PORT}")
    print(f"Username: {FTP_USER}")
    print(f"Password: {FTP_PASSWORD}")
    print(f"Directory: {FTP_DIRECTORY}")
    print(f"Serving files: {', '.join([f for f in os.listdir(FTP_DIRECTORY) if f.endswith('.csv')])}")
    
    # Start server
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("FTP server stopped")

if __name__ == "__main__":
    main()