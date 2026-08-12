from pymongo import MongoClient
from app.config import mongodb_url, mongo_db

# Global database client
_client: MongoClient = None
_database = None


def connect_to_database():
    """Connect to MongoDB"""
    global _client, _database
    _client = MongoClient(mongodb_url)
    _database = _client[mongo_db]
    print(f"Connected to MongoDB: {mongo_db}")
    return _database


def close_database_connection():
    """Close MongoDB connection"""
    global _client
    if _client:
        _client.close()
        print("Closed MongoDB connection")


def get_database():
    """Get database instance"""
    global _database
    if _database is None:
        connect_to_database()
    return _database

