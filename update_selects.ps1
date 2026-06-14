$files = Get-ChildItem -Path "e:\نبض-التاريخ\src\components\admin" -Filter "*Management.tsx"
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $content = $content -replace '(<select[^>]*?)(\s+value=\{[^}]*\.(?:stage|year|specialization)\})', '$1 disabled={DB.getAdminSession()?.role === ''SUB_ADMIN''}$2'
    Set-Content -Path $file.FullName -Value $content
}
