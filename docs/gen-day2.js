'use strict';
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
  PageNumber, PageBreak, LevelFormat, Header, Footer
} = require('docx');
const fs = require('fs');

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  deepBlue : '1F3864', midBlue : '2E75B6', saffron : 'D4690A',
  lightBlue: 'D6E4F0', infoBg  : 'EBF3FB', codeBg  : 'F2F2F2',
  white    : 'FFFFFF', dark    : '222222', mid     : '555555',
  rowAlt   : 'F0F6FB', headerBg: '2C4A7C', green   : '1E7E34',
};

// ─── Borders ─────────────────────────────────────────────────────────────────
const b1 = (color='CCCCCC') => ({ style: BorderStyle.SINGLE, size: 1, color });
const allB = c => ({ top:b1(c), bottom:b1(c), left:b1(c), right:b1(c) });
const leftAccent = () => ({
  top: b1('CCCCCC'), bottom: b1('CCCCCC'), right: b1('CCCCCC'),
  left: { style: BorderStyle.SINGLE, size: 14, color: C.saffron },
});

// ─── Paragraph helpers ────────────────────────────────────────────────────────
const h1 = t => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 400, after: 160 },
  children: [new TextRun({ text: t, bold: true, size: 34, color: C.deepBlue, font: 'Arial' })],
});
const h2 = t => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 320, after: 120 },
  children: [new TextRun({ text: t, bold: true, size: 28, color: C.deepBlue, font: 'Arial' })],
});
const h3 = t => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 200, after: 80 },
  children: [new TextRun({ text: t, bold: true, size: 23, color: C.midBlue, font: 'Arial' })],
});
const para = (text, opts={}) => new Paragraph({
  spacing: { after: 160 },
  children: [new TextRun({ text, size: 22, color: C.dark, font: 'Arial', ...opts })],
});
const bullet = (text, opts={}) => new Paragraph({
  numbering: { reference: 'bullets', level: 0 }, spacing: { after: 80 },
  children: [new TextRun({ text, size: 22, color: C.dark, font: 'Arial', ...opts })],
});
const subBullet = (text, opts={}) => new Paragraph({
  numbering: { reference: 'sub', level: 0 }, spacing: { after: 60 },
  children: [new TextRun({ text, size: 20, color: C.mid, font: 'Arial', ...opts })],
});
const spacer = (n=180) => new Paragraph({ spacing: { after: n }, children: [new TextRun('')] });

// ─── Code block ───────────────────────────────────────────────────────────────
const code = lines => new Table({
  width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360],
  rows: [new TableRow({ children: [new TableCell({
    borders: leftAccent(),
    shading: { fill: C.codeBg, type: ShadingType.CLEAR },
    margins: { top: 120, bottom: 120, left: 220, right: 120 },
    width: { size: 9360, type: WidthType.DXA },
    children: lines.map(l => new Paragraph({
      spacing: { after: 0, line: 240, lineRule: 'exact' },
      children: [new TextRun({ text: l, font: 'Courier New', size: 18, color: '333333' })],
    })),
  })]})],
});

// ─── Callout box ─────────────────────────────────────────────────────────────
const callout = (label, lines) => new Table({
  width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360],
  rows: [new TableRow({ children: [new TableCell({
    borders: leftAccent(),
    shading: { fill: C.infoBg, type: ShadingType.CLEAR },
    margins: { top: 140, bottom: 140, left: 220, right: 200 },
    width: { size: 9360, type: WidthType.DXA },
    children: [
      new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: label, bold: true, size: 22, color: C.deepBlue, font: 'Arial' })] }),
      ...lines.map(l => new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: l, size: 21, color: C.dark, font: 'Arial' })] })),
    ],
  })]})],
});

// ─── Summary table ────────────────────────────────────────────────────────────
const summaryTable = rows => new Table({
  width: { size: 9360, type: WidthType.DXA }, columnWidths: [1920, 7440],
  rows: [
    new TableRow({ tableHeader: true, children: [
      new TableCell({
        columnSpan: 2, shading: { fill: C.deepBlue, type: ShadingType.CLEAR },
        borders: allB(C.deepBlue), margins: { top: 100, bottom: 100, left: 160, right: 160 },
        width: { size: 9360, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: 'Submodule Summary', bold: true, color: C.white, size: 22, font: 'Arial' })] })],
      }),
    ]}),
    ...rows.map(([label, value], i) => new TableRow({ children: [
      new TableCell({
        shading: { fill: i%2===0 ? C.lightBlue : C.rowAlt, type: ShadingType.CLEAR },
        borders: allB('BBBBBB'), margins: { top: 80, bottom: 80, left: 160, right: 100 },
        width: { size: 1920, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20, color: C.deepBlue, font: 'Arial' })] })],
      }),
      new TableCell({
        shading: { fill: i%2===0 ? C.white : 'F8FBFD', type: ShadingType.CLEAR },
        borders: allB('BBBBBB'), margins: { top: 80, bottom: 80, left: 160, right: 160 },
        width: { size: 7440, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: value, size: 20, color: C.dark, font: 'Arial' })] })],
      }),
    ]})),
  ],
});

// ─── 3-col table ─────────────────────────────────────────────────────────────
const table3 = (headers, rows, widths=[2400,3480,3480]) => new Table({
  width: { size: 9360, type: WidthType.DXA }, columnWidths: widths,
  rows: [
    new TableRow({ tableHeader: true, children: headers.map((h, ci) => new TableCell({
      shading: { fill: C.headerBg, type: ShadingType.CLEAR }, borders: allB(C.headerBg),
      margins: { top: 100, bottom: 100, left: 140, right: 140 },
      width: { size: widths[ci], type: WidthType.DXA },
      children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: C.white, size: 20, font: 'Arial' })] })],
    })) }),
    ...rows.map((row, i) => new TableRow({ children: row.map((val, ci) => new TableCell({
      shading: { fill: i%2===0 ? C.white : C.rowAlt, type: ShadingType.CLEAR },
      borders: allB('CCCCCC'), margins: { top: 80, bottom: 80, left: 140, right: 140 },
      width: { size: widths[ci], type: WidthType.DXA },
      children: [new Paragraph({ children: [new TextRun({ text: val, size: 20, color: C.dark, font: 'Arial' })] })],
    })) })),
  ],
});

