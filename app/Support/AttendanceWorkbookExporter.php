<?php

namespace App\Support;

use App\Models\Attendance;
use App\Models\Event;
use App\Models\Profile;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;
use ZipArchive;

class AttendanceWorkbookExporter
{
    private ?int $eventId = null;
    private ?string $from = null;
    private ?string $to = null;

    public function withFilters(?int $eventId = null, ?string $from = null, ?string $to = null): self
    {
        $this->eventId = $eventId;
        $this->from = $from;
        $this->to = $to;

        return $this;
    }

    public function storeTemporaryXlsx(): string
    {
        $sheets = $this->buildSheets();
        $temporaryPath = tempnam(sys_get_temp_dir(), 'attendance-xlsx-');

        if ($temporaryPath === false) {
            throw new RuntimeException('Gagal menyiapkan file export Excel sementara.');
        }

        $archive = new ZipArchive();
        $result = $archive->open($temporaryPath, ZipArchive::CREATE | ZipArchive::OVERWRITE);

        if ($result !== true) {
            @unlink($temporaryPath);
            throw new RuntimeException('Gagal membuka arsip Excel untuk proses export.');
        }

        $archive->addFromString('[Content_Types].xml', $this->renderContentTypes(count($sheets)));
        $archive->addFromString('_rels/.rels', $this->renderRootRelationships());
        $archive->addFromString('docProps/app.xml', $this->renderAppProperties($sheets));
        $archive->addFromString('docProps/core.xml', $this->renderCoreProperties());
        $archive->addFromString('xl/workbook.xml', $this->renderWorkbook($sheets));
        $archive->addFromString('xl/_rels/workbook.xml.rels', $this->renderWorkbookRelationships($sheets));
        $archive->addFromString('xl/styles.xml', $this->renderStyles());

        foreach ($sheets as $index => $sheet) {
            $archive->addFromString(
                'xl/worksheets/sheet'.($index + 1).'.xml',
                $this->renderWorksheet($sheet),
            );
        }

        $archive->close();

        return $temporaryPath;
    }

    /**
     * @return array<int, array{name: string, headers: array<int, string>, rows: array<int, array<int, string>>}>
     */
    private function buildSheets(): array
    {
        $events = $this->resolveEvents();

        $sheets = [];
        $sheets[] = $this->buildSummarySheet($events);

        foreach ($events as $event) {
            $sheets[] = $this->buildEventSheet($event);
        }

        $sheets[] = $this->buildIndividualRecapSheet($events);

        if (count($events) === 0) {
            // Fallback: legacy "today" snapshot when no event data exists.
            $sheets[] = $this->buildLegacyTodaySheet();
        }

        return $this->ensureUniqueWorksheetNames($sheets);
    }

    /**
     * @return Collection<int, Event>
     */
    private function resolveEvents(): Collection
    {
        $query = Event::query()->orderBy('tanggal_mulai')->orderBy('id');

        if ($this->eventId) {
            $query->where('id', $this->eventId);
        } else {
            if ($this->from) {
                $query->whereDate('tanggal_mulai', '>=', $this->from);
            }
            if ($this->to) {
                $query->whereDate('tanggal_selesai', '<=', $this->to);
            }
        }

        return $query->get();
    }

    /**
     * @param Collection<int, Event> $events
     * @return array{name: string, headers: array<int, string>, rows: array<int, array<int, string>>}
     */
    private function buildSummarySheet(Collection $events): array
    {
        $rows = $events->map(function (Event $event): array {
            $stats = $this->statusCounts($event->id);

            return [
                $event->nama_kegiatan,
                optional($event->tanggal_mulai)->format('Y-m-d') ?? '-',
                (string) $stats[Attendance::STATUS_HADIR],
                (string) $stats[Attendance::STATUS_TERLAMBAT],
                (string) $stats[Attendance::STATUS_IZIN],
                (string) $stats[Attendance::STATUS_SAKIT],
                (string) $stats[Attendance::STATUS_ALPHA],
                ucfirst((string) $event->status),
            ];
        })->all();

        return [
            'name' => 'Ringkasan',
            'headers' => ['Event', 'Tanggal', 'Hadir', 'Terlambat', 'Izin', 'Sakit', 'Alpha', 'Status Event'],
            'rows' => $rows,
        ];
    }

