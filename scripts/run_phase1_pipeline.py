import sys
from pathlib import Path

# Add src to python path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from src.data.ingestion.download_raw_data import download_and_decompress
from src.data.validation.audit_data import run_data_audit
from src.data.cleaning.clean_data import clean_datasets
from src.data.normalization.entity_resolution import run_normalization

def main():
    print("==========================================================================")
    print("      EXECUTING PHASE 1 DATA INGESTION & AUDIT PIPELINE - PL VALUEDGE     ")
    print("==========================================================================")
    
    print("\n--- STEP 1: RAW DATA INGESTION ---")
    download_and_decompress()

    print("\n--- STEP 2: DATA QUALITY AUDIT & COVERAGE ANALYSIS ---")
    run_data_audit()

    print("\n--- STEP 3: DATA CLEANING ---")
    clean_datasets()

    print("\n--- STEP 4: ENTITY RESOLUTION & NORMALIZATION ---")
    run_normalization()

    print("\n==========================================================================")
    print("      [OK] PHASE 1 PIPELINE EXECUTED SUCCESSFULLY - ALL AUDITS PASSED    ")
    print("==========================================================================")

if __name__ == "__main__":
    main()
