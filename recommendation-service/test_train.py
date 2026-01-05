import asyncio
from database import MongoDB
from recommendation_engine import recommendation_engine

async def test():
    db = MongoDB()
    await db.connect()
    print('✅ Connected!')
    
    # Fetch data
    ratings_data = await db.get_all_ratings()
    teachers_data = await db.get_all_teachers()
    
    print(f'Ratings: {len(ratings_data)}')
    print(f'Teachers: {len(teachers_data)}')
    
    if teachers_data:
        print('\nTraining models...')
        try:
            results = await recommendation_engine.train(ratings_data, teachers_data)
            print(f'✅ Training results: {results}')
        except Exception as e:
            print(f'❌ Training failed: {e}')
            import traceback
            traceback.print_exc()
    
    await db.disconnect()

if __name__ == "__main__":
    asyncio.run(test())
