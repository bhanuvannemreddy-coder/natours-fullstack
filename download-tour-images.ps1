$ErrorActionPreference = "Stop"

$folder = Join-Path $PSScriptRoot "public\img\tours"

if (!(Test-Path $folder)) {
    New-Item -ItemType Directory -Path $folder -Force | Out-Null
}

$images = @{
    "tour-1.jpg"  = "https://picsum.photos/seed/natours-tour-1/1200/800"
    "tour-2.jpg"  = "https://picsum.photos/seed/natours-tour-2/1200/800"
    "tour-3.jpg"  = "https://picsum.photos/seed/natours-tour-3/1200/800"
    "tour-4.jpg"  = "https://picsum.photos/seed/natours-tour-4/1200/800"
    "tour-5.jpg"  = "https://picsum.photos/seed/natours-tour-5/1200/800"
    "tour-6.jpg"  = "https://picsum.photos/seed/natours-tour-6/1200/800"
    "tour-7.jpg"  = "https://picsum.photos/seed/natours-tour-7/1200/800"
    "tour-8.jpg"  = "https://picsum.photos/seed/natours-tour-8/1200/800"
    "tour-9.jpg"  = "https://picsum.photos/seed/natours-tour-9/1200/800"
    "tour-10.jpg" = "https://picsum.photos/seed/natours-tour-10/1200/800"
    "tour-11.jpg" = "https://picsum.photos/seed/natours-tour-11/1200/800"
}

foreach ($item in $images.GetEnumerator()) {

    $out = Join-Path $folder $item.Key

    Write-Host "Downloading $($item.Key)..."

    try {
        Invoke-WebRequest `
            -Uri $item.Value `
            -OutFile $out `
            -MaximumRedirection 10 `
            -UseBasicParsing

        Write-Host "Downloaded $($item.Key)" -ForegroundColor Green
    }
    catch {
        Write-Host "FAILED: $($item.Key)" -ForegroundColor Red
        Write-Host $_.Exception.Message
    }
}

Write-Host ""
Write-Host "Finished downloading tour images." -ForegroundColor Cyan
Write-Host "Images are located in: $folder"