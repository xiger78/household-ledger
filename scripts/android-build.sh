#!/bin/bash
set -euo pipefail

export PATH="$HOME/.nodebrew/node/v20.18.0/bin:$PATH"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export JAVA_HOME="${JAVA_HOME:-$HOME/.jdks/jdk-17.0.19+10/Contents/Home}"

cd "$(dirname "$0")/.."

echo "Node: $(node -v)"
echo "Java: $($JAVA_HOME/bin/java -version 2>&1 | head -1)"
echo "Android SDK: $ANDROID_HOME"

cd android
./gradlew assembleDebug "$@"

APK="app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK" ]; then
  echo ""
  echo "APK 생성 완료: $(pwd)/$APK"
fi
