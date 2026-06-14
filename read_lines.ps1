$f = 'd:\نبض-التاريخ\src\components\admin\CourseManagement.tsx'
$lines = [System.IO.File]::ReadAllLines($f, [System.Text.Encoding]::UTF8)
$start = 475
$end = 492
foreach ($i in ($start..$end)) {
    ($i + 1).ToString() + ': ' + $lines[$i]
}