    /**
     * @return array{name: string, headers: array<int, string>, rows: array<int, array<int, string>>}
     */
    private function buildEventSheet(Event $event): array
    {
        // Pull only ACTIVE records — revoked rows are not represented in
        // the per-event export so the row reflects the current source of
        // truth. (A user with a revoked + a fresh active record shows
        // the active one; a user with only a revoked record is "Belum Hadir".)
        $attendances = Attendance::query()
            ->with('user.profile')
            ->where('event_id', $event->id)
            ->whereIn('status', Attendance::ACTIVE_STATUSES)
            ->get()
            ->keyBy('user_id');

        $memberQuery = Profile::query();
        if ($event->departemen) {
            $memberQuery->where('departemen', $event->departemen);
        }

        $rows = $memberQuery
            ->orderBy('departemen')
            ->orderBy('nama')
            ->get()
            ->map(function (Profile $profile) use ($attendances): array {
                $attendance = $attendances->get($profile->user_id);

                return [
                    $profile->nama,
                    $profile->nim,
                    (string) $profile->departemen,
                    (string) $profile->jabatan,
                    $attendance ? ucfirst($attendance->status) : 'Belum Hadir',
                    $attendance && $attendance->check_in_time
                        ? $attendance->check_in_time->format('d M Y, H:i')
                        : '-',
                    (string) ($attendance?->alasan ?? '-'),
                ];
            })
            ->all();

        return [
            'name' => $event->nama_kegiatan.' ('.optional($event->tanggal_mulai)->format('d-m-Y').')',
            'headers' => ['Nama', 'NIM', 'Departemen', 'Jabatan', 'Status', 'Check-in', 'Alasan'],
            'rows' => $rows,
        ];
    }

    /**
     * @param Collection<int, Event> $events
     * @return array{name: string, headers: array<int, string>, rows: array<int, array<int, string>>}
     */
    private function buildIndividualRecapSheet(Collection $events): array
    {
        $eventIds = $events->pluck('id');

        $attendanceQuery = Attendance::query();
        if ($eventIds->isNotEmpty()) {
            $attendanceQuery->whereIn('event_id', $eventIds);
        }

        $byUser = $attendanceQuery
            ->select('user_id', 'status')
            ->get()
            ->groupBy('user_id');

        $totalEvents = $events->count();

        $rows = Profile::query()
            ->orderBy('departemen')
            ->orderBy('nama')
            ->get()
            ->map(function (Profile $profile) use ($byUser, $totalEvents): array {
                $records = $byUser->get($profile->user_id, collect());

                $hadir = $records->where('status', Attendance::STATUS_HADIR)->count();
                $terlambat = $records->where('status', Attendance::STATUS_TERLAMBAT)->count();
                $izin = $records->where('status', Attendance::STATUS_IZIN)->count();
                $sakit = $records->where('status', Attendance::STATUS_SAKIT)->count();
                $alpha = $records->where('status', Attendance::STATUS_ALPHA)->count();

                $present = $hadir + $terlambat;
                $percentage = $totalEvents > 0
                    ? round(($present / $totalEvents) * 100, 1)
                    : 0;

                return [
                    $profile->nama,
                    $profile->nim,
                    (string) $profile->departemen,
                    (string) $profile->jabatan,
                    (string) $hadir,
                    (string) $terlambat,
                    (string) $izin,
                    (string) $sakit,
                    (string) $alpha,
                    $percentage.'%',
                ];
            })
            ->all();

        return [
            'name' => 'Rekap Individu',
            'headers' => ['Nama', 'NIM', 'Departemen', 'Jabatan', 'Hadir', 'Terlambat', 'Izin', 'Sakit', 'Alpha', '% Kehadiran'],
            'rows' => $rows,
        ];
    }

