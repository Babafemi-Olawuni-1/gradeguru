$srcDir = 'C:\xampp\htdocs\gradeguru\frontend'
$files  = Get-ChildItem -Path $srcDir -Recurse -Include '*.jsx','*.js','*.css','*.html'
$count  = 0

foreach ($f in $files) {
    $txt = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
    $new = $txt
    $new = $new.Replace('GradeGuru',              'ExclusiveGrade')
    $new = $new.Replace('Grade<span>Guru</span>', 'Exclusive<span>Grade</span>')
    $new = $new.Replace('gradeguru.com/s/',        'exclusivegrade.com/s/')
    $new = $new.Replace('gradeguru.com/<b>',       'exclusivegrade.com/<b>')
    $new = $new.Replace('gradeguru.com/yourschool','exclusivegrade.com/yourschool')
    $new = $new.Replace('gradeguru.com/schoolname','exclusivegrade.com/schoolname')
    $new = $new.Replace('hello@gradeguru.com',     'hello@exclusivegrade.com')
    $new = $new.Replace('support@gradeguru.com',   'support@exclusivegrade.com')
    $new = $new.Replace('privacy@gradeguru.com',   'privacy@exclusivegrade.com')

    if ($new -ne $txt) {
        [System.IO.File]::WriteAllText($f.FullName, $new, [System.Text.Encoding]::UTF8)
        Write-Host "Updated: $($f.Name)"
        $count++
    }
}

Write-Host ""
Write-Host "Done. $count file(s) updated."
