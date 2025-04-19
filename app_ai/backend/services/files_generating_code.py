import csv
import os
import random
from datetime import datetime

# Create output directory if it doesn't exist
output_dir = 'app_ai/backend/services/hospital_files'
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

# Generate 5 hospital data with ratings
hospitals = [
    {"id": "hospital1", "name": "General Hospital", "postal_code": postal_codes[0], "rating": 4.5},
    {"id": "hospital2", "name": "Medical Center", "postal_code": postal_codes[1], "rating": 3.8},
    {"id": "hospital3", "name": "Community Hospital", "postal_code": postal_codes[2], "rating": 4.2},
    {"id": "hospital4", "name": "Regional Medical Center", "postal_code": postal_codes[3], "rating": 3.5},
    {"id": "hospital5", "name": "University Hospital", "postal_code": postal_codes[4], "rating": 4.7}
]

# Define a comprehensive list of CSV headers for the consolidated file
consolidated_headers = [
    # Provider information
    "Hospital ID", "Hospital Name", "Hospital Type", 
    "Street", "City", "State", "Postal Code", 
    "Latitude", "Longitude", "Phone", "Email", "Website",
    "Accepted Insurance", "Hospital Rating",
    
    # Service information
    "Service Description", "Service Code", "Setting", 
    
    # Pricing information
    "Standard Charge", "Insurance", "Plan Name", "Negotiated Amount", 
    
    # Additional information
    "Comments",
]

def generate_consolidated_data():
    data = []
    date_str = datetime.now().strftime("%Y-%m-%d")
    
    for hospital in hospitals:
        # Generate provider details for this hospital
        hospital_id = hospital["id"]
        hospital_name = hospital["name"]
        postal_code = hospital["postal_code"]
        hospital_rating = hospital["rating"]  # Get the consistent rating for this hospital
        hospital_type = random.choice(["Hospital", "Medical Center", "Clinic", "Specialty Center"])
        street = f"{random.randint(100, 9999)} Main St"
        phone = f"(555) {random.randint(100, 999)}-{random.randint(1000, 9999)}"
        email = f"info@{hospital_id}.example.com"
        website = f"https://www.{hospital_id}.example.com"
        accepted_insurance = ", ".join([ins["name"] for ins in random.sample(insurances, random.randint(3, len(insurances)))])
        
        # Common hospital data for all rows
        hospital_data = {
            "Hospital ID": hospital_id,
            "Hospital Name": hospital_name,
            "Hospital Type": hospital_type,
            "Street": street,
            "City": postal_code["city"],
            "State": postal_code["state"],
            "Postal Code": postal_code["code"],
            "Latitude": postal_code["lat"],
            "Longitude": postal_code["lng"],
            "Phone": phone,
            "Email": email,
            "Website": website,
            "Accepted Insurance": accepted_insurance,
            "Hospital Rating": hospital_rating,  # Add the consistent rating to each row
        }
        
        # Select random services for this hospital
        service_count = 15  # Reduced for cleaner output
        selected_services = random.sample(services, min(service_count, len(services)))
        if service_count > len(services):
            # Add duplicates with different settings if needed
            additional_services = random.choices(services, k=service_count - len(services))
            selected_services.extend(additional_services)
        
        for service in selected_services:
            # Generate standard charge
            standard_charge = round(random.uniform(100, 2000), 2)
            
            # For each service, decide how many insurance options to include
            insurance_count = random.randint(0, 3)  # Some might have no insurance options
            
            if insurance_count == 0:
                # Only standard charge, no insurance
                for setting in service["settings"]:
                    if setting == "BOTH":
                        settings_to_use = ["INPATIENT", "OUTPATIENT"]
                    else:
                        settings_to_use = [setting]
                    
                    for actual_setting in settings_to_use:
                        row_data = {
                            "Service Description": service["description"],
                            "Service Code": service["code"],
                            "Setting": actual_setting,
                            "Standard Charge": standard_charge,
                            "Insurance": "",
                            "Plan Name": "",
                            "Negotiated Amount": "",
                            "Comments": "Only standard charge, no insurance pricing available."
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
                            if setting == "BOTH":
                                settings_to_use = ["INPATIENT", "OUTPATIENT"]
                            else:
                                settings_to_use = [setting]
                            
                            for actual_setting in settings_to_use:
                                savings = round(standard_charge - negotiated_price, 2)
                                comment = f"Save ${savings} with {insurance['name']} {plan} plan."
                                
                                row_data = {
                                    "Service Description": service["description"],
                                    "Service Code": service["code"],
                                    "Setting": actual_setting,
                                    "Standard Charge": standard_charge,
                                    "Insurance": insurance["name"],
                                    "Plan Name": plan,
                                    "Negotiated Amount": negotiated_price,
                                    "Comments": comment
                                }
                                row_data.update(hospital_data)  # Add the hospital information
                                data.append(row_data)
    
    return data

def main():
    print("Generating consolidated hospital data file with hospital ratings...")
    
    # Generate the consolidated data
    all_data = generate_consolidated_data()
    
    # Create the filename with timestamp
    date_str = datetime.now().strftime("%Y%m%d")
    filename = f"consolidated_hospital_data.csv"
    file_path = os.path.join(output_dir, filename)
    
    # Write to CSV
    with open(file_path, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=consolidated_headers)
        writer.writeheader()
        writer.writerows(all_data)
    
    print(f"Successfully created {file_path} with {len(all_data)} records.")
    print(f"File contains data for {len(hospitals)} hospitals with services, pricing information, and ratings.")

if __name__ == "__main__":
    main()