    /**
     * @return array{name: string, headers: array<int, string>, rows: array<int, array<int, string>>}
     */
    private function buildLegacyTodaySheet(): array
    {
        $profiles = Profile::query()
            ->select('user_id', 'nama', 'nim', 'departemen', 'jabatan')
            ->orderBy('departemen')
            ->orderBy('nama')
            ->get();

        $presentUserIds = Attendance::query()
            ->whereDate('check_in_time', today())
            ->whereIn('status', Attendance::ACTIVE_STATUSES)
            ->distinct()
            ->pluck('user_id')
            ->flip();

        $rows = $profiles->map(function (Profile $profile) use ($presentUserIds): array {
            return [
                $profile->nama,
                $profile->nim,
                (string) $profile->departemen,
                (string) $profile->jabatan,
                $presentUserIds->has($profile->user_id) ? 'Hadir' : 'Belum Hadir',
            ];
        })->all();

        return [
            'name' => 'Snapshot Hari Ini',
            'headers' => ['Nama', 'NIM', 'Departemen', 'Jabatan', 'Status'],
            'rows' => $rows,
        ];
    }

    /**
     * @return array<string, int>
     */
    private function statusCounts(int $eventId): array
    {
        $counts = Attendance::query()
            ->select('status', DB::raw('COUNT(*) as total'))
            ->where('event_id', $eventId)
            ->groupBy('status')
            ->pluck('total', 'status');

        return [
            Attendance::STATUS_HADIR => (int) ($counts[Attendance::STATUS_HADIR] ?? 0),
            Attendance::STATUS_TERLAMBAT => (int) ($counts[Attendance::STATUS_TERLAMBAT] ?? 0),
            Attendance::STATUS_IZIN => (int) ($counts[Attendance::STATUS_IZIN] ?? 0),
            Attendance::STATUS_SAKIT => (int) ($counts[Attendance::STATUS_SAKIT] ?? 0),
            Attendance::STATUS_ALPHA => (int) ($counts[Attendance::STATUS_ALPHA] ?? 0),
        ];
    }

    private function renderContentTypes(int $sheetCount): string
    {
        $worksheetOverrides = collect(range(1, $sheetCount))
            ->map(
                fn (int $index): string => '<Override PartName="/xl/worksheets/sheet'.$index
                    .'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>',
            )
            ->implode('');

        return <<<XML
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  {$worksheetOverrides}
</Types>
XML;
    }

    private function renderRootRelationships(): string
    {
        return <<<XML
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>
XML;
    }

    /**
     * @param array<int, array{name: string, headers: array<int, string>, rows: array<int, array<int, string>>}> $sheets
     */
    private function renderAppProperties(array $sheets): string
    {
        $sheetTitles = collect($sheets)
            ->map(
                fn (array $sheet): string => '<vt:lpstr>'.$this->escape($sheet['name']).'</vt:lpstr>',
            )
            ->implode('');
        $sheetCount = count($sheets);

        return <<<XML
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"
 xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Laravel</Application>
  <DocSecurity>0</DocSecurity>
  <ScaleCrop>false</ScaleCrop>
  <HeadingPairs>
    <vt:vector size="2" baseType="variant">
      <vt:variant><vt:lpstr>Worksheets</vt:lpstr></vt:variant>
      <vt:variant><vt:i4>{$sheetCount}</vt:i4></vt:variant>
    </vt:vector>
  </HeadingPairs>
  <TitlesOfParts>
    <vt:vector size="{$sheetCount}" baseType="lpstr">{$sheetTitles}</vt:vector>
  </TitlesOfParts>
  <Company></Company>
  <LinksUpToDate>false</LinksUpToDate>
  <SharedDoc>false</SharedDoc>
  <HyperlinksChanged>false</HyperlinksChanged>
  <AppVersion>1.0</AppVersion>
</Properties>
XML;
    }

