import csv
import os
import random
from datetime import datetime

# Create output directory if it doesn't exist
output_dir = 'hospital_files'
os.makedirs(output_dir, exist_ok=True)

# Sample US postal codes with their coordinates for different regions
# These will be used for the hospitals
postal_codes = [
    {"code": "19103", "city": "Philadelphia", "state": "PA", "lat": 39.9526, "lng": -75.1652},
    {"code": "19106", "city": "Philadelphia", "state": "PA", "lat": 39.9496, "lng": -75.1467},  
    {"code": "19107", "city": "Philadelphia", "state": "PA", "lat": 39.9483, "lng": -75.1594},
    {"code": "19102", "city": "Philadelphia", "state": "PA", "lat": 39.9507, "lng": -75.1628},
    {"code": "19146", "city": "Philadelphia", "state": "PA", "lat": 39.9432, "lng": -75.1855},
    {"code": "19104", "city": "Philadelphia", "state": "PA", "lat": 39.9597, "lng": -75.2025},
    {"code": "19130", "city": "Philadelphia", "state": "PA", "lat": 39.9686, "lng": -75.1745},
    {"code": "19147", "city": "Philadelphia", "state": "PA", "lat": 39.9381, "lng": -75.1516},
    {"code": "19148", "city": "Philadelphia", "state": "PA", "lat": 39.9256, "lng": -75.1591},
    {"code": "19145", "city": "Philadelphia", "state": "PA", "lat": 39.9257, "lng": -75.1866}
]

# List of possible services
services = [
    {"description": "1 CC STERILE SYRINGE&NEEDLE", "code": "A4206", "settings": ["INPATIENT", "OUTPATIENT"]},
    {"description": "TRILOCK GRIDPL", "code": "C1713", "settings": ["BOTH"]},
    {"description": "TRILOCK SCAPHOID PLATE", "code": "C1713", "settings": ["BOTH"]},
    {"description": "CHG MRI BRAIN", "code": "70551", "settings": ["OUTPATIENT"]},
    {"description": "2D ECHO", "code": "93306", "settings": ["OUTPATIENT"]},
    {"description": "ABDOMINAL CT SCAN", "code": "74150", "settings": ["BOTH"]},
    {"description": "ACETYLCYSTEINE NON-COMP UNIT", "code": "J7608", "settings": ["OUTPATIENT", "INPATIENT"]},
    {"description": "CHEST X-RAY", "code": "71045", "settings": ["BOTH"]},
    {"description": "COMPLETE BLOOD COUNT", "code": "85025", "settings": ["BOTH"]},
    {"description": "BASIC METABOLIC PANEL", "code": "80048", "settings": ["BOTH"]}
]

# List of insurance providers and plans
insurances = [
    {"name": "Aetna", "plans": ["Aetna Commercial", "Aetna Medicaid CHIP", "Aetna Medicare"]},
    {"name": "Humana", "plans": ["Humana Medicare HMO", "Humana Medicare PPO", "Humana Commercial"]},
    {"name": "United Healthcare", "plans": ["United Healthcare CHIP", "United Healthcare Medicaid", "United Healthcare Commercial"]},
    {"name": "Highmark", "plans": ["Highmark ACA Products PROF", "Highmark Commercial PROF", "Highmark Medicare"]},
    {"name": "Amerihealth", "plans": ["Amerihealth Medicaid HC", "Amerihealth Commercial", "Amerihealth Medicare"]}
]

# Generate 5 hospital files with postal codes
hospitals = [
    {"id": "hospital1", "name": "General Hospital", "postal_code": postal_codes[0]},
    {"id": "hospital2", "name": "Medical Center", "postal_code": postal_codes[1]},
    {"id": "hospital3", "name": "Community Hospital", "postal_code": postal_codes[2]},
    {"id": "hospital4", "name": "Regional Medical Center", "postal_code": postal_codes[3]},
    {"id": "hospital5", "name": "University Hospital", "postal_code": postal_codes[4]}
]

# Define CSV headers for price files
price_headers = [
    "Service Description", "Service Code", "Setting", "Standard Charge", 
    "Insurance", "Plan Name", "Negotiated Amount", "Comments",
    "Hospital Name", "Hospital ID", "Postal Code", "City", "State", "Latitude", "Longitude"
]

