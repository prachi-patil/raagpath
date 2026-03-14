// gen-day3.js — RaagPath Day 3 Deep-Dive Document Generator
// Run: node gen-day3.js

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, LevelFormat, PageBreak,
  ExternalHyperlink, TableOfContents
} = require('docx');
const fs = require('fs');

// ── Colours ───────────────────────────────────────────────────────────────────
const SAFFRON   = "FF6600";   // RaagPath brand saffron
const DARK_BLUE = "1A2E5A";   // deep navy for headings
const MID_BLUE  = "2E6DA4";   // sub-heading blue
const LIGHT_BG  = "FFF4E8";   // saffron tint for callouts
const CODE_BG   = "F3F3F3";   // light grey for code blocks
const GREEN_BG  = "E8F5E9";   // success/complete
const AMBER_BG  = "FFF3CD";   // warning
const BORDER_C  = "CCCCCC";
const SAFFRON_H = "FF6600";   // header rule colour

// ── Helpers ───────────────────────────────────────────────────────────────────
const border = (col = BORDER_C) => ({ style: BorderStyle.SINGLE, size: 1, color: col });
const allBorders = (col) => ({ top: border(col), bottom: border(col), left: border(col), right: border(col) });

function h(level, text, color = DARK_BLUE) {
  return new Paragraph({
    heading: level,
    spacing: { before: level === HeadingLevel.HEADING_1 ? 320 : 240, after: 120 },
    children: [new TextRun({ text, color, bold: true })]
  });
}

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 60, after: 120 },
    children: [new TextRun({ text, size: 22, ...opts })]
  });
}

function pRich(...runs) {
  return new Paragraph({
    spacing: { before: 60, after: 120 },
    children: runs
  });
}

function run(text, opts = {}) {
  return new TextRun({ text, size: 22, ...opts });
}

function bullet(text, bold_prefix = null) {
  const children = bold_prefix
    ? [new TextRun({ text: bold_prefix, bold: true, size: 22 }), new TextRun({ text, size: 22 })]
    : [new TextRun({ text, size: 22 })];
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { before: 40, after: 40 },
    children
  });
}

function sub_bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 1 },
    spacing: { before: 30, after: 30 },
    children: [new TextRun({ text, size: 20 })]
  });
}

function codeBlock(lines) {
  return lines.map((line, i) => new Paragraph({
    spacing: { before: i === 0 ? 60 : 0, after: i === lines.length - 1 ? 60 : 0 },
    shading: { fill: CODE_BG, type: ShadingType.CLEAR },
    border: i === 0
      ? { top: border("AAAAAA"), left: border("AAAAAA"), right: border("AAAAAA") }
      : i === lines.length - 1
        ? { bottom: border("AAAAAA"), left: border("AAAAAA"), right: border("AAAAAA") }
        : { left: border("AAAAAA"), right: border("AAAAAA") },
    indent: { left: 360 },
    children: [new TextRun({ text: line, font: "Courier New", size: 18, color: "1A1A1A" })]
  }));
}

function callout(label, text, bg = LIGHT_BG, labelColor = SAFFRON) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [new TableRow({ children: [new TableCell({
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: labelColor },
        bottom: border(BORDER_C), left: border(BORDER_C), right: border(BORDER_C)
      },
      shading: { fill: bg, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 160, right: 160 },
      width: { size: 9360, type: WidthType.DXA },
      children: [
        new Paragraph({ spacing: { before: 0, after: 60 }, children: [
          new TextRun({ text: `${label}  `, bold: true, size: 20, color: labelColor }),
          new TextRun({ text, size: 20 })
        ]})
      ]
    })]})],
  });
}

function sectionTable(rows, colWidths) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: rows.map((r, ri) => new TableRow({
      tableHeader: ri === 0,
      children: r.map((cell, ci) => new TableCell({
        borders: allBorders(BORDER_C),
        shading: {
          fill: ri === 0 ? "2E6DA4" : ci === 0 ? "F0F4F8" : "FFFFFF",
          type: ShadingType.CLEAR
        },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        width: { size: colWidths[ci], type: WidthType.DXA },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ children: [
          new TextRun({ text: cell, bold: ri === 0, size: ri === 0 ? 20 : 20,
            color: ri === 0 ? "FFFFFF" : "000000" })
        ]})]
      }))
    }))
  });
}