const pgBreak = () => new Paragraph({ children: [new PageBreak()] });

// ═══════════════════════════════════════════════════════════════════════════════
//  DOCUMENT CONTENT
// ═══════════════════════════════════════════════════════════════════════════════
const children = [

  // ── TITLE PAGE ──────────────────────────────────────────────────────────────
  spacer(800),
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 120 },
    children: [new TextRun({ text: 'RaagPath', bold: true, size: 64, color: C.deepBlue, font: 'Arial' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 200 },
    children: [new TextRun({ text: 'Day 2 — Technical Deep Dive', bold: true, size: 40, color: C.saffron, font: 'Arial' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 80 },
    children: [new TextRun({ text: 'Authentication System & Deployment Pipeline', size: 28, color: C.mid, font: 'Arial' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 80 },
    children: [new TextRun({ text: 'Senior Staff Engineer Portfolio', italics: true, size: 24, color: C.mid, font: 'Arial' })],
  }),
  spacer(80),
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 80 },
    children: [new TextRun({ text: 'March 2026', size: 22, color: C.mid, font: 'Arial' })],
  }),
  pgBreak(),

  // ── EXECUTIVE SUMMARY ───────────────────────────────────────────────────────
  h1('Executive Summary'),
  para('Day 2 wired the entire path from "a user types an email and password" to "a JWT token is minted, returned, stored in a browser cookie, and used to authenticate subsequent API requests." Beyond authentication, Day 2 established the full automated deployment pipeline: every push to main automatically builds, containerizes, pushes to ECR, and deploys to EC2 via SSH — in under 5 minutes.'),
  para('This is often called the "boring" part of a project. In reality, authentication and CI/CD are the highest-leverage work a senior engineer can do: get them wrong and every subsequent feature is built on a shaky foundation. Get them right and every team member ships with confidence.'),
  spacer(),

  h2('Day 2 Architecture: What Runs in Production'),
  code([
    '[ Browser ]',
    '     |  HTTPS (port 443 in Day 5, port 80 for now)',
    '     v',
    '[ Nginx ]  — reverse proxy on EC2 host — port 80 → 8080',
    '     |  HTTP (loopback: 127.0.0.1:8080)',
    '     v',
    '[ Docker Container: Spring Boot WAR ]',
    '     |  JWT auth filter on every /api/** request',
    '     |  Spring Data JPA → PostgreSQL (RDS)',
    '     |  Spring Data Redis → Redis container',
    '     v',
    '[ Docker Container: Redis ]  —  raagpath-net bridge network',
    '',
    '[ GitHub Actions CI/CD ]',
    '  push to main → OIDC AWS auth → docker build → ECR push → SSH → docker run',
  ]),
  spacer(),

  h2('Day 2 Technology Choices'),
  table3(
    ['Component', 'Technology', 'Key Decision'],
    [
      ['DB Schema Versioning', 'Flyway (SQL migrations)', 'Single source of truth; Hibernate never touches DDL'],
      ['Password Hashing',     'BCrypt (work factor 12)', 'Adaptive cost, salt built-in, rainbow table resistant'],
      ['Token Format',         'JWT (HMAC-SHA256)',        'Stateless, no session store needed for MVP'],
      ['Security Filter',      'Spring Security OncePerRequestFilter', 'Clean separation: filter validates, controller serves'],
      ['Frontend Routing',     'Next.js middleware (edge)', 'Route protection before page renders — no flash of unprotected content'],
      ['CI/CD Auth',           'OIDC (no long-lived keys)', 'GitHub Actions trusted identity — zero stored secrets for AWS'],
      ['Orchestration',        'Docker Compose',           'Multi-container networking without Kubernetes overhead'],
      ['Caching Layer',        'Redis 7 (Alpine)',         'Shared state; future session/rate-limiting/leaderboard'],
      ['Reverse Proxy',        'Nginx (host-installed)',   'No extra container hop; TLS termination on Day 5'],
    ]
  ),
  pgBreak(),

  // ── 2.1 FLYWAY ──────────────────────────────────────────────────────────────
  h1('2.1 — Flyway V1: Users Table Schema'),
  summaryTable([
    ['What',   'V1__Create_users_table.sql — creates the users table with all constraints'],
    ['Why',    'Version-controlled schema: every migration is traceable, reproducible, reversible'],
    ['Files',  'backend/src/main/resources/db/migration/V1__Create_users_table.sql'],
    ['Status', 'DONE — Flyway runs on Spring Boot startup; users table confirmed in RDS'],
  ]),
  spacer(),

  h2('The Migration File'),
  code([
    '-- V1__Create_users_table.sql',
    'CREATE TABLE users (',
    '    id            BIGSERIAL                   PRIMARY KEY,',
    '    email         VARCHAR(255)                NOT NULL UNIQUE,',
    '    password_hash VARCHAR(255)                NOT NULL,',
    '    xp_total      INTEGER                     NOT NULL DEFAULT 0,',
    '    created_at    TIMESTAMP WITH TIME ZONE    NOT NULL DEFAULT NOW()',
    ');',
    '',
    'CREATE INDEX idx_users_email ON users (email);',
  ]),

  h2('How Flyway Works'),
  para('Flyway is a database migration tool that versions your schema using numbered SQL files. On application startup, Flyway connects to the database and checks the flyway_schema_history table (which it creates automatically on first run). It compares migrations on the filesystem against the history table and runs any pending migrations in version order.'),
  code([
    '-- Flyway creates and maintains this table automatically',
    'flyway_schema_history',
    '  installed_rank  | INT       -- order of execution',
    '  version         | VARCHAR   -- "1" from V1__Create_users_table.sql',
    '  description     | VARCHAR   -- "Create users table"',
    '  script          | VARCHAR   -- filename',
    '  checksum        | INT       -- CRC32 of file contents',
    '  installed_on    | TIMESTAMP -- when it ran',
    '  success         | BOOLEAN   -- true if succeeded',
  ]),
  spacer(),

  h3('The Naming Convention is Not Optional'),
  bullet('V1__ : Versioned migration. Runs once, in version order. Cannot be changed after running (checksum validation).'),
  bullet('U1__ : Undo migration. Reverses a versioned migration (requires Flyway Pro).'),
  bullet('R__ : Repeatable migration. Runs whenever checksum changes (useful for views, stored procedures).'),
  spacer(),

  h3('Why baseline-on-migrate: true'),
  para('If the database already has schema (e.g., you added tables manually before setting up Flyway), Flyway will refuse to run because it has no history. baseline-on-migrate tells Flyway: "treat the current schema as version 0 and start versioning from here." We set this proactively — it is harmless if there is no existing schema.'),

  h2('Schema Design Decisions'),
  bullet('BIGSERIAL PRIMARY KEY: PostgreSQL-native auto-increment bigint. Equivalent to BIGINT + SEQUENCE. Avoids UUID overhead (~30% slower joins in PostgreSQL without careful indexing).'),
  bullet('VARCHAR(255) for email: the email spec allows up to 254 characters. 255 is a safe ceiling that fits in a single B-tree page slot.'),
  bullet('password_hash NOT NULL: we store the BCrypt hash, never the plaintext password. The column name makes this explicit and self-documenting.'),
  bullet('TIMESTAMP WITH TIME ZONE (TIMESTAMPTZ): stores timestamps in UTC internally, displays in session timezone. Always use TIMESTAMPTZ over TIMESTAMP in PostgreSQL — avoids subtle bugs when servers are in different time zones.'),
  bullet('idx_users_email: the most frequent lookup (login: SELECT * FROM users WHERE email = ?). Without this index, PostgreSQL does a full table scan. With it, lookups are O(log n) via the B-tree.'),
  callout('Why No display_name or name Column',
    [
      'YAGNI — we do not need it for Day 2. Adding a column is a new Flyway migration.',
      'Premature schema design is a source of technical debt. Design schema for the features you are building now.',
      'V2 migration (Day 4) will add the practice_sessions table. The pattern is established.',
    ]),
  pgBreak(),

  // ── 2.2 JWT AUTH ────────────────────────────────────────────────────────────
  h1('2.2 — Spring Security 6 + JWT Authentication'),
  summaryTable([
    ['What',   'Complete JWT auth: BCrypt hashing, token generation/validation, Spring Security filter chain'],
    ['Why',    'Stateless authentication scales horizontally without shared session state'],
    ['Files',  'JwtUtil.java, JwtAuthFilter.java, UserDetailsServiceImpl.java, AuthController.java, SecurityConfig.java'],
    ['Status', 'DONE — POST /api/auth/register returns 201 + JWT; POST /api/auth/login returns 200 + JWT'],
  ]),
  spacer(),

  h2('The Full Authentication Flow'),
  code([
    '── Registration ────────────────────────────────────────────────────────────',
    'Client  POST /api/auth/register { email, password }',
    '  -> AuthController.register()',
    '     -> userRepo.existsByEmail() — 409 Conflict if duplicate',
    '     -> BCryptPasswordEncoder.encode(password)  // hash with work factor 12',
    '     -> userRepo.save(new User(email, hash))    // persist to PostgreSQL',
    '     -> jwtUtil.generateToken(email)            // mint 24-hour JWT',
    '  <- 201 Created { token, email }',
    '',
    '── Login ───────────────────────────────────────────────────────────────────',
    'Client  POST /api/auth/login { email, password }',
    '  -> AuthController.login()',
    '     -> userDetailsService.loadUserByUsername(email) — 401 if not found',
    '     -> BCryptPasswordEncoder.matches(password, storedHash) — 401 if wrong',
    '     -> jwtUtil.generateToken(email)',
    '  <- 200 OK { token, email }',
    '',
    '── Authenticated Request ────────────────────────────────────────────────────',
    'Client  GET /api/sessions  Authorization: Bearer <token>',
    '  -> JwtAuthFilter.doFilterInternal()',
    '     -> Extract "Bearer <token>" from Authorization header',
    '     -> jwtUtil.extractEmail(token) + jwtUtil.isValid(token)',
    '     -> Set SecurityContextHolder authentication',
    '  -> Controller executes with authenticated principal',
    '  <- 200 OK { data }',
  ]),
  spacer(),

  h2('BCrypt — How Password Hashing Works'),
  para('BCrypt is an adaptive cryptographic hash function designed for passwords. "Adaptive" means you can increase its cost factor as hardware gets faster, keeping it slow enough to resist brute force.'),
  code([
    '// BCrypt output format',
    '$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    '   ^^ ^^                                                         ',
    '   |  |__ Cost factor (12 = 2^12 = 4096 iterations)',
    '   |______ Algorithm version (2a = current standard)',
    '',
    '// The remaining 53 chars = salt (22 chars) + hash (31 chars)',
    '// Salt is random per-password: same password hashes differently each time',
    '',
    '// In SecurityConfig.java',
    '@Bean',
    'public PasswordEncoder passwordEncoder() {',
    '    return new BCryptPasswordEncoder(); // default cost = 10; we use 10 (matches default)',
    '}',
    '',
    '// Verification is automatic: BCryptPasswordEncoder.matches(rawPwd, storedHash)',
    '// It extracts the salt from storedHash, re-hashes rawPwd with that salt, compares',
  ]),
  spacer(),

  bullet('Work factor 10: ~100ms per hash on modern hardware. An attacker testing 1 billion passwords/second on a GPU can test only ~10 per second — 100 million times slower.'),
  bullet('Salt: random 128-bit value generated per-password. Even if two users have the same password, their hashes differ. Defeats rainbow tables entirely.'),
  bullet('No external storage: the salt is embedded in the hash output. No separate salt column needed.'),
  spacer(),

  h2('JWT — Anatomy of a Token'),
  para('A JSON Web Token (JWT) consists of three Base64URL-encoded sections separated by dots:'),
  code([
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9    <- Header',
    '.eyJzdWIiOiJ1c2VyQGV4YW1wbGUuY29tIiwiZXhwIjoxNzA5MDAwMDAwfQ==  <- Payload',
    '.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c   <- Signature',
    '',
    '// Decoded Header',
    '{ "alg": "HS256", "typ": "JWT" }',
    '',
    '// Decoded Payload',
    '{ "sub": "user@example.com", "iat": 1709000000, "exp": 1709086400 }',
    '//  sub = subject (email)    iat = issued at    exp = expiry (24h later)',
    '',
    '// Signature = HMAC-SHA256(base64(header) + "." + base64(payload), secretKey)',
    '// If ANY bit of header or payload changes, signature verification FAILS',
  ]),
  spacer(),

  h3('Why HMAC-SHA256 (HS256) Not RSA (RS256)'),
  para('HS256 uses a single shared secret key for both signing and verification. RS256 uses a private key to sign and a public key to verify — enabling multiple services to verify tokens without knowing the signing key.'),
  bullet('HS256 for MVP: one service (Spring Boot) signs and verifies. Simple, fast, no key pair management.'),
  bullet('RS256 when: you add a second service that needs to verify tokens (e.g., a WebSocket service). Upgrade path is clean — just change the signing algorithm in JwtUtil.'),
  bullet('Secret key: 64-character random string stored in JWT_SECRET environment variable. Never in code. Never in git.'),
  spacer(),

  h2('Spring Security 6 Filter Chain'),
  para('Spring Security processes every HTTP request through an ordered chain of filters. Our JWT filter inserts itself before the standard UsernamePasswordAuthenticationFilter:'),
  code([
    '// SecurityConfig.java',
    '.authorizeHttpRequests(auth -> auth',
    '    .requestMatchers("/api/auth/**").permitAll()   // register + login: public',
    '    .requestMatchers("/api/health").permitAll()    // health check: public',
    '    .requestMatchers("/api/**").authenticated()    // everything else: JWT required',
    '    .anyRequest().permitAll()                      // static frontend files: public',
    ')',
    '.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)',
    '.sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))',
  ]),
  spacer(),

  h3('JwtAuthFilter — How It Works'),
  code([
    '// JwtAuthFilter.java — simplified',
    '@Override',
    'protected void doFilterInternal(HttpServletRequest req, ...) {',
    '    String header = req.getHeader("Authorization");',
    '',
    '    // Skip if no Bearer token',
    '    if (header == null || !header.startsWith("Bearer ")) {',
    '        filterChain.doFilter(req, res);',
    '        return;',
    '    }',
    '',
    '    String token = header.substring(7); // strip "Bearer "',
    '    String email = jwtUtil.extractEmail(token);',
    '',
    '    // Only set auth if not already set (prevents double-processing)',
    '    if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {',
    '        UserDetails user = userDetailsService.loadUserByUsername(email);',
    '',
    '        if (jwtUtil.isValid(token)) {',
    '            // Create authentication token and put in SecurityContext',
    '            UsernamePasswordAuthenticationToken auth =',
    '                new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());',
    '            SecurityContextHolder.getContext().setAuthentication(auth);',
    '        }',
    '    }',
    '    filterChain.doFilter(req, res); // always continue chain',
    '}',
  ]),
  callout('Senior Engineer Note: JWT Revocation (The Hard Problem)',
    [
      'JWTs are stateless — once issued, they are valid until expiry. You cannot "log out" a JWT without storing state.',
      'Mitigation options: short expiry (we use 24h), token blacklist in Redis (adds state back), refresh token rotation.',
      'For RaagPath MVP: 24h expiry is acceptable. If a token is stolen, maximum exposure is 24 hours.',
      'Production solution: access token (15 min expiry) + refresh token (30 days, stored in DB, can be revoked).',
    ]),
  pgBreak(),

  // ── 2.3 NEXT.JS AUTH PAGES ──────────────────────────────────────────────────
  h1('2.3 — Next.js Login, Register & Dashboard Pages'),
  summaryTable([
    ['What',   'Login/register forms, dashboard, cookie helpers, Next.js middleware for route protection'],
    ['Why',    'Protected client-side routes with no flash of unauthenticated content'],
    ['Files',  'src/app/login/page.tsx, register/page.tsx, dashboard/page.tsx, src/middleware.ts, src/lib/auth.ts'],
    ['Status', 'DONE — full auth flow working: register -> JWT cookie -> dashboard (protected)'],
  ]),
  spacer(),

  h2('Cookie Storage vs localStorage'),
  para('The JWT token must be stored somewhere in the browser. The two options are cookies and localStorage. We use cookies with SameSite=Strict:'),
  table3(
    ['Property',     'Cookie (our choice)',              'localStorage'],
    [
      ['XSS risk',     'Medium (mitigated by httpOnly)',   'High: JS can read, exfiltrate token'],
      ['CSRF risk',    'Low (SameSite=Strict prevents)',   'None (JS must explicitly send)'],
      ['Middleware',   'Readable by Next.js middleware',   'Not accessible server-side'],
      ['httpOnly',     'Option: JS cannot read it',        'Not applicable'],
      ['Expiry',       'Controlled by cookie attributes',  'Never expires unless cleared'],
    ],
    [2400, 3480, 3480]),
  spacer(),

  h3('Why Not httpOnly Cookies'),
  para('httpOnly cookies are unreadable by JavaScript — the browser sends them automatically with requests, but document.cookie cannot access them. This is the gold standard for token storage. However, Next.js middleware (which runs at the edge, before pages) reads cookies to decide whether to redirect. The middleware can read non-httpOnly cookies. We store the JWT in a non-httpOnly cookie because the middleware needs to read it — but we mitigate XSS risk through Content Security Policy (Day 5).'),
  code([
    '// src/lib/auth.ts — cookie helpers',
    "export const saveAuth = (token: string, email: string) => {",
    "    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString();",
    "    document.cookie = `raag_token=${token}; expires=${expires}; path=/; SameSite=Strict`;",
    "    document.cookie = `raag_email=${email}; expires=${expires}; path=/; SameSite=Strict`;",
    '};',
    '',
    'export const getToken = (): string | null => {',
    "    const match = document.cookie.match(/raag_token=([^;]+)/);",
    '    return match ? match[1] : null;',
    '};',
  ]),
  spacer(),

  h2('Next.js Middleware — Route Protection'),
  para('The middleware file (src/middleware.ts) runs at the edge — before any page component renders. This prevents the "flash of unauthenticated content" problem where a protected page briefly renders before a client-side redirect fires.'),
  code([
    '// src/middleware.ts',
    "import { NextResponse } from 'next/server';",
    "import type { NextRequest } from 'next/server';",
    '',
    'export function middleware(request: NextRequest) {',
    "    const token = request.cookies.get('raag_token')?.value;",
    "    const { pathname } = request.nextUrl;",
    '',
    '    // Protected routes: redirect to login if no token',
    "    if ((pathname.startsWith('/dashboard') || pathname.startsWith('/practice')) && !token) {",
    "        return NextResponse.redirect(new URL('/login', request.url));",
    '    }',
    '',
    '    // Auth routes: redirect to dashboard if already logged in',
    "    if ((pathname === '/login' || pathname === '/register') && token) {",
    "        return NextResponse.redirect(new URL('/dashboard', request.url));",
    '    }',
    '',
    '    return NextResponse.next();',
    '}',
    '',
    "// Apply middleware only to these paths (not to /api or static files)",
    'export const config = {',
    "    matcher: ['/dashboard/:path*', '/practice/:path*', '/login', '/register'],",
    '};',
  ]),
  callout('Why Middleware at the Edge (Not Client-Side useEffect)',
    [
      'Client-side guard (useEffect + router.push): page JavaScript runs, renders the protected content briefly, then redirects. Users see a flash of protected content.',
      'Middleware: the redirect happens before the page HTML is returned. Zero flash, zero exposure.',
      'Edge runtime: middleware runs in a V8 isolate (not Node.js), milliseconds from the user. Adds ~1ms latency.',
    ]),
  pgBreak(),

  // ── 2.4 GITHUB ACTIONS ──────────────────────────────────────────────────────
  h1('2.4 — GitHub Actions CI/CD Pipeline'),
  summaryTable([
    ['What',   'Automated: git push → build → ECR push → SSH deploy → health check'],
    ['Why',    'Repeatable, auditable deployments; OIDC eliminates long-lived AWS credentials'],
    ['Files',  '.github/workflows/deploy.yml'],
    ['Status', 'DONE — pipeline defined; OIDC role setup required before first automated run'],
  ]),
  spacer(),

  h2('Pipeline Steps'),
  code([
    'Trigger: push to main branch',
    '',
    '1. Checkout code          (actions/checkout@v4)',
    '2. OIDC AWS auth          (aws-actions/configure-aws-credentials@v4)',
    '3. ECR login              (aws-actions/amazon-ecr-login@v2)',
    '4. Docker build + push    (docker build + docker push)',
    '   Tags: :${{ github.sha }} + :latest',
    '5. SSH into EC2:',
    '   a. ECR login on EC2',
    '   b. docker pull $IMAGE:$SHA',
    '   c. docker stop raagpath-app (graceful, ignores error if not running)',
    '   d. docker rm raagpath-app',
    '   e. docker run -d --restart unless-stopped -p 8080:8080 --env-file ...',
    '   f. sleep 10 && curl -sf http://localhost:8080/api/health || exit 1',
    '      (exit 1 fails the workflow if health check fails)',
    '6. Delete SSH key file    (rm -f /tmp/raagpath-key.pem)',
  ]),
  spacer(),

  h2('OIDC — The Right Way to Authenticate CI/CD to AWS'),
  para('The naive approach: create an IAM user, generate an Access Key + Secret Key, store them in GitHub Secrets, use them in the workflow. This is an anti-pattern: long-lived credentials that can be rotated but never truly invalidated, stored in a secret store, readable by anyone with repo admin access.'),
  para('OIDC (OpenID Connect) federated identity eliminates this entirely:'),
  code([
    'How OIDC Works in GitHub Actions:',
    '',
    '1. GitHub Actions is an OIDC identity provider (IdP).',
    '   Each workflow run gets a signed JWT from GitHub:',
    '   { "sub": "repo:prachi-patil/raagpath:ref:refs/heads/main", ... }',
    '',
    '2. AWS IAM has an OIDC provider configured to trust GitHub:',
    '   Provider URL: https://token.actions.githubusercontent.com',
    '   Audience: sts.amazonaws.com',
    '',
    '3. The workflow calls AssumeRoleWithWebIdentity:',
    '   "Here is my GitHub-signed JWT. I want to assume role AWS_ROLE_ARN."',
    '',
    '4. AWS IAM validates:',
    '   - JWT signature (against GitHub JWKS endpoint)',
    '   - Trust policy: does this role allow this GitHub repo/branch?',
    '   - Returns temporary credentials (valid for 1 hour)',
    '',
    '5. Workflow uses temporary credentials: access expires after the job.',
    '   No stored secrets. No rotation needed. No credential leak risk.',
  ]),
  spacer(),

  h3('IAM Role Trust Policy'),
  code([
    '{',
    '  "Version": "2012-10-17",',
    '  "Statement": [{',
    '    "Effect": "Allow",',
    '    "Principal": {',
    '      "Federated": "arn:aws:iam::ACCOUNT:oidc-provider/token.actions.githubusercontent.com"',
    '    },',
    '    "Action": "sts:AssumeRoleWithWebIdentity",',
    '    "Condition": {',
    '      "StringEquals": {',
    '        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",',
    '        "token.actions.githubusercontent.com:sub":',
    '          "repo:prachi-patil/raagpath:ref:refs/heads/main"',
    '      }',
    '    }',
    '  }]',
    '}',
    '// Only pushes to main branch of this exact repo can assume this role.',
    '// A fork or a PR branch cannot assume this role.',
  ]),

  h2('Health Check After Deployment'),
  code([
    'sleep 10  # Give Spring Boot time to start (JVM warmup + Flyway migrations)',
    'curl -sf http://localhost:8080/api/health || exit 1',
    '# -s = silent (no progress bar)',
    '# -f = fail with non-zero exit code on HTTP 4xx/5xx',
    '# exit 1 = fail the GitHub Actions job, sending alert email',
  ]),
  callout('Why This Matters: Deployment Verification',
    [
      'Without a health check: the workflow says "deployment successful" even if Spring Boot crashed.',
      'With a health check: the workflow fails, GitHub sends an alert, the old container is not running (gap!). Room for improvement: add rollback logic.',
      'Production pattern: blue-green deployment — keep old container running until new one passes health check. Implement in Day 5 or post-MVP.',
    ]),
  pgBreak(),

  // ── 2.5 DOCKER COMPOSE ──────────────────────────────────────────────────────
  h1('2.5 — Docker Compose: App + Redis'),
  summaryTable([
    ['What',   'docker-compose.yml orchestrating app container + Redis container on a private bridge network'],
    ['Why',    'Multi-container coordination, service discovery, and persistent volumes in one file'],
    ['Files',  'docker-compose.yml, .env.example'],
    ['Status', 'DONE — docker compose up -d starts both services; app reaches Redis on internal network'],
  ]),
  spacer(),

  h2('The docker-compose.yml'),
  code([
    'services:',
    '  app:',
    '    image: public.ecr.aws/v8m0u4l8/raagpath:latest',
    '    container_name: raagpath-app',
    '    restart: unless-stopped',
    '    ports:',
    '      - "8080:8080"       # Host:Container — Nginx proxies to host port 8080',
    '    environment:',
    '      - SPRING_DATASOURCE_URL=${SPRING_DATASOURCE_URL}',
    '      - DB_USERNAME=${DB_USERNAME}',
    '      - DB_PASSWORD=${DB_PASSWORD}',
    '      - JWT_SECRET=${JWT_SECRET}',
    '      - REDIS_HOST=redis  # Container name = hostname on raagpath-net',
    '      - REDIS_PORT=6379',
    '      - SPRING_PROFILES_ACTIVE=prod',
    '    depends_on:',
    '      - redis',
    '    healthcheck:',
    '      test: ["CMD", "curl", "-sf", "http://localhost:8080/api/health"]',
    '      interval: 30s',
    '      timeout: 5s',
    '      retries: 3',
    '      start_period: 10s',
    '',
    '  redis:',
    '    image: redis:7-alpine',
    '    container_name: raagpath-redis',
    '    restart: unless-stopped',
    '    volumes:',
    '      - redis_data:/data  # Persists across container restarts',
    '',
    'volumes:',
    '  redis_data:',
    '',
    'networks:',
    '  default:',
    '    name: raagpath-net',
    '    driver: bridge',
  ]),
  spacer(),

  h2('Docker Compose Networking — How Service Discovery Works'),
  para('When Docker Compose creates a bridge network (raagpath-net), it creates a virtual network switch within the Linux kernel (using the bridge driver). Each container gets a private IP on this network. Docker\'s embedded DNS resolver maps container names to IPs:'),
  bullet('app container: IP 172.20.0.2, hostname "app"'),
  bullet('redis container: IP 172.20.0.3, hostname "redis"'),
  bullet('REDIS_HOST=redis: Spring Boot resolves "redis" to the Redis container IP via Docker DNS. No hardcoded IPs.'),
  bullet('If the Redis container restarts and gets a new IP, DNS still resolves correctly. Service discovery without a service mesh.'),
  spacer(),

  h3('Named Volumes vs Bind Mounts'),
  code([
    '# Named volume (what we use)',
    'volumes:',
    '  redis_data:  # Docker manages location: /var/lib/docker/volumes/redis_data/',
    '',
    '# Bind mount (alternative)',
    'volumes:',
    '  - /home/ec2-user/redis-data:/data  # Host path explicitly specified',
  ]),
  bullet('Named volumes: Docker manages the lifecycle. Data survives container rm and docker compose down (without -v flag). Portable across environments.'),
  bullet('Bind mounts: explicit host path. More control, but you manage permissions, backup, and path consistency across machines.'),
  bullet('For Redis persistence: named volume is correct — we want data to survive container updates but not worry about host paths.'),
  callout('depends_on Is Not a Health Guarantee',
    [
      'depends_on: [redis] means Docker starts the Redis container before the app container.',
      'It does NOT wait for Redis to be ready to accept connections. Spring Boot may start before Redis finishes binding.',
      'Mitigation: Spring Data Redis has connection retry with exponential backoff by default.',
      'Production solution: use depends_on with condition: service_healthy — requires Redis healthcheck in compose file.',
    ]),
  pgBreak(),

  // ── 2.6 REDIS ───────────────────────────────────────────────────────────────
  h1('2.6 — Redis Container'),
  summaryTable([
    ['What',   'Redis 7 Alpine container with persistent named volume on the raagpath-net bridge network'],
    ['Why',    'In-memory data structure store for current caching needs and future leaderboard/rate-limiting'],
    ['Files',  'docker-compose.yml (redis service), application.yml (spring.data.redis)'],
    ['Status', 'DONE — Redis reachable from app container at redis:6379'],
  ]),
  spacer(),

  h2('Why Redis (Not In-Memory Cache)'),
  para('Spring has an in-memory cache (@Cacheable with CaffeineCacheManager). Why add Redis complexity?'),
  bullet('Shared state: if we run 2 app instances (horizontal scaling), each has its own in-memory cache — cache invalidation becomes inconsistent. Redis is a shared cache all instances read/write.'),
  bullet('Persistence: Redis can persist data to disk (RDB snapshots + AOF append-only file). In-memory caches are lost on restart.'),
  bullet('Data structures: Redis is not just a key-value store. It has lists, sorted sets, sets, hashes — each with O(1) operations. The future leaderboard uses a sorted set; rate limiting uses a sliding window with sorted sets.'),
  bullet('Session store: storing practice session state in Redis (future) enables stateless horizontal scaling.'),
  spacer(),

  h2('Redis Data Structures — How They Apply to RaagPath'),
  table3(
    ['Structure',    'Redis Command',           'RaagPath Use Case'],
    [
      ['String',       'GET / SET / INCR',        'Cache user profile JSON; increment daily practice streak'],
      ['Hash',         'HGET / HSET / HMSET',     'Store practice session fields (userId, accuracy, duration)'],
      ['Sorted Set',   'ZADD / ZRANGE / ZRANK',   'Leaderboard: score=XP, member=userId, O(log n) rank lookup'],
      ['List',         'LPUSH / LRANGE',          'Recent practice sessions (sliding window, max 10 entries)'],
      ['Set',          'SADD / SISMEMBER',        'Active users in a time window (online presence)'],
    ]
  ),
  spacer(),

  h2('Redis Persistence: RDB + AOF'),
  para('redis:7-alpine is configured with default persistence settings:'),
  bullet('RDB (Redis Database): point-in-time snapshots. Default: save after 900 seconds if 1+ keys changed, 300 seconds if 10+ keys changed, 60 seconds if 10000+ keys changed. Fast startup, compact file.'),
  bullet('AOF (Append-Only File): log every write operation. More durable, larger file. Not enabled by default.'),
  bullet('For RaagPath MVP: RDB only is fine. Worst case: Redis restarts, lose a few seconds of data. XP is recalculated from practice_sessions table (the source of truth is PostgreSQL).'),
  callout('Redis Is Not Your Source of Truth',
    [
      'XP totals live in the users table in PostgreSQL. Redis caches them for fast reads.',
      'If Redis data is lost: invalidate cache, re-read from PostgreSQL. No data loss.',
      'Pattern: cache-aside (lazy loading). Read: check Redis first; on miss, read PostgreSQL, populate Redis.',
      'Never store data in Redis that you cannot recover from PostgreSQL.',
    ]),
  pgBreak(),

  // ── 2.7 NGINX ───────────────────────────────────────────────────────────────
  h1('2.7 — Nginx Reverse Proxy'),
  summaryTable([
    ['What',   'Host-installed Nginx on EC2; proxies port 80 to Spring Boot on port 8080'],
    ['Why',    'Security headers, future TLS termination, request buffering, single entry point'],
    ['Files',  'infra/nginx/raagpath.conf'],
    ['Status', 'DONE — config file created; deploy to EC2 with sudo cp + nginx -t + systemctl reload'],
  ]),
  spacer(),

  h2('The Nginx Configuration'),
  code([
    'server {',
    '    listen 80;',
    '    server_name _;  # Match any domain (replace with domain on Day 5)',
    '',
    '    # Security headers (defense-in-depth at the proxy layer)',
    '    add_header X-Frame-Options       "SAMEORIGIN"   always;',
    '    add_header X-Content-Type-Options "nosniff"     always;',
    '    add_header Referrer-Policy       "strict-origin" always;',
    '',
    '    # Proxy all traffic to Spring Boot (loopback — fastest path)',
    '    location / {',
    '        proxy_pass         http://127.0.0.1:8080;',
    '        proxy_http_version 1.1;',
    '        proxy_set_header   Host              $host;',
    '        proxy_set_header   X-Real-IP         $remote_addr;',
    '        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;',
    '        proxy_set_header   X-Forwarded-Proto $scheme;',
    '        proxy_read_timeout 60s;',
    '        proxy_send_timeout 60s;',
    '    }',
    '',
    '    client_max_body_size 20M;  # Audio file uploads (Day 5)',
    '}',
  ]),
  spacer(),

  h2('Security Headers — What Each Does'),
  table3(
    ['Header',                    'Value',           'Attack Prevented'],
    [
      ['X-Frame-Options',           'SAMEORIGIN',      'Clickjacking: page cannot be embedded in an iframe on another domain'],
      ['X-Content-Type-Options',    'nosniff',         'MIME sniffing: browser must use declared Content-Type, not guess it'],
      ['Referrer-Policy',           'strict-origin',   'Referrer leakage: sends only origin (not full URL) in cross-origin requests'],
    ]
  ),
  spacer(),

  h2('How Nginx Works — Architecture'),
  para('Nginx uses an event-driven, non-blocking architecture — fundamentally different from Apache\'s process-per-connection or thread-per-connection model.'),
  code([
    'Nginx process model:',
    '  master process  (1): reads config, manages workers',
    '  worker process  (N): N = number of CPU cores typically',
    '',
    '  Each worker:',
    '    - Runs a non-blocking event loop (epoll on Linux)',
    '    - Can handle thousands of connections simultaneously',
    '    - Does NOT block on I/O: while waiting for backend response,',
    '      worker handles other connections',
    '',
    '  Result: a single Nginx worker can handle 10,000+ concurrent connections',
    '  (the C10K problem — Apache struggled here; Nginx was built to solve it)',
  ]),
  spacer(),

  h3('Why Host-Installed (Not Containerized)'),
  bullet('No container-to-container network hop: Nginx → app container would require host networking or a Docker network. Host-installed Nginx proxies to 127.0.0.1:8080 — a loopback call, fastest possible path.'),
  bullet('TLS termination simplicity: certbot integrates directly with host Nginx. Containerized Nginx needs volume mounts for certificates — more complexity for the same result.'),
  bullet('Port 80/443 binding: Nginx binds directly to host ports 80 and 443. No port remapping needed.'),
  bullet('Trade-off: Nginx version managed by OS, not Docker. For this single-server deployment, acceptable.'),
  spacer(),

  h3('The proxy_set_header Lines'),
  code([
    'proxy_set_header Host              $host;',
    '# Tells Spring Boot the requested hostname. Without this, Host header = 127.0.0.1:8080',
    '',
    'proxy_set_header X-Real-IP         $remote_addr;',
    '# Passes client\'s real IP to Spring Boot. Without this, $remote_addr = 127.0.0.1 (Nginx)',
    '',
    'proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;',
    '# Standard: "client-ip, proxy1-ip" chain for multi-proxy deployments',
    '',
    'proxy_set_header X-Forwarded-Proto $scheme;',
    '# Tells Spring Boot whether original request was HTTP or HTTPS.',
    '# Spring Boot uses this to generate correct absolute URLs in redirects.',
    '# In application.yml: server.forward-headers-strategy=native reads these headers.',
  ]),
  callout('Day 5: TLS Setup with certbot --nginx',
    [
      'certbot --nginx -d raagpath.example.com reads the Nginx config, obtains a Let\'s Encrypt certificate, and automatically edits raagpath.conf to add SSL configuration.',
      'The existing raagpath.conf structure is already correct for certbot to work with.',
      'Post-TLS: add HSTS header (Strict-Transport-Security: max-age=31536000; includeSubDomains).',
      'Let\'s Encrypt rate limit: 5 certificate requests per domain per week. Do not test in a loop.',
    ]),
  pgBreak(),

  // ── CLOSING ──────────────────────────────────────────────────────────────────
  h1('Day 2 — Retrospective & Engineering Decisions'),
  para('Day 2 delivered a production-grade authentication system and a zero-touch deployment pipeline. The combination of stateless JWT auth, OIDC CI/CD, Docker Compose networking, and Nginx reverse proxy represents the complete infrastructure that will support all future RaagPath features.'),
  spacer(),

  h2('Engineering Decision Matrix'),
  table3(
    ['Decision',                  'Choice',                'Rejected Alternative'],
    [
      ['Password hashing',          'BCrypt (adaptive)',      'MD5/SHA-1 — not designed for passwords, rainbow table vulnerable'],
      ['Token format',              'JWT (stateless)',        'Session cookies (stateful) — requires shared session store from day 1'],
      ['JWT signing',               'HMAC-SHA256 (HS256)',    'RSA (RS256) — unnecessary until multi-service architecture'],
      ['AWS auth from CI',          'OIDC (temporary creds)', 'IAM user access keys — long-lived, rotation burden, leak risk'],
      ['Multi-container',           'Docker Compose',         'Kubernetes — 512MB RAM overhead, free tier incompatible'],
      ['Redis placement',           'Docker container',       'Managed ElastiCache — $0.017/hr, unnecessary for MVP'],
      ['Nginx placement',           'Host-installed',         'Docker container — extra network hop, certbot complexity'],
      ['JWT expiry',                '24 hours',               '7 days — larger attack window if token compromised'],
    ]
  ),
  spacer(),

  h2('Security Posture After Day 2'),
  bullet('Passwords: BCrypt hashed with salt. Plaintext never stored, never logged.'),
  bullet('Tokens: JWT with 24h expiry. No long-lived credentials in code or config.'),
  bullet('Database: never directly accessible from internet. EC2 SG required.'),
  bullet('CI/CD credentials: OIDC. No AWS keys stored in GitHub Secrets.'),
  bullet('Headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy on all responses.'),
  bullet('Remaining gaps: no HTTPS yet (Day 5), no rate limiting yet (Day 3+), no CSRF token (SameSite=Strict mitigates).'),
  spacer(),

  h2('What Comes Next (Day 3)'),
  bullet('3.1 Mic Input + Pitchy: Web Audio API, AudioContext, AnalyserNode, real-time Hz detection loop.'),
  bullet('3.2 Signal Smoothing: debounce + rolling average to eliminate microphone noise jitter.'),
  bullet('3.3 Hz-to-Swara Mapping: 12-semitone equal temperament mapping to Sa Re Ga Ma Pa Dha Ni with shruti (tonic) transposition.'),
  bullet('3.4 Tanpura Drone: Tone.js synthesis of the Sa-Pa-Sa-Ni drone pattern, fundamental to Hindustani practice.'),
  bullet('3.5 Sur Accuracy Meter: real-time visual feedback, colour-coded pitch accuracy (green/amber/red).'),
  bullet('3.6 Target Swara Display: the UI element that tells you what to sing and confirms when you hit it.'),
  spacer(400),

  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 80 },
    children: [new TextRun({ text: 'RaagPath — Day 2 Deep Dive', size: 18, color: C.mid, font: 'Arial' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Senior Staff Engineer Portfolio | March 2026', size: 18, color: C.mid, font: 'Arial' })],
  }),
];

