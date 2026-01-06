"""Check what data is stored in the trained model"""
import joblib
import json

metadata = joblib.load('models/content_metadata.joblib')

print("Teacher IDs:", metadata['teacher_ids'])
print("\nTeacher Data:")
for teacher_id, data in metadata['teacher_data'].items():
    print(f"\nTeacher: {data.get('name')}")
    print(f"  ID: {teacher_id}")
    print(f"  Average Rating: {data.get('average_rating')}")
    print(f"  Skills Teaching: {data.get('skills_teaching')}")
    print(f"  Subjects: {data.get('subjects')}")
    print(f"  Expertise: {data.get('expertise')}")
