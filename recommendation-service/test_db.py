import asyncio
from database import MongoDB

async def test():
    db = MongoDB()
    await db.connect()
    print('✅ Connected!')
    
    teachers = await db.get_all_teachers()
    print(f'Teachers found: {len(teachers)}')
    
    if teachers:
        print(f'\nFirst teacher:')
        print(f"  Name: {teachers[0].get('name')}")
        print(f"  skillsTeaching: {teachers[0].get('skillsTeaching')}")
    
    await db.disconnect()

if __name__ == "__main__":
    asyncio.run(test())