    private function renderCoreProperties(): string
    {
        $timestamp = now()->utc()->format('Y-m-d\TH:i:s\Z');

        return <<<XML
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
 xmlns:dc="http://purl.org/dc/elements/1.1/"
 xmlns:dcterms="http://purl.org/dc/terms/"
 xmlns:dcmitype="http://purl.org/dc/dcmitype/"
 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:creator>Sistem Absensi</dc:creator>
  <cp:lastModifiedBy>Sistem Absensi</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">{$timestamp}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">{$timestamp}</dcterms:modified>
</cp:coreProperties>
XML;
    }

    /**
     * @param array<int, array{name: string, headers: array<int, string>, rows: array<int, array<int, string>>}> $sheets
     */
    private function renderWorkbook(array $sheets): string
    {
        $worksheets = collect($sheets)
            ->values()
            ->map(function (array $sheet, int $index): string {
                $sheetName = $this->escape($sheet['name']);
                $sheetId = $index + 1;

                return '<sheet name="'.$sheetName.'" sheetId="'.$sheetId.'" r:id="rId'.$sheetId.'"/>';
            })
            ->implode('');

        return <<<XML
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <bookViews>
    <workbookView xWindow="240" yWindow="15" windowWidth="16095" windowHeight="9660"/>
  </bookViews>
  <sheets>{$worksheets}</sheets>
</workbook>
XML;
    }

    /**
     * @param array<int, array{name: string, headers: array<int, string>, rows: array<int, array<int, string>>}> $sheets
     */
    private function renderWorkbookRelationships(array $sheets): string
    {
        $worksheetRelationships = collect($sheets)
            ->values()
            ->map(function (array $sheet, int $index): string {
                $relationshipId = $index + 1;

                return '<Relationship Id="rId'.$relationshipId
                    .'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'
                    .$relationshipId.'.xml"/>';
            })
            ->implode('');

        $styleRelationshipId = count($sheets) + 1;

        return <<<XML
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  {$worksheetRelationships}
  <Relationship Id="rId{$styleRelationshipId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>
XML;
    }

    private function renderStyles(): string
    {
        return <<<XML
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font>
      <sz val="11"/>
      <name val="Calibri"/>
    </font>
    <font>
      <b/>
      <color rgb="FFFFFFFF"/>
      <sz val="11"/>
      <name val="Calibri"/>
    </font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill>
      <patternFill patternType="solid">
        <fgColor rgb="FF0F172A"/>
        <bgColor indexed="64"/>
      </patternFill>
    </fill>
  </fills>
  <borders count="2">
    <border>
      <left/><right/><top/><bottom/><diagonal/>
    </border>
    <border>
      <left style="thin"><color auto="1"/></left>
      <right style="thin"><color auto="1"/></right>
      <top style="thin"><color auto="1"/></top>
      <bottom style="thin"><color auto="1"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1">
      <alignment vertical="center"/>
    </xf>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment vertical="center"/>
    </xf>
  </cellXfs>
  <cellStyles count="1">
    <cellStyle name="Normal" xfId="0" builtinId="0"/>
  </cellStyles>
</styleSheet>
XML;
    }