def generate_price_data(hospital):
    data = []
    hospital_id = hospital["id"]
    hospital_name = hospital["name"]
    postal_code = hospital["postal_code"]
    
    # Common hospital data for all rows
    hospital_data = {
        "Hospital Name": hospital_name,
        "Hospital ID": hospital_id,
        "Postal Code": postal_code["code"],
        "City": postal_code["city"],
        "State": postal_code["state"],
        "Latitude": postal_code["lat"],
        "Longitude": postal_code["lng"]
    }
    
    # Select random services
    service_count = 50
    selected_services = random.sample(services, min(service_count, len(services)))
    if service_count > len(services):
        # Add duplicates with different settings if needed
        additional_services = random.choices(services, k=service_count - len(services))
        selected_services.extend(additional_services)
    
    for service in selected_services:
        # Generate standard charge
        standard_charge = round(random.uniform(10, 2000), 2)
        
        # For each service, decide how many insurance options to include
        insurance_count = random.randint(0, 3)  # Some might have no insurance options
        
        if insurance_count == 0:
            # Only standard charge, no insurance
            for setting in service["settings"]:
                row_data = {
                    "Service Description": service["description"],
                    "Service Code": service["code"],
                    "Setting": setting,
                    "Standard Charge": standard_charge,
                    "Insurance": "",
                    "Plan Name": "",
                    "Negotiated Amount": "",
                    "Comments": "Only standard charge and no price with insurance – meaning this service is provided by the hospital directly, and not through any insurance."
                }
                row_data.update(hospital_data)  # Add the hospital information
                data.append(row_data)
        else:
            # Add rows with insurance options
            selected_insurances = random.sample(insurances, min(insurance_count, len(insurances)))
            
            for insurance in selected_insurances:
                # Pick a random number of plans
                plan_count = random.randint(1, len(insurance["plans"]))
                selected_plans = random.sample(insurance["plans"], plan_count)
                
                for plan in selected_plans:
                    # Calculate negotiated price (usually less than standard)
                    negotiated_price = round(standard_charge * random.uniform(0.5, 0.95), 2)
                    
                    for setting in service["settings"]:
                        comment = f"This service costs ${standard_charge} as standard price when patient does not have any insurance.\nSame service costs ${negotiated_price} if patient has '{plan}' insurance plan."
                        
                        row_data = {
                            "Service Description": service["description"],
                            "Service Code": service["code"],
                            "Setting": setting,
                            "Standard Charge": standard_charge,
                            "Insurance": insurance["name"],
                            "Plan Name": plan,
                            "Negotiated Amount": negotiated_price,
                            "Comments": comment
                        }
                        row_data.update(hospital_data)  # Add the hospital information
                        data.append(row_data)
                
                # Also add a version with standard charge for each setting
                for setting in service["settings"]:
                    row_data = {
                        "Service Description": service["description"],
                        "Service Code": service["code"],
                        "Setting": setting,
                        "Standard Charge": standard_charge,
                        "Insurance": "",
                        "Plan Name": "",
                        "Negotiated Amount": "",
                        "Comments": "Standard charge with no insurance."
                    }
                    row_data.update(hospital_data)  # Add the hospital information
                    data.append(row_data)
    
    return data

# Create a provider information CSV
def generate_providers_csv():
    provider_headers = [
        "Hospital ID", "Hospital Name", "Hospital Type", 
        "Street", "City", "State", "Postal Code", 
        "Latitude", "Longitude", "Phone", "Email", "Website",
        "Accepted Insurance"
    ]
    
    providers_data = []
    
    for hospital in hospitals:
        # Create the provider object
        provider = {
            "Hospital ID": hospital["id"],
            "Hospital Name": hospital["name"],
            "Hospital Type": random.choice(["Hospital", "Medical Center", "Clinic", "Specialty Center"]),
            "Street": f"{random.randint(100, 9999)} Main St",
            "City": hospital["postal_code"]["city"],
            "State": hospital["postal_code"]["state"],
            "Postal Code": hospital["postal_code"]["code"],
            "Latitude": hospital["postal_code"]["lat"],
            "Longitude": hospital["postal_code"]["lng"],
            "Phone": f"(555) {random.randint(100, 999)}-{random.randint(1000, 9999)}",
            "Email": f"info@{hospital['id']}.example.com",
            "Website": f"https://www.{hospital['id']}.example.com",
            "Accepted Insurance": ", ".join([ins["name"] for ins in random.sample(insurances, random.randint(3, len(insurances)))])
        }
        
        providers_data.append(provider)
    
    # Save providers to CSV file
    providers_file = os.path.join(output_dir, 'providers.csv')
    with open(providers_file, 'w', newline='') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=provider_headers)
        writer.writeheader()
        writer.writerows(providers_data)
    
    print(f"Created providers.csv with {len(providers_data)} providers")

# Generate and save price files for each hospital
def generate_price_files():
    # Create a combined file with all hospital prices
    all_prices_data = []
    
    for hospital in hospitals:
        # Generate a unique filename with date stamp
        date_str = datetime.now().strftime("%Y%m%d")
        filename = f"{hospital['id']}_{date_str}.csv"
        file_path = os.path.join(output_dir, filename)
        
        # Generate price data
        data = generate_price_data(hospital)
        all_prices_data.extend(data)
        
        # Write to CSV
        with open(file_path, 'w', newline='') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=price_headers)
            writer.writeheader()
            writer.writerows(data)
        
        print(f"Created {file_path} with {len(data)} records")
    
    # Also create a combined file with all prices
    combined_file = os.path.join(output_dir, f"all_hospitals_prices_{date_str}.csv")
    with open(combined_file, 'w', newline='') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=price_headers)
        writer.writeheader()
        writer.writerows(all_prices_data)
    
    print(f"Created combined file {combined_file} with {len(all_prices_data)} records")

# Generate a postal codes reference CSV
def generate_postal_codes_csv():
    postal_headers = ["Postal Code", "City", "State", "Latitude", "Longitude"]
    
    # Save to CSV file
    postal_file = os.path.join(output_dir, 'postal_codes.csv')
    with open(postal_file, 'w', newline='') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=postal_headers)
        writer.writeheader()
        
        for postal_code in postal_codes:
            writer.writerow({
                "Postal Code": postal_code["code"],
                "City": postal_code["city"],
                "State": postal_code["state"],
                "Latitude": postal_code["lat"],
                "Longitude": postal_code["lng"]
            })
    
    print(f"Created postal_codes.csv with {len(postal_codes)} postal codes")

# Main execution
def main():
    # Generate provider data with location information
    generate_providers_csv()
    
    # Generate price files for each hospital
    generate_price_files()
    
    # Generate postal codes for reference
    generate_postal_codes_csv()
    
    print("All hospital price files and provider data generated successfully.")

if __name__ == "__main__":
    main()