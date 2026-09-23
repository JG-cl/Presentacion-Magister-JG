@echo off
echo ===============================
echo   Convirtiendo SVG -> PDF
echo ===============================
echo.

for %%f in (*.svg) do (
    echo Convirtiendo %%~nxf...
    "C:\Program Files\Inkscape\bin\inkscape.exe" "%%f" --export-area-drawing --export-type=pdf
)

echo.
echo ===============================
echo   Conversion finalizada
echo ===============================
pause