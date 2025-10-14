#!/usr/bin/env python3
"""
Database initialization script for contact form
Creates SQLite database with proper schema and initial setup
Following GDPR compliance requirements
"""

import sqlite3
import os
import sys
from pathlib import Path
from datetime import datetime, timedelta


def get_database_path() -> Path:
    """Get the path to the SQLite database file"""
    # Store database in backend/database directory
    db_dir = Path(__file__).parent
    return db_dir / "contact_form.db"


def get_schema_path() -> Path:
    """Get the path to the schema SQL file"""
    return Path(__file__).parent / "schema.sql"


def init_database(db_path: Path = None, verbose: bool = True) -> bool:
    """
    Initialize the database with schema
    
    Args:
        db_path: Path to database file (uses default if None)
        verbose: Print progress messages
        
    Returns:
        True if successful, False otherwise
    """
    if db_path is None:
        db_path = get_database_path()
    
    schema_path = get_schema_path()
    
    if not schema_path.exists():
        print(f"ERROR: Schema file not found: {schema_path}", file=sys.stderr)
        return False
    
    try:
        # Create database directory if it doesn't exist
        db_path.parent.mkdir(parents=True, exist_ok=True)
        
        if verbose:
            print(f"Initializing database at: {db_path}")
        
        # Connect to database (creates file if it doesn't exist)
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        # Read and execute schema
        with open(schema_path, 'r') as f:
            schema_sql = f.read()
        
        if verbose:
            print("Executing schema...")
        
        # Execute schema (may contain multiple statements)
        cursor.executescript(schema_sql)
        
        # Verify tables were created
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
        )
        tables = [row[0] for row in cursor.fetchall()]
        
        expected_tables = ['contact_submissions', 'audit_logs']
        missing_tables = [t for t in expected_tables if t not in tables]
        
        if missing_tables:
            print(f"ERROR: Missing tables: {missing_tables}", file=sys.stderr)
            return False
        
        if verbose:
            print(f"Created tables: {', '.join(tables)}")
        
        # Verify views were created
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='view' ORDER BY name"
        )
        views = [row[0] for row in cursor.fetchall()]
        
        if verbose and views:
            print(f"Created views: {', '.join(views)}")
        
        # Verify indexes were created
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='index' ORDER BY name"
        )
        indexes = [row[0] for row in cursor.fetchall()]
        
        if verbose and indexes:
            # Filter out auto-created indexes (start with 'sqlite_')
            custom_indexes = [idx for idx in indexes if not idx.startswith('sqlite_')]
            if custom_indexes:
                print(f"Created indexes: {', '.join(custom_indexes)}")
        
        # Enable foreign key constraints
        cursor.execute("PRAGMA foreign_keys = ON")
        
        # Set journal mode to WAL for better concurrency
        cursor.execute("PRAGMA journal_mode = WAL")
        
        # Commit changes
        conn.commit()
        
        if verbose:
            print("Database initialized successfully!")
            print(f"Database location: {db_path.absolute()}")
        
        return True
        
    except sqlite3.Error as e:
        print(f"ERROR: SQLite error: {e}", file=sys.stderr)
        return False
    except Exception as e:
        print(f"ERROR: Unexpected error: {e}", file=sys.stderr)
        return False
    finally:
        if 'conn' in locals():
            conn.close()


def verify_database(db_path: Path = None) -> bool:
    """
    Verify database structure is correct
    
    Args:
        db_path: Path to database file (uses default if None)
        
    Returns:
        True if database is valid, False otherwise
    """
    if db_path is None:
        db_path = get_database_path()
    
    if not db_path.exists():
        print(f"ERROR: Database does not exist: {db_path}", file=sys.stderr)
        return False
    
    try:
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        # Check tables exist
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table'"
        )
        tables = {row[0] for row in cursor.fetchall()}
        
        required_tables = {'contact_submissions', 'audit_logs'}
        if not required_tables.issubset(tables):
            missing = required_tables - tables
            print(f"ERROR: Missing tables: {missing}", file=sys.stderr)
            return False
        
        # Check contact_submissions columns
        cursor.execute("PRAGMA table_info(contact_submissions)")
        columns = {row[1] for row in cursor.fetchall()}
        
        required_columns = {
            'id', 'name', 'email', 'message', 'timestamp', 
            'consent_given', 'ip_address_hash', 'created_at', 
            'updated_at', 'retention_expiry'
        }
        
        if not required_columns.issubset(columns):
            missing = required_columns - columns
            print(f"ERROR: Missing columns in contact_submissions: {missing}", 
                  file=sys.stderr)
            return False
        
        # Check audit_logs columns
        cursor.execute("PRAGMA table_info(audit_logs)")
        columns = {row[1] for row in cursor.fetchall()}
        
        required_columns = {
            'id', 'event_type', 'timestamp', 'user_id', 'ip_hash',
            'submission_id', 'event_data', 'created_at'
        }
        
        if not required_columns.issubset(columns):
            missing = required_columns - columns
            print(f"ERROR: Missing columns in audit_logs: {missing}", 
                  file=sys.stderr)
            return False
        
        print("Database structure verified successfully!")
        return True
        
    except sqlite3.Error as e:
        print(f"ERROR: SQLite error during verification: {e}", file=sys.stderr)
        return False
    finally:
        if 'conn' in locals():
            conn.close()


def reset_database(db_path: Path = None, confirm: bool = False) -> bool:
    """
    Reset database by deleting and reinitializing
    
    Args:
        db_path: Path to database file (uses default if None)
        confirm: Must be True to actually delete database
        
    Returns:
        True if successful, False otherwise
    """
    if db_path is None:
        db_path = get_database_path()
    
    if not confirm:
        print("ERROR: reset_database requires confirm=True", file=sys.stderr)
        return False
    
    try:
        if db_path.exists():
            print(f"Deleting existing database: {db_path}")
            db_path.unlink()
            
            # Also delete WAL and SHM files if they exist
            wal_path = db_path.with_suffix('.db-wal')
            shm_path = db_path.with_suffix('.db-shm')
            
            if wal_path.exists():
                wal_path.unlink()
            if shm_path.exists():
                shm_path.unlink()
        
        return init_database(db_path)
        
    except Exception as e:
        print(f"ERROR: Failed to reset database: {e}", file=sys.stderr)
        return False


def main():
    """Main entry point for command-line usage"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Initialize contact form database"
    )
    parser.add_argument(
        '--path',
        type=Path,
        help='Path to database file (default: backend/database/contact_form.db)'
    )
    parser.add_argument(
        '--verify',
        action='store_true',
        help='Verify existing database instead of initializing'
    )
    parser.add_argument(
        '--reset',
        action='store_true',
        help='Reset database (delete and reinitialize)'
    )
    parser.add_argument(
        '--quiet',
        action='store_true',
        help='Suppress output messages'
    )
    
    args = parser.parse_args()
    
    if args.verify:
        success = verify_database(args.path)
    elif args.reset:
        print("WARNING: This will delete all existing data!")
        response = input("Type 'yes' to confirm: ")
        if response.lower() == 'yes':
            success = reset_database(args.path, confirm=True)
        else:
            print("Reset cancelled.")
            success = False
    else:
        success = init_database(args.path, verbose=not args.quiet)
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
