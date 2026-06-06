# Windows 11 ARM64 Port

> [!NOTE]
> This repository is a custom fork optimized and compiled for native **Windows 11 ARM64** (e.g., Snapdragon X processors like Lenovo Slim 7x). 
> Key enhancements include:
> 
> - **Native ARM64 Build**: Compiled shell and streaming server dependencies natively for ARM64.
> - **Centering Fix**: Fixed layout issues with vertical sidebar navigation auto-centering on all window sizes.
> - **Process Lifecycle Management**: Automatic cleanup of zombie `stremio.exe` or `stremio-runtime.exe` processes on startup.
> - **Streamlined Config**: Removed unsupported features on ARM64 (like Anime4K, VapourSynth, and SVP) to keep the app clean and high performance.

## Credits

This project stands on the shoulders of giants and wouldn't be possible without their incredible work:

- **Stremio Kai**: Remastered layout, metadata enhancements, and UI features by [allecsc/Stremio-Kai](https://github.com/allecsc/Stremio-Kai).
- **Stremio Community**: Original MPV player integration and shell base by [Zaarrg/stremio-community-v5](https://github.com/Zaarrg/stremio-community-v5).