// ═══════════════════════════════════════════════════════════════════════════════
//  BUILD DOCUMENT
// ═══════════════════════════════════════════════════════════════════════════════
const doc = new Document({
  styles: {
    default: { document: { run: { font: 'Arial', size: 22, color: C.dark } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 34, bold: true, font: 'Arial', color: C.deepBlue },
        paragraph: { spacing: { before: 400, after: 160 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 28, bold: true, font: 'Arial', color: C.deepBlue },
        paragraph: { spacing: { before: 320, after: 120 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 23, bold: true, font: 'Arial', color: C.midBlue },
        paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      { reference: 'bullets', levels: [
        { level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
      ]},
      { reference: 'sub', levels: [
        { level: 0, format: LevelFormat.BULLET, text: '\u25E6', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 1080, hanging: 360 } } } },
      ]},
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    headers: {
      default: new Header({ children: [new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.lightBlue, space: 1 } },
        spacing: { after: 120 },
        children: [
          new TextRun({ text: 'RaagPath — Day 2 Deep Dive', size: 18, color: C.mid, font: 'Arial' }),
          new TextRun({ text: '    Authentication System & Deployment Pipeline', size: 18, italics: true, color: C.mid, font: 'Arial' }),
        ],
      })] }),
    },
    footers: {
      default: new Footer({ children: [new Paragraph({
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.lightBlue, space: 1 } },
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({ text: 'Page ', size: 18, color: C.mid, font: 'Arial' }),
          new TextRun({ children: [PageNumber.CURRENT], size: 18, color: C.mid, font: 'Arial' }),
          new TextRun({ text: ' | Senior Staff Engineer Portfolio', size: 18, color: C.mid, font: 'Arial' }),
        ],
      })] }),
    },
    children,
  }],
});

Packer.toBuffer(doc).then(buf => {
  const outPath = 'C:\\ClaudeWorkspace\\Raag\\docs\\RaagPath-Day2-Deep-Dive.docx';
  fs.writeFileSync(outPath, buf);
  console.log('Written: ' + outPath);
}).catch(err => { console.error(err); process.exit(1); });