    /**
     * @param array<int, array{name: string, headers: array<int, string>, rows: array<int, array<int, string>>}> $sheets
     * @return array<int, array{name: string, headers: array<int, string>, rows: array<int, array<int, string>>}>
     */
    private function ensureUniqueWorksheetNames(array $sheets): array
    {
        $usedNames = [];

        return array_map(function (array $sheet) use (&$usedNames): array {
            $baseName = $this->sanitizeWorksheetName($sheet['name']);
            $candidateName = $baseName;
            $suffix = 2;

            while (isset($usedNames[Str::lower($candidateName)])) {
                $suffixLabel = " ({$suffix})";
                $trimmedBase = (string) str($baseName)->substr(0, 31 - strlen($suffixLabel));
                $candidateName = rtrim($trimmedBase).$suffixLabel;
                $suffix++;
            }

            $usedNames[Str::lower($candidateName)] = true;
            $sheet['name'] = $candidateName;

            return $sheet;
        }, $sheets);
    }

    private function sanitizeWorksheetName(string $name): string
    {
        $cleanName = preg_replace('/[:\\\\\\/\\?\\*\\[\\]]/', ' ', $name);
        $cleanName = preg_replace('/\\s+/', ' ', (string) $cleanName);
        $cleanName = trim((string) $cleanName);

        if ($cleanName === '') {
            $cleanName = 'Sheet';
        }

        return (string) str($cleanName)->substr(0, 31);
    }

    /**
     * @param array{name: string, headers: array<int, string>, rows: array<int, array<int, string>>} $sheet
     */
    private function renderWorksheet(array $sheet): string
    {
        $rows = [$this->renderRow($sheet['headers'], 1, 1)];

        foreach ($sheet['rows'] as $index => $row) {
            $rows[] = $this->renderRow($row, $index + 2, 0);
        }

        $rowCount = count($sheet['rows']) + 1;
        $columnCount = count($sheet['headers']);
        $dimension = 'A1:'.$this->columnLetterFromIndex(max($columnCount, 1)).max($rowCount, 1);
        $columns = $this->renderColumnWidths($sheet);
        $rowsXml = implode('', $rows);

        return <<<XML
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="{$dimension}"/>
  <sheetViews>
    <sheetView workbookViewId="0"/>
  </sheetViews>
  <sheetFormatPr defaultRowHeight="18"/>
  <cols>{$columns}</cols>
  <sheetData>{$rowsXml}</sheetData>
</worksheet>
XML;
    }

    /**
     * @param array<int, string> $cells
     */
    private function renderRow(array $cells, int $rowNumber, int $styleIndex): string
    {
        $cellsXml = collect($cells)
            ->values()
            ->map(function (string $cell, int $index) use ($rowNumber, $styleIndex): string {
                $value = $this->escape($cell);
                $cellReference = $this->columnLetterFromIndex($index + 1).$rowNumber;

                return '<c r="'.$cellReference.'" s="'.$styleIndex.'" t="inlineStr"><is><t xml:space="preserve">'
                    .$value.'</t></is></c>';
            })
            ->implode('');

        return '<row r="'.$rowNumber.'">'.$cellsXml.'</row>';
    }

    /**
     * @param array{name: string, headers: array<int, string>, rows: array<int, array<int, string>>} $sheet
     */
    private function renderColumnWidths(array $sheet): string
    {
        $rows = [$sheet['headers'], ...$sheet['rows']];
        $columnCount = count($sheet['headers']);
        $columns = [];

        for ($columnIndex = 0; $columnIndex < $columnCount; $columnIndex++) {
            $maxLength = collect($rows)
                ->map(fn (array $row): int => Str::length($row[$columnIndex] ?? ''))
                ->max();

            $width = min(max(($maxLength ?? 10) + 4, 12), 32);
            $columnNumber = $columnIndex + 1;
            $columns[] = '<col min="'.$columnNumber.'" max="'.$columnNumber.'" width="'.$width.'" customWidth="1"/>';
        }

        return implode('', $columns);
    }

    private function columnLetterFromIndex(int $index): string
    {
        $letters = '';

        while ($index > 0) {
            $index--;
            $letters = chr(65 + ($index % 26)).$letters;
            $index = intdiv($index, 26);
        }

        return $letters;
    }

    private function escape(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES | ENT_XML1, 'UTF-8');
    }
}
