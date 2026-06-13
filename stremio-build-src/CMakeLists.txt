cmake_minimum_required(VERSION 3.16)

project(stremio VERSION "5.0.21")

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:Debug>DLL")

option(DEBUG_LOG "Allow debug logs" ON)

# Architecture detection
if(CMAKE_SYSTEM_PROCESSOR MATCHES "ARM64|aarch64|AARCH64" OR CMAKE_VS_PLATFORM_NAME STREQUAL "ARM64")
    set(ARM64_BUILD ON)
else()
    set(ARM64_BUILD OFF)
endif()

# Locate MPV and Discord
if(ARM64_BUILD)
    # ARM64 architecture
    set(MPV_INCLUDE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/deps/libmpv/aarch64/include")
    set(MPV_LIBRARY "${CMAKE_CURRENT_SOURCE_DIR}/deps/libmpv/aarch64/mpv.lib")
    set(MPV_DLL "${CMAKE_CURRENT_SOURCE_DIR}/deps/libmpv/aarch64/libmpv-2.dll")

    set(DISCORD_LIB "${CMAKE_CURRENT_SOURCE_DIR}/deps/discord-rpc-src/build/src/discord-rpc.lib")
    set(DISCORD_INCLUDE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/deps/discord-rpc-src/include")
elseif(CMAKE_SIZEOF_VOID_P EQUAL 8)
    # 64-bit architecture
    set(MPV_INCLUDE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/deps/libmpv/x86_64/include")
    set(MPV_LIBRARY "${CMAKE_CURRENT_SOURCE_DIR}/deps/libmpv/x86_64/mpv.lib")
    set(MPV_DLL "${CMAKE_CURRENT_SOURCE_DIR}/deps/libmpv/x86_64/libmpv-2.dll")

    set(DISCORD_LIB "${CMAKE_CURRENT_SOURCE_DIR}/deps/discord-rpc/win64-static/lib/discord-rpc.lib")
    set(DISCORD_INCLUDE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/deps/discord-rpc/win64-static/include")
else()
    # 32-bit architecture
    set(MPV_INCLUDE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/deps/libmpv/i686/include")
    set(MPV_LIBRARY "${CMAKE_CURRENT_SOURCE_DIR}/deps/libmpv/i686/mpv.lib")
    set(MPV_DLL "${CMAKE_CURRENT_SOURCE_DIR}/deps/libmpv/i686/libmpv-2.dll")

    set(DISCORD_LIB "${CMAKE_CURRENT_SOURCE_DIR}/deps/discord-rpc/win32-static/lib/discord-rpc.lib")
    set(DISCORD_INCLUDE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/deps/discord-rpc/win32-static/include")
endif()

include_directories(${DISCORD_INCLUDE_DIR})
include_directories(${MPV_INCLUDE_DIR})

if(ARM64_BUILD)
    # Manual ARM64 paths
    set(OPENSSL_INCLUDE_DIR "C:/Projects/Streamio-Kai-Arm64/Stremio-Kai/openssl-4.0.0.3/arm64/include")
    set(OPENSSL_SSL_LIBRARY "C:/Projects/Streamio-Kai-Arm64/Stremio-Kai/openssl-4.0.0.3/arm64/lib/libssl.lib")
    set(OPENSSL_CRYPTO_LIBRARY "C:/Projects/Streamio-Kai-Arm64/Stremio-Kai/openssl-4.0.0.3/arm64/lib/libcrypto.lib")
    set(OPENSSL_LIBRARIES ${OPENSSL_SSL_LIBRARY} ${OPENSSL_CRYPTO_LIBRARY})

    set(CURL_INCLUDE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/deps/curl-arm64/include")
    set(CURL_LIBRARY "${CMAKE_CURRENT_SOURCE_DIR}/deps/curl-arm64/lib/libcurl.lib")

    set(NLOHMANN_JSON_INCLUDE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/deps/nlohmann-json-arm64/include")
    include_directories(${NLOHMANN_JSON_INCLUDE_DIR})

    set(WEBVIEW2_INCLUDE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/deps/webview2-arm64-static/include")
    set(WEBVIEW2_LIBRARY "${CMAKE_CURRENT_SOURCE_DIR}/deps/webview2-arm64-static/lib/WebView2LoaderStatic.lib")
    include_directories(${WEBVIEW2_INCLUDE_DIR})

    set(WIL_INCLUDE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/deps/wil-src/include")
    include_directories(${WIL_INCLUDE_DIR})

    include_directories(${OPENSSL_INCLUDE_DIR})
    include_directories(${CURL_INCLUDE_DIR})
else()
    find_package(OpenSSL REQUIRED)
    find_package(CURL REQUIRED)
    find_package(nlohmann_json CONFIG REQUIRED)
    find_package(unofficial-webview2 CONFIG REQUIRED)
endif()

set(SOURCES
        src/main.cpp
        stremio.rc
        src/core/globals.h
        src/core/globals.cpp
        src/utils/helpers.h
        src/utils/helpers.cpp
        src/utils/config.h
        src/utils/config.cpp
        src/utils/crashlog.h
        src/utils/crashlog.cpp
        src/mpv/player.h
        src/mpv/player.cpp
        src/node/server.cpp
        src/node/server.h
        src/tray/tray.h
        src/tray/tray.cpp
        src/ui/splash.h
        src/ui/splash.cpp
        src/updater/updater.cpp
        src/updater/updater.h
        src/webview/webview.h
        src/webview/webview.cpp
        src/ui/mainwindow.h
        src/ui/mainwindow.cpp
        src/resource.h
        src/utils/extensions.cpp
        src/utils/extensions.h
        src/utils/discord.cpp
        src/utils/discord.h
)

add_executable(${PROJECT_NAME} WIN32 ${SOURCES})


if(ARM64_BUILD)
    target_link_libraries(${PROJECT_NAME} PRIVATE
            gdiplus.lib
            dwmapi.lib
            Shcore.lib
            Msimg32.lib
            winhttp.lib
            shlwapi.lib
            Crypt32.lib
            ws2_32.lib
            wldap32.lib
            normaliz.lib
            bcrypt.lib
            Iphlpapi.lib
            ${OPENSSL_SSL_LIBRARY}
            ${OPENSSL_CRYPTO_LIBRARY}
            ${CURL_LIBRARY}
            ${WEBVIEW2_LIBRARY}
            ${MPV_LIBRARY}
            ${DISCORD_LIB}
    )
else()
    target_link_libraries(${PROJECT_NAME} PRIVATE
            gdiplus.lib
            dwmapi.lib
            Shcore.lib
            Msimg32.lib
            winhttp.lib
            shlwapi.lib
            nlohmann_json::nlohmann_json
            unofficial::webview2::webview2
            OpenSSL::SSL
            OpenSSL::Crypto
            CURL::libcurl
            ${MPV_LIBRARY}
            ${DISCORD_LIB}
    )
endif()

target_compile_definitions(${PROJECT_NAME} PRIVATE DEBUG_LOG)
if(ARM64_BUILD)
    target_compile_definitions(${PROJECT_NAME} PRIVATE CURL_STATICLIB)
endif()

# Copy MPV DLL
add_custom_command(TARGET ${PROJECT_NAME} POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E copy_if_different
        "${MPV_DLL}"
        $<TARGET_FILE_DIR:${PROJECT_NAME}>
)