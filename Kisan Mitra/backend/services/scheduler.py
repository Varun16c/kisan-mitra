from apscheduler.schedulers.asyncio import AsyncIOScheduler

_scheduler = AsyncIOScheduler(timezone="Asia/Kolkata")

def setup_scheduler(db):
    
    @_scheduler.scheduled_job('interval', hours=6, id='pib_check')
    async def pib_job():
        print("[Scheduler] PIB RSS check starting...")
        from services.data_sources.pib_source import fetch_new_pib_schemes
        from services.ingestion_pipeline import IngestionPipeline
        pipeline = IngestionPipeline()
        schemes = await fetch_new_pib_schemes(db)
        if schemes:
            await pipeline.run_source('PIB_Scheduled', schemes, 'https://pib.gov.in')
            from services.eligibility_service import refresh_schemes
            refresh_schemes()
    
    @_scheduler.scheduled_job('cron', day_of_week='sun', hour=2, id='hf_sync')
    async def hf_job():
        print("[Scheduler] Weekly HuggingFace sync starting...")
        from services.data_sources.huggingface_source import fetch_huggingface
        from services.ingestion_pipeline import IngestionPipeline
        pipeline = IngestionPipeline()
        schemes = await fetch_huggingface()
        await pipeline.run_source('HuggingFace_Weekly', schemes,
            'https://huggingface.co/datasets/shrijayan/gov_myscheme')
        from services.eligibility_service import refresh_schemes
        refresh_schemes()
    
    if not _scheduler.running:
        _scheduler.start()
        print("✅ Scheduler active: PIB every 6hr | HuggingFace every Sunday 2AM IST")
