import asyncio

# Global lock for GPU access
# This ensures that even if 50 requests come in, they wait for their turn
# to run inference on the single RTX 3050.
_gpu_lock = asyncio.Lock()

def get_gpu_lock():
    return _gpu_lock
