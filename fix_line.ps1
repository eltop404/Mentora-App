$file = 'E:\نبض-التاريخ\src\App.tsx'
$bytes = [System.IO.File]::ReadAllBytes($file)
$content = [System.Text.Encoding]::UTF8.GetString($bytes)

# The broken line has: message: استخراج: ${nidResult.dob}` })
# We need:            message: `استخراج: ${nidResult.dob}` })

$broken = "message: " + [char]0x0627 + [char]0x0633 + [char]0x062A + [char]0x062E + [char]0x0631 + [char]0x0627 + [char]0x062C + ": `${nidResult.dob}`"
$fixed  = "message: ``" + [char]0x0627 + [char]0x0633 + [char]0x062A + [char]0x062E + [char]0x0631 + [char]0x0627 + [char]0x062C + ": `${nidResult.dob}``"

Write-Host "Looking for pattern on line 2988..."
$lines = $content -split "`r`n"
$line2988 = $lines[2987]
Write-Host "Line 2988 content: $line2988"

# Check if the backtick is missing before the Arabic word
if ($line2988 -match 'message: [^\x60]' -and $line2988 -match '\u0627\u0633\u062A\u062E\u0631\u0627\u062C') {
    Write-Host "FOUND broken template literal"
    # Replace: message: استخراج  =>  message: `استخراج
    $fixedLine = $line2988 -replace 'message: (\u0627\u0633\u062A\u062E\u0631\u0627\u062C)', 'message: `$1'
    $lines[2987] = $fixedLine
    $newContent = $lines -join "`r`n"
    $newBytes = [System.Text.Encoding]::UTF8.GetBytes($newContent)
    [System.IO.File]::WriteAllBytes($file, $newBytes)
    Write-Host "FIXED!"
} else {
    Write-Host "Pattern not found or already fixed"
}