function spacer(sz = 120) {
  return new Paragraph({ spacing: { before: sz, after: 0 }, children: [] });
}

function hr() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: SAFFRON, space: 1 } },
    spacing: { before: 160, after: 160 },
    children: []
  });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

// ── Document ──────────────────────────────────────────────────────────────────
const doc = new Document({

  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: "\u2022",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
          { level: 1, format: LevelFormat.BULLET, text: "\u25E6",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1080, hanging: 360 } } } }
        ]
      }
    ]
  },

  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Arial", color: DARK_BLUE },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: MID_BLUE },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: "333333" },
        paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 } },
    ]
  },

  sections: [{

    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },

    headers: {
      default: new Header({ children: [
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: SAFFRON_H, space: 1 } },
          children: [
            new TextRun({ text: "RaagPath MVP", bold: true, size: 20, color: SAFFRON }),
            new TextRun({ text: "    Day 3 Deep-Dive — Swara Trainer Core", size: 18, color: "555555" }),
            new TextRun({ text: "\t", size: 18 }),
            new TextRun({ text: "Confidential", size: 18, color: "AAAAAA" })
          ],
          tabStops: [{ type: "right", position: 9360 }]
        })
      ]})
    },

    footers: {
      default: new Footer({ children: [
        new Paragraph({
          border: { top: { style: BorderStyle.SINGLE, size: 2, color: BORDER_C, space: 1 } },
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "RaagPath Phase 1 — Internal Engineering Doc · Page ", size: 18, color: "888888" }),
            new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "888888" }),
            new TextRun({ text: " of ", size: 18, color: "888888" }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: "888888" })
          ]
        })
      ]})
    },

    children: [

      // ══════════════════════════════════════════════════════════════
      // COVER
      // ══════════════════════════════════════════════════════════════
      new Paragraph({
        spacing: { before: 480, after: 80 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "RaagPath", bold: true, size: 72, color: SAFFRON })]
      }),
      new Paragraph({
        spacing: { before: 0, after: 80 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Phase 1 MVP — Engineering Deep-Dive", size: 32, color: "444444" })]
      }),
      new Paragraph({
        spacing: { before: 80, after: 480 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Day 3: Swara Trainer Core", bold: true, size: 44, color: DARK_BLUE })]
      }),

      // Meta table
      new Table({
        width: { size: 6000, type: WidthType.DXA },
        columnWidths: [2400, 3600],
        rows: [
          ["Day", "Day 3 — Thursday"],
          ["Theme", "Swara Trainer — Core"],
          ["Hours", "~6 hrs"],
          ["Goal", "Sing a swara → see it detected correctly in browser"],
          ["Status", "COMPLETE — Deployed to EC2"],
          ["Modules", "3.1 Mic Input · 3.2 Smoothing · 3.3 Swara Map · 3.4 Tanpura · 3.5 Sur Meter · 3.6 Display"],
        ].map((r, ri) => new TableRow({ children: r.map((cell, ci) => new TableCell({
          borders: allBorders(BORDER_C),
          shading: { fill: ci === 0 ? "F0F4F8" : "FFFFFF", type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          width: { size: [2400, 3600][ci], type: WidthType.DXA },
          children: [new Paragraph({ children: [new TextRun({
            text: cell, size: 20, bold: ci === 0, color: ci === 0 ? MID_BLUE : "000000"
          })] })]
        }))}))
      }),

      spacer(320),
      pageBreak(),

      // ══════════════════════════════════════════════════════════════
      // SECTION 1 — Overview
      // ══════════════════════════════════════════════════════════════
      h(HeadingLevel.HEADING_1, "1. Day 3 Overview"),
      p("Day 3 is where RaagPath becomes a real product. The goal was to enable a user to sing a swara and " +
        "have the browser detect it accurately in real time — with pitch detection, visual feedback, and a " +
        "tanpura drone to sing against."),
      p("Six submodules were implemented, and three supporting files were added. Both frontend and backend were " +
        "deployed via the GitHub Actions CI/CD pipeline established on Day 2."),

      spacer(),
      callout("Goal Achieved", "A user can visit /practice, select a shruti, start the tanpura drone, " +
        "and sing Sa — the SurMeter animates and the target swara lights up green when they are on pitch.", GREEN_BG, "2E7D32"),
      spacer(),

      h(HeadingLevel.HEADING_2, "1.1 Packages Added"),
      sectionTable([
        ["Package", "Version", "Purpose"],
        ["pitchy", "^4.1.0", "McLeod Pitch Method — real-time Hz detection from mic buffer"],
        ["tone", "^15.1.22", "Web Audio synthesis framework — generates tanpura drone oscillators"],
      ], [2000, 2000, 5360]),

      spacer(160),

      h(HeadingLevel.HEADING_2, "1.2 Files Created"),
      sectionTable([
        ["File", "Type", "Purpose"],
        ["src/lib/pitch.ts", "Frontend", "PitchEngine class — wraps Web Audio API + Pitchy"],
        ["src/lib/swara.ts", "Frontend", "Pure utility — Hz → swara mapping, shruti transposition"],
        ["src/lib/tanpura.ts", "Frontend", "TanpuraEngine class — Sa-Pa-Sa-Ni drone via Tone.js"],
        ["src/components/SurMeter.tsx", "Frontend", "Animated pitch accuracy needle (±60¢)"],
        ["src/components/SwaraDisplay.tsx", "Frontend", "Target + detected swara circles with on-pitch pulse"],
        ["src/app/practice/page.tsx", "Frontend", "Main practice page — wires all engines and components"],
        ["src/main/java/…/config/SpaWebConfig.java", "Backend", "Spring Boot SPA routing fix — /practice → /practice/index.html"],
      ], [3200, 1400, 4760]),

      spacer(160),
      pageBreak(),

      // ══════════════════════════════════════════════════════════════
      // SECTION 2 — Submodule 3.1: Mic Input + Pitchy
      // ══════════════════════════════════════════════════════════════
      h(HeadingLevel.HEADING_1, "2. Submodule 3.1 — Mic Input + Pitchy"),
      h(HeadingLevel.HEADING_2, "2.1 What Was Built"),
      p("The PitchEngine class (src/lib/pitch.ts) encapsulates the entire real-time pitch detection pipeline. " +
        "It is intentionally browser-only — only instantiate inside useEffect or event handlers, never at module " +
        "load time or in server-side rendering context."),

      h(HeadingLevel.HEADING_2, "2.2 Signal Chain"),
      sectionTable([
        ["Step", "API / Object", "Config"],
        ["1. Mic capture", "navigator.mediaDevices.getUserMedia()", "echoCancellation + noiseSuppression enabled"],
        ["2. Audio context", "new AudioContext()", "Default sample rate (~44100 Hz or 48000 Hz)"],
        ["3. Analyser node", "audioCtx.createAnalyser()", "fftSize = 2048, smoothingTimeConstant = 0.0"],
        ["4. Connect source", "audioCtx.createMediaStreamSource(stream)", "Connects mic stream → analyser"],
        ["5. Pitch detector", "PitchDetector.forFloat32Array(2048)", "McLeod Pitch Method, frame size matches fftSize"],
        ["6. Tick loop", "requestAnimationFrame(() => tick())", "~60 fps — getFloatTimeDomainData → findPitch"],
      ], [1800, 3200, 4360]),

      spacer(120),
      h(HeadingLevel.HEADING_2, "2.3 Key Implementation Detail"),
      p("The PitchDetector.findPitch() method returns [hz, clarity] where clarity is a confidence score 0–1. " +
        "Raw Hz is noisy without filtering, so the engine applies both a clarity threshold and a rolling average " +
        "(see Submodule 3.2 for the smoothing strategy)."),

      ...codeBlock([
        "// PitchEngine.tick() — core detection loop",
        "this.analyser.getFloatTimeDomainData(this.buffer);",
        "const [hz, clarity] = this.detector.findPitch(this.buffer, this.audioCtx.sampleRate);",
        "",
        "if (clarity >= CLARITY_THRESHOLD && hz >= MIN_HZ && hz <= MAX_HZ) {",
        "  this.hzWindow.push(hz);",
        "  if (this.hzWindow.length > SMOOTHING_WINDOW) this.hzWindow.shift();",
        "  const smoothed = this.hzWindow.reduce((a, b) => a + b) / this.hzWindow.length;",
        "  this.callback({ hz: smoothed, clarity });",
        "} else {",
        "  this.hzWindow = [];   // Clear window on silence",
        "  this.callback({ hz: null, clarity });",
        "}",
      ]),

      spacer(160),

      // ══════════════════════════════════════════════════════════════
      // SECTION 3 — Submodule 3.2: Signal Smoothing
      // ══════════════════════════════════════════════════════════════
      h(HeadingLevel.HEADING_1, "3. Submodule 3.2 — Signal Smoothing"),
      h(HeadingLevel.HEADING_2, "3.1 The Problem"),
      p("Raw pitch detection is inherently noisy. Without smoothing, the UI flickers rapidly between adjacent " +
        "Hz values, making the needle and swara display jittery and unusable. Three independent filters are " +
        "applied in sequence:"),

      sectionTable([
        ["Filter", "Constant", "Rationale"],
        ["Clarity threshold", "CLARITY_THRESHOLD = 0.92", "Discard frames where the detector is < 92% confident — catches breath noise, consonants, silence"],
        ["Out-of-range guard", "MIN_HZ = 60, MAX_HZ = 1200", "~B1 to ~D6 — covers all realistic human vocal range, rejects mic pop artefacts"],
        ["Rolling average", "SMOOTHING_WINDOW = 5 frames", "Average last 5 frames (~80ms at 60fps) — smooths micro-jitter while remaining responsive"],
      ], [2400, 3200, 3760]),

      spacer(120),
      h(HeadingLevel.HEADING_2, "3.2 Window Reset on Silence"),
      p("When clarity falls below threshold (silence / unclear), the hz window is cleared to an empty array. " +
        "This prevents stale Hz values from bleeding into the next note when the user starts singing again. " +
        "Without this, the first few frames of a new note would be averaged with the tail of the previous note."),

      callout("Design Note", "SMOOTHING_WINDOW = 5 was chosen empirically. At 60fps, 5 frames ≈ 83ms lag — " +
        "responsive enough to feel real-time but smooth enough for the needle to appear stable. " +
        "Values above 8 start feeling sluggish; values below 3 remain too jittery.", AMBER_BG, "856404"),

      spacer(160),
      pageBreak(),

      // ══════════════════════════════════════════════════════════════
      // SECTION 4 — Submodule 3.3: Hz → Swara Mapping
      // ══════════════════════════════════════════════════════════════
      h(HeadingLevel.HEADING_1, "4. Submodule 3.3 — Hz to Swara Mapping"),
      h(HeadingLevel.HEADING_2, "4.1 Architecture"),
      p("The swara.ts utility is pure TypeScript — no browser APIs, no side effects. It is safe to import " +
        "in server-side rendering or static export contexts. The entire mapping is mathematical."),

      h(HeadingLevel.HEADING_2, "4.2 The 12 Swaras"),
      sectionTable([
        ["Index (semitone)", "Name", "Notation", "Common equivalent"],
        ["0", "Sa", "S", "Tonic (Do)"],
        ["1", "Komal Re", "r", "Db / C#"],
        ["2", "Shuddha Re", "R", "D"],
        ["3", "Komal Ga", "g", "Eb / D#"],
        ["4", "Shuddha Ga", "G", "E"],
        ["5", "Shuddha Ma", "M", "F"],
        ["6", "Teevra Ma", "m", "F# / Gb"],
        ["7", "Pa", "P", "G"],
        ["8", "Komal Dha", "d", "Ab / G#"],
        ["9", "Shuddha Dha", "D", "A"],
        ["10", "Komal Ni", "n", "Bb / A#"],
        ["11", "Shuddha Ni", "N", "B"],
      ], [2200, 2400, 1760, 3000]),

      spacer(120),
      h(HeadingLevel.HEADING_2, "4.3 Detection Algorithm"),
      p("Given an Hz reading and a shruti (tonic note), the algorithm:"),
      bullet("Looks up the MIDI number of the tonic (e.g., shruti C4 = MIDI 60)"),
      bullet("Converts MIDI to Hz: baseHz = 440 * 2^((midi - 69) / 12)"),
      bullet("Computes semitone offset from base: offset = 12 * log2(hz / baseHz)"),
      bullet("Rounds to nearest semitone and normalises to 0–11"),
      bullet("Fractional part gives cents deviation: cents = (offset - round(offset)) * 100"),

      spacer(80),
      ...codeBlock([
        "export function detectSwara(hz: number, shruti: ShrutiNote): SwaraMatch | null {",
        "  if (hz < 60 || hz > 2000) return null;",
        "  const baseMidi    = SHRUTI_MIDI[shruti];",
        "  const baseHz      = midiToHz(baseMidi);",
        "  const semitoneOff = 12 * Math.log2(hz / baseHz);",
        "  const nearest     = Math.round(semitoneOff);",
        "  const normalised  = ((nearest % 12) + 12) % 12;   // always 0–11",
        "  const cents       = (semitoneOff - nearest) * 100;",
        "  return { swara: SWARAS[normalised], cents };",
        "}",
      ]),

      spacer(160),
      pageBreak(),

      // ══════════════════════════════════════════════════════════════
      // SECTION 5 — Submodule 3.4: Tanpura Drone
      // ══════════════════════════════════════════════════════════════
      h(HeadingLevel.HEADING_1, "5. Submodule 3.4 — Tanpura Drone"),
      h(HeadingLevel.HEADING_2, "5.1 What It Does"),
      p("The TanpuraEngine (tanpura.ts) generates a continuous drone that replicates the acoustic role of a " +
        "tanpura in Hindustani music: it provides a stable tonal reference so the singer can orient their pitch. " +
        "The classic pattern is Sa–Pa–Sa–Ni played slowly and continuously."),

      h(HeadingLevel.HEADING_2, "5.2 Pattern & Oscillator Settings"),
      sectionTable([
        ["Parameter", "Value", "Reason"],
        ["Note pattern", "Sa (0), Pa (+7), Sa (+12), Ni (+11) semitones", "Standard tanpura tuning order"],
        ["Beat interval", "1100 ms", "~55 BPM — slow, meditative drone feel"],
        ["Oscillator type", "triangle", "Warm, smooth timbre — closer to a string than sine or sawtooth"],
        ["Attack", "0.4 s", "Gradual onset mimics plucked string decay"],
        ["Release", "2.8 s", "Long tail so notes overlap into a continuous hum"],
        ["Volume", "−20 dB", "Low enough not to mask the singer's voice"],
      ], [2000, 3200, 4160]),

      spacer(120),
      h(HeadingLevel.HEADING_2, "5.3 SSR / Static Build Issue — Dynamic Import"),
      p("Tone.js accesses the Web Audio API at import time. In a Next.js static export, modules are pre-evaluated " +
        "during the build — this causes a 'window is not defined' crash when Tone.js is imported at the top of " +
        "the module."),
      p("Fix: Tone.js is loaded with a dynamic import inside the start() method body, so it only runs in the browser:"),

      ...codeBlock([
        "async start(shruti: ShrutiNote): Promise<void> {",
        "  const Tone = await import('tone');   // ← lazy — runs browser-only",
        "  await Tone.start();",
        "  // ... set up synths and schedule pattern",
        "}",
      ]),

      spacer(120),
      h(HeadingLevel.HEADING_2, "5.4 Shruti Change Handling"),
      p("When the user selects a different shruti (tonic), the tanpura must restart with new frequencies. " +
        "The practice page calls stop() then start(newShruti) — all synths are disposed between calls to " +
        "prevent Web Audio node accumulation and memory leaks."),

      spacer(160),
      pageBreak(),

      // ══════════════════════════════════════════════════════════════
      // SECTION 6 — Submodule 3.5: Sur Accuracy Meter UI
      // ══════════════════════════════════════════════════════════════
      h(HeadingLevel.HEADING_1, "6. Submodule 3.5 — Sur Accuracy Meter UI"),
      h(HeadingLevel.HEADING_2, "6.1 Visual Design"),
      p("SurMeter.tsx renders a horizontal needle meter showing the singer's pitch deviation from the " +
        "nearest swara in cents (hundredths of a semitone). The display range is ±60 cents."),

      sectionTable([
        ["Zone", "Cents range", "Colour", "Meaning"],
        ["On pitch", "≤ ±20¢", "Green (#22C55E)", "Singer is accurately on the swara"],
        ["Close", "21–50¢", "Amber (#F59E0B)", "Singer is nearly on pitch — keep adjusting"],
        ["Off pitch", "> 50¢", "Red (#EF4444)", "Singer is significantly off the target note"],
        ["Silence / no pitch", "—", "Grey (#9CA3AF)", "No clear pitch detected from mic"],
      ], [1800, 1800, 2600, 3160]),

      spacer(120),
      h(HeadingLevel.HEADING_2, "6.2 Implementation Details"),
      bullet("Permanent shaded green band at ±20¢ centred on the meter — always visible as a guide"),
      bullet("Needle position is calculated as: left = 50% + (cents / 60) * 50% — clamped to 0–100%"),
      bullet("CSS transition-all duration-75 for 75ms smooth animation — fast enough to feel responsive"),
      bullet("Null hz → needle hidden, grey indicator shown"),
      bullet("Component is a pure presentation component — receives hz (number|null) and cents as props"),

      spacer(160),

      // ══════════════════════════════════════════════════════════════
      // SECTION 7 — Submodule 3.6: Target Swara Display
      // ══════════════════════════════════════════════════════════════
      h(HeadingLevel.HEADING_1, "7. Submodule 3.6 — Target Swara Display"),
      h(HeadingLevel.HEADING_2, "7.1 What It Shows"),
      p("SwaraDisplay.tsx presents two circles side by side:"),

      sectionTable([
        ["Circle", "Size", "Colour", "Content"],
        ["Target swara", "136×136 px", "Navy border + pulse on hit", "Swara name (e.g. Sa). Glows green + 'Sur lagaa!' text when singer lands on it"],
        ["Detected swara", "96×96 px", "Saffron (#FF6600) ring", "Current detected swara, or '—' if no pitch"],
      ], [2400, 2000, 2600, 2360]),

      spacer(120),
      h(HeadingLevel.HEADING_2, "7.2 On-Pitch Logic"),
      p("The isOnPitch condition requires both correct swara AND cents within tolerance:"),
      ...codeBlock([
        "const isOnPitch = detected !== null",
        "  && detected.swara === target",
        "  && Math.abs(detected.cents) <= PITCH_TOLERANCE;  // 20¢",
      ]),
      p("When isOnPitch is true, the target circle switches to a green pulse animation (Tailwind animate-pulse) " +
        "and displays 'Sur lagaa!' ('You found the note!' in Hindi) below the swara name."),

      spacer(160),
      pageBreak(),

      // ══════════════════════════════════════════════════════════════
      // SECTION 8 — Practice Page (page.tsx)
      // ══════════════════════════════════════════════════════════════
      h(HeadingLevel.HEADING_1, "8. Practice Page — app/practice/page.tsx"),
      h(HeadingLevel.HEADING_2, "8.1 Architecture Decisions"),

      bullet("'use client' directive — all Web Audio APIs are browser-only, no SSR"),
      bullet("Engine refs use useRef (not useState) — avoids unnecessary re-renders on every pitch update"),
      bullet("Auth guard via useEffect + isLoggedIn() check — redirects to /login if no JWT cookie"),
      bullet("TARGET is hardcoded to 'Sa' for Day 3 — will become a sequence in Day 4"),
      bullet("PITCH_TOLERANCE = 20 cents — matches the SurMeter green zone"),

      spacer(80),
      h(HeadingLevel.HEADING_2, "8.2 Shruti Selector"),
      p("A 12-button grid displays all 12 chromatic notes (C through B). Selecting a new shruti:"),
      bullet("Updates shruti state"),
      bullet("Calls tanpuraRef.current.stop() on the current engine (disposes synths)"),
      bullet("Calls tanpuraRef.current.start(newShruti) with the new frequencies"),
      p("This keeps the tanpura in sync with the selected tonic at all times."),

      spacer(80),
      h(HeadingLevel.HEADING_2, "8.3 Session Controls"),
      sectionTable([
        ["Control", "Action"],
        ["Start Mic", "Requests microphone permission, starts PitchEngine, begins real-time detection"],
        ["Stop Mic", "Stops PitchEngine, releases mic track, cancels requestAnimationFrame loop"],
        ["Start Tanpura", "Loads Tone.js (dynamic import), starts Sa-Pa-Sa-Ni drone for selected shruti"],
        ["Stop Tanpura", "Stops Tone.js transport, disposes all synths"],
      ], [2400, 6960]),

      spacer(160),
      pageBreak(),

      // ══════════════════════════════════════════════════════════════
      // SECTION 9 — Spring Boot SPA Routing Fix
      // ══════════════════════════════════════════════════════════════
      h(HeadingLevel.HEADING_1, "9. SpaWebConfig.java — Spring Boot SPA Routing Fix"),
      h(HeadingLevel.HEADING_2, "9.1 The Problem"),
      p("Next.js with output: 'export' and trailingSlash: true generates static files as:"),
      ...codeBlock([
        "/practice/index.html",
        "/dashboard/index.html",
        "/login/index.html",
      ]),
      p("Spring Boot's default static file handler serves /practice/index.html only when the request path " +
        "is exactly /practice/index.html or /practice/. A direct GET /practice (no trailing slash) returned " +
        "HTTP 404 — breaking direct URL access and browser refreshes on any SPA route."),

      spacer(80),
      h(HeadingLevel.HEADING_2, "9.2 The Fix"),
      p("SpaWebConfig.java adds a custom PathResourceResolver with a two-step fallback:"),
      bullet("Step 1: Try the exact path (handles /_next/static/…, /favicon.ico, CSS, JS files)"),
      bullet("Step 2: If not found, try <path>/index.html (handles /practice → /practice/index.html)"),
      bullet("Step 3: Return null → Spring MVC returns 404 normally"),
      p("API routes (/api/**) hit Spring MVC controllers before this resolver runs and are never affected."),

      ...codeBlock([
        "protected Resource getResource(String resourcePath, Resource location) throws IOException {",
        "  // 1. Exact path (static assets)",
        "  Resource res = location.createRelative(resourcePath);",
        "  if (res.exists() && res.isReadable()) return res;",
        "",
        "  // 2. SPA fallback: /practice → /practice/index.html",
        "  String withIndex = resourcePath.endsWith(\"/\")",
        "      ? resourcePath + \"index.html\"",
        "      : resourcePath + \"/index.html\";",
        "  Resource idx = location.createRelative(withIndex);",
        "  if (idx.exists() && idx.isReadable()) return idx;",
        "",
        "  // 3. Not found",
        "  return null;",
        "}",
      ]),

      spacer(160),
      pageBreak(),

      // ══════════════════════════════════════════════════════════════
      // SECTION 10 — Bugs & Fixes
      // ══════════════════════════════════════════════════════════════
      h(HeadingLevel.HEADING_1, "10. Bugs Encountered & Fixes"),

      h(HeadingLevel.HEADING_2, "10.1 TypeScript — Float32Array Generic Type Mismatch"),
      sectionTable([
        ["Attribute", "Detail"],
        ["Symptom", "TS2345: Argument of type 'Float32Array<ArrayBufferLike>' not assignable to 'Float32Array<ArrayBuffer>'"],
        ["Root cause", "Web Audio API's getFloatTimeDomainData() and Pitchy's findPitch() both require Float32Array<ArrayBuffer> specifically. new Float32Array() returns Float32Array<ArrayBufferLike> by default."],
        ["Fix", "Type the field as Float32Array<ArrayBuffer> | null, then cast on construction: new Float32Array(n) as Float32Array<ArrayBuffer>"],
      ], [2200, 7160]),

      spacer(120),
      h(HeadingLevel.HEADING_2, "10.2 Tone.js — SSR / Static Build Crash"),
      sectionTable([
        ["Attribute", "Detail"],
        ["Symptom", "Build error: 'window is not defined' during next build static page generation"],
        ["Root cause", "Tone.js accesses window.AudioContext at import time. Next.js pre-evaluates module code during static export, before a browser context exists."],
        ["Fix", "Replace top-level import with dynamic import inside the start() method body. This defers loading until the method is called in a browser context."],
      ], [2200, 7160]),

      spacer(120),
      h(HeadingLevel.HEADING_2, "10.3 SPA Routes — HTTP 404 on Direct URL Access"),
      sectionTable([
        ["Attribute", "Detail"],
        ["Symptom", "http://13.235.81.131:8080/practice → 404 Not Found when accessed directly"],
        ["Root cause", "Spring Boot's default static file handler does not auto-serve directory index files. It matched /practice/ but not /practice."],
        ["Fix", "Added SpaWebConfig.java (see Section 9)"],
      ], [2200, 7160]),

      spacer(160),
      pageBreak(),

      // ══════════════════════════════════════════════════════════════
      // SECTION 11 — Deployment
      // ══════════════════════════════════════════════════════════════
      h(HeadingLevel.HEADING_1, "11. Deployment — Day 3 on EC2"),
      h(HeadingLevel.HEADING_2, "11.1 Build Pipeline"),
      p("Day 3 code was deployed via the GitHub Actions CI/CD pipeline from Day 2. Two commits were pushed:"),

      sectionTable([
        ["Commit", "SHA", "Change"],
        ["feat(day3): Swara Trainer — mic input, pitch detection, tanpura drone, sur meter", "f682a44", "All 6 submodules: pitch.ts, swara.ts, tanpura.ts, SurMeter, SwaraDisplay, practice page"],
        ["fix: serve SPA routes without trailing slash", "6b93f08", "SpaWebConfig.java — PathResourceResolver fallback for /practice, /dashboard, /login"],
      ], [4200, 1400, 3760]),

      spacer(120),
      h(HeadingLevel.HEADING_2, "11.2 Smoke Test Results"),
      sectionTable([
        ["Route", "Expected", "Result"],
        ["GET /", "200", "200 OK"],
        ["GET /login", "200", "200 OK"],
        ["GET /register", "200", "200 OK"],
        ["GET /practice", "200", "200 OK (fixed by SpaWebConfig)"],
        ["GET /dashboard", "200", "200 OK"],
        ["GET /api/health", "200", "200 OK"],
      ], [3000, 1800, 4560]),

      spacer(160),

      // ══════════════════════════════════════════════════════════════
      // SECTION 12 — Day 4 Preview
      // ══════════════════════════════════════════════════════════════
      h(HeadingLevel.HEADING_1, "12. Day 4 Preview — Session + XP"),
      p("Day 4 (Friday) will extend the Swara Trainer with a full session flow, scoring, and an XP system. " +
        "The goal: complete a practice session and see XP increment on the dashboard."),

      sectionTable([
        ["Submodule", "What will be built"],
        ["4.1 Session Flow (FE)", "Start screen (shruti + duration selector), active practice view with timer, results screen (accuracy %, XP earned)"],
        ["4.2 Mobile Mic Test", "Verify Web Audio API mic on iOS Safari — must be triggered by user gesture; fix before Day 5"],
        ["4.3 Accuracy Calculation", "Track hits / total notes attempted per session; calculate accuracy % at end; display breakdown"],
        ["4.4 DB Schema V2", "Flyway migration V2: practice_sessions table (id, user_id, duration_secs, accuracy_pct, xp_awarded, created_at)"],
        ["4.5 Session API", "POST /api/sessions — accept payload, calculate XP (base + accuracy bonus), save to DB, update users.xp_total atomically"],
        ["4.6 Dashboard Page", "Fetch user profile (name, total XP), fetch last session (date, accuracy), XP progress bar, link to new session"],
      ], [3000, 6360]),

      spacer(160),
      callout("Risk Flag", "iOS Safari requires a user gesture to initialise AudioContext. " +
        "If mic access is tested only on desktop, a silent failure may occur on mobile. " +
        "Test on real iPhone hardware on Day 4 — do NOT defer to Day 5.", AMBER_BG, "856404"),

      spacer(320),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 240, after: 0 },
        children: [new TextRun({ text: "— End of Day 3 Deep-Dive —", size: 20, color: "888888", italics: true })]
      }),

    ]
  }]
});

// ── Write output ──────────────────────────────────────────────────────────────
Packer.toBuffer(doc).then(buffer => {
  const out = "C:\\ClaudeWorkspace\\Raag\\docs\\RaagPath-Day3-Deep-Dive.docx";
  fs.writeFileSync(out, buffer);
  console.log("Written:", out);
}).catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
