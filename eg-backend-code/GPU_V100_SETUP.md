# NVIDIA V100 16GB GPU Configuration Guide

## Hardware Specifications
- **GPU Model**: NVIDIA Tesla V100 16GB
- **Memory**: 16,384 MB (16 GB) HBM2
- **CUDA Cores**: 5,120
- **Tensor Cores**: 640 (for mixed precision training)
- **Compute Capability**: 7.0
- **Memory Bandwidth**: 900 GB/s

## Software Requirements

### CUDA & cuDNN
- **CUDA**: Version 11.x or higher (recommended: 11.8)
- **cuDNN**: Version 8.x (recommended: 8.6 for CUDA 11.x)

### Python Dependencies
```bash
pip install tensorflow-gpu==2.13.0  # or latest stable version
pip install nvidia-ml-py3  # for GPU monitoring
```

## Environment Variables

Configure these environment variables for optimal V100 performance:

```bash
# GPU Selection
export CUDA_VISIBLE_DEVICES=0  # Use GPU 0 (adjust if multiple GPUs)

# Memory Configuration
export GPU_MEMORY_LIMIT=14336  # 14GB of 16GB (leave 2GB for system)
export TF_FORCE_GPU_ALLOW_GROWTH=true  # Allow dynamic memory allocation

# Performance Optimizations
export TF_ENABLE_XLA=true  # Enable XLA JIT compilation
export TF_MIXED_PRECISION=true  # Enable FP16 for Tensor Cores
export TF_CUDNN_USE_AUTOTUNE=1  # Auto-tune cuDNN kernels
export TF_GPU_THREAD_MODE=gpu_private  # Optimize thread mode

# Optional: Enable CUDA unified memory for large models
export TF_FORCE_UNIFIED_MEMORY=1
export XLA_PYTHON_CLIENT_MEM_FRACTION=0.8
```

## Configuration Details

### GPU Initialization (elemental_genius_backend.py)

The backend automatically initializes the V100 GPU on startup with:

1. **Memory Growth**: Allows TensorFlow to allocate GPU memory as needed
2. **XLA Optimization**: Just-In-Time compilation for better performance
3. **Mixed Precision**: Uses FP16 where possible to leverage Tensor Cores
4. **Memory Limit**: Configurable limit to prevent OOM errors

### Key Features Enabled

- **Tensor Cores**: Automatically used for mixed precision operations
- **Multi-Stream Execution**: Concurrent kernel execution
- **CUDA Graphs**: Reduced kernel launch overhead
- **Persistent Kernels**: Reduced context switching

## Performance Optimizations

### 1. Mixed Precision Training
The V100's Tensor Cores provide up to 8x speedup for FP16 operations:
```python
from tensorflow.keras import mixed_precision
policy = mixed_precision.Policy('mixed_float16')
mixed_precision.set_global_policy(policy)
```

### 2. XLA Compilation
Enabled by default for graph optimization and kernel fusion:
```python
tf.config.optimizer.set_jit(True)
```

### 3. Memory Management
Dynamic memory growth prevents allocation of all GPU memory at once:
```python
tf.config.experimental.set_memory_growth(gpu, True)
```

## Monitoring GPU Usage

### Check GPU Status
```bash
nvidia-smi
```

### Monitor in Real-time
```bash
watch -n 1 nvidia-smi
```

### Python GPU Monitoring
```python
import nvidia_ml_py3 as nvml
nvml.nvmlInit()
handle = nvml.nvmlDeviceGetHandleByIndex(0)
info = nvml.nvmlDeviceGetMemoryInfo(handle)
print(f"GPU memory: {info.used / 1024**3:.2f} GB / {info.total / 1024**3:.2f} GB")
```

## Troubleshooting

### Issue: CUDA/cuDNN Not Found
```bash
# Verify CUDA installation
nvcc --version

# Check cuDNN
cat /usr/local/cuda/include/cudnn_version.h | grep CUDNN_MAJOR -A 2
```

### Issue: Out of Memory Errors
1. Reduce batch size in model training
2. Enable memory growth: `TF_FORCE_GPU_ALLOW_GROWTH=true`
3. Reduce GPU memory limit: `GPU_MEMORY_LIMIT=12288`

### Issue: GPU Not Detected
```bash
# Check if GPU is visible
python -c "import tensorflow as tf; print(tf.config.list_physical_devices('GPU'))"

# Verify CUDA paths
echo $LD_LIBRARY_PATH
echo $CUDA_HOME
```

## Performance Benchmarks

Expected performance improvements with V100 vs CPU:
- **Training Speed**: 10-50x faster
- **Inference Speed**: 5-20x faster
- **Mixed Precision**: Additional 2-3x speedup
- **Large Batch Processing**: Up to 100x faster

## Best Practices

1. **Use Mixed Precision**: Enable for all models to leverage Tensor Cores
2. **Batch Size**: Use largest batch size that fits in memory
3. **Data Pipeline**: Use tf.data API with prefetching
4. **Multi-GPU**: Scale to multiple V100s for larger models
5. **Profile Performance**: Use TensorBoard profiler to identify bottlenecks

## Model-Specific Settings

### For Elemental Genius AI Models:
- **Recommendation Model**: Uses ~2GB GPU memory
- **Voice Processing**: Uses ~1GB GPU memory
- **Content Generation**: Uses ~3GB GPU memory
- **Total Reserved**: ~14GB (leaving 2GB buffer)

## Verification

Run this command to verify V100 setup:
```bash
python -c "
import tensorflow as tf
gpus = tf.config.list_physical_devices('GPU')
if gpus:
    gpu = gpus[0]
    details = tf.config.experimental.get_device_details(gpu)
    print(f'GPU: {gpu.name}')
    print(f'Compute Capability: {details.get(\"compute_capability\")}')
    print('V100 16GB Ready!' if '7.0' in str(details.get('compute_capability')) else 'Not V100')
"
```

## Support

For GPU-related issues:
1. Check NVIDIA driver: `nvidia-smi`
2. Verify TensorFlow GPU: `pip show tensorflow-gpu`
3. Review system logs: `dmesg | grep -i nvidia`
4. Check CUDA compatibility: https://www.tensorflow.org/install/source#gpu