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
  rowAlt   : 'F0F6FB', headerBg: '2C4A7C',
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
const paraRuns = runs => new Paragraph({ spacing: { after: 160 }, children: runs });
const tr  = (t, o={}) => new TextRun({ text: t, size: 22, color: C.dark, font: 'Arial', ...o });
const trB = (t, c=C.deepBlue) => new TextRun({ text: t, bold: true, size: 22, color: c, font: 'Arial' });
const trI = t => new TextRun({ text: t, italics: true, size: 22, color: C.mid, font: 'Arial' });
const trC = t => new TextRun({ text: t, font: 'Courier New', size: 20, color: '444444' });

const bullet = (text, opts={}) => new Paragraph({
  numbering: { reference: 'bullets', level: 0 }, spacing: { after: 80 },
  children: [new TextRun({ text, size: 22, color: C.dark, font: 'Arial', ...opts })],
});
const bRuns = runs => new Paragraph({
  numbering: { reference: 'bullets', level: 0 }, spacing: { after: 80 }, children: runs,
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

// ─── Tech stack table ─────────────────────────────────────────────────────────
const techTable = rows => new Table({
  width: { size: 9360, type: WidthType.DXA }, columnWidths: [2400, 3480, 3480],
  rows: [
    new TableRow({ tableHeader: true, children: ['Layer', 'Technology', 'Rationale'].map((h, ci) => new TableCell({
      shading: { fill: C.headerBg, type: ShadingType.CLEAR }, borders: allB(C.headerBg),
      margins: { top: 100, bottom: 100, left: 140, right: 140 },
      width: { size: [2400,3480,3480][ci], type: WidthType.DXA },
      children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: C.white, size: 20, font: 'Arial' })] })],
    })) }),
    ...rows.map(([a,b,c], i) => new TableRow({ children: [a,b,c].map((val, ci) => new TableCell({
      shading: { fill: i%2===0 ? C.white : C.rowAlt, type: ShadingType.CLEAR },
      borders: allB('CCCCCC'), margins: { top: 80, bottom: 80, left: 140, right: 140 },
      width: { size: [2400,3480,3480][ci], type: WidthType.DXA },
      children: [new Paragraph({ children: [new TextRun({ text: val, size: 20, color: C.dark, font: 'Arial' })] })],
    })) })),
  ],
});

// ─── Page break ───────────────────────────────────────────────────────────────
const pgBreak = () => new Paragraph({ children: [new PageBreak()] });

// ═══════════════════════════════════════════════════════════════════════════════
//  DOCUMENT CONTENT
// ═══════════════════════════════════════════════════════════════════════════════
const children = [

  // ── TITLE PAGE ──────────────────────────────────────────────────────────────
  spacer(800),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new TextRun({ text: 'RaagPath', bold: true, size: 64, color: C.deepBlue, font: 'Arial' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: 'Day 1 — Technical Deep Dive', bold: true, size: 40, color: C.saffron, font: 'Arial' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({ text: 'Infrastructure Provisioning & Project Scaffold', size: 28, color: C.mid, font: 'Arial' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({ text: 'Senior Staff Engineer Portfolio', italics: true, size: 24, color: C.mid, font: 'Arial' })],
  }),
  spacer(80),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({ text: 'March 2026', size: 22, color: C.mid, font: 'Arial' })],
  }),
  pgBreak(),

  // ── EXECUTIVE SUMMARY ───────────────────────────────────────────────────────
  h1('Executive Summary'),
  para('Day 1 of the RaagPath project established the entire production-grade infrastructure foundation and application scaffold in approximately 5 hours. By the end of the day, a containerized Spring Boot application served a Hello World response on localhost:8080, with all underlying AWS infrastructure provisioned, version-controlled, and ready for application code.'),
  para('This document is a deep-dive reference for each of the seven Day 1 submodules — written for a senior staff engineer audience. Each section covers not just what was done, but why specific architectural choices were made, what alternatives were considered and rejected, and how each component works at a technical level.'),
  spacer(),

  h2('The Pivotal Architectural Decision: Path A — Docker Direct'),
  para('The original plan called for k3s (lightweight Kubernetes) on the EC2 instance. After provisioning, the free-tier t2.micro instance (1 GiB RAM) had only ~70 MB of free memory — well below k3s\'s minimum requirement of ~512 MB. Rather than upgrade to t3.small ($0.0208/hr, ~$15/month), we chose Path A: Docker containers deployed directly on EC2 without an orchestrator.'),
  callout('Architecture Trade-off: YAGNI at Infrastructure Level',
    [
      'Kubernetes adds ~512 MB RAM overhead, etcd for state, kubelet + kube-proxy processes.',
      'For a single-server MVP with <100 concurrent users, this is pure overhead with zero benefit.',
      'When scale demands it: ECS Fargate or EKS are clean migration paths — our Docker images are OCI-compliant and portable.',
      '"Always Kubernetes" is a cargo-cult. Right-size your infrastructure to your actual load.',
    ]),
  spacer(),

  h2('Day 1 Technology Stack'),
  techTable([
    ['Compute',    'EC2 t2.micro (Amazon Linux 2023)',       'Free tier, burstable CPU credits, ~30 RPS capacity'],
    ['Database',   'RDS PostgreSQL t3.micro (managed)',      'ACID transactions, automated backups, zero-ops'],
    ['Storage',    'S3 (object storage)',                    'Audio assets, pre-signed URLs, CDN-ready'],
    ['IaC',        'Terraform',                              'Declarative, version-controlled, idempotent'],
    ['Runtime',    'Docker Engine (no orchestrator)',        'Free tier constraint; container portability'],
    ['Backend',    'Spring Boot 3.3 + Java 21',             'Autoconfiguration, virtual threads, ecosystem'],
    ['Frontend',   'Next.js 16 (static export)',            'App Router, Tailwind, no Node.js in prod'],
    ['Registry',   'ECR Public',                            'No rate limits, IAM-native, AWS ecosystem'],
    ['Packaging',  'Multi-stage Dockerfile',                'Small runtime image, build toolchain excluded'],
  ]),
  pgBreak(),

  // ── 1.1 AWS INFRASTRUCTURE ──────────────────────────────────────────────────
  h1('1.1 — AWS Infrastructure Provisioning'),
  summaryTable([
    ['What',   'EC2 t2.micro + RDS t3.micro PostgreSQL + S3 bucket, all provisioned via Terraform'],
    ['Why',    'Free-tier AWS resources give production-parity without cost; IaC ensures repeatability'],
    ['Files',  'infra/ec2.tf, infra/rds.tf, infra/s3.tf, infra/vpc.tf, infra/outputs.tf'],
    ['Status', 'DONE — all three resources running, EC2 SSHable, RDS endpoint verified'],
  ]),
  spacer(),

  h2('What We Built'),
  para('Three AWS resources form the foundation: an EC2 t2.micro compute instance running Amazon Linux 2023, an RDS t3.micro PostgreSQL 16 managed database instance with a 20 GB gp2 SSD, and an S3 bucket for future audio asset storage. All were provisioned with Terraform, treating infrastructure as version-controlled code.'),

  h2('Why Infrastructure as Code (Terraform)'),
  para('Manually clicking through the AWS console is fine once — but you\'ll need to recreate this environment for staging, for disaster recovery, and for onboarding new engineers. IaC solves this with three properties:'),
  bullet('Declarative: describe desired end-state, not imperative steps. Terraform figures out the sequence.'),
  bullet('Idempotent: running terraform apply twice produces the same result. Safe to re-run.'),
  bullet('Version controlled: infrastructure changes go through git commits and code review — just like application code.'),
  bullet('Drift detection: terraform plan shows if manual changes were made outside of Terraform.'),
  spacer(),
  para('Alternatives considered and rejected:'),
  bullet('AWS CDK: TypeScript-native IaC with higher abstraction. Better for large AWS-heavy projects, but heavier learning curve for a 5-day sprint.'),
  bullet('Pulumi: similar to CDK but language-agnostic. Excellent, but overkill for MVP.'),
  bullet('CloudFormation: AWS-native, verbose YAML/JSON, inferior DX compared to Terraform HCL.'),
  bullet('Manual console: eliminated because it\'s not reproducible, not reviewable, and creates undocumented "snowflake" infrastructure.'),
  spacer(),

  h2('Why Each Specific Resource'),
  h3('EC2 t2.micro'),
  para('t2.micro sits in the AWS burstable performance family. The machine earns CPU credits when utilization is below its baseline (10% for t2.micro). During a spike (user registration storm, for example), it burns credits at up to 100% CPU. For a music practice app with bursty usage patterns, this is ideal — practice sessions have bursts of API activity followed by silence.'),
  bullet('Free tier: 750 hours/month for 12 months — effectively free while bootstrapping.'),
  bullet('Performance ceiling: approximately 30 requests/second at 50 ms latency before credit exhaustion. Sufficient for MVP.'),
  bullet('Upgrade path: t3.small (2 GB RAM, $0.0208/hr) when free tier expires — a one-line Terraform change.'),
  bullet('Not Lambda/Fargate: Spring Boot has a ~2-3 second cold start, making it unsuitable for serverless. Lambda functions should be stateless microservices, not full Spring Boot apps.'),

  h3('RDS t3.micro PostgreSQL'),
  para('RDS is a managed relational database service. "Managed" means AWS handles OS patching, binary log management, automated backups (7-day retention, point-in-time recovery), failover (with Multi-AZ), and minor version upgrades.'),
  bullet('PostgreSQL choice: ACID transactions for XP accounting integrity. JSONB columns for future raga metadata. pgvector extension readiness for AI-powered raga recommendation features.'),
  bullet('Managed vs self-hosted: self-hosting PostgreSQL on EC2 is possible but adds operational burden — you own backups, patching, and HA. For a startup, RDS pays for itself in engineer time saved.'),
  bullet('Multi-AZ path: currently Single-AZ (no failover). Flipping to Multi-AZ is a one-click change that RDS handles without migration.'),
  bullet('gp2 storage: 20 GB general-purpose SSD. At 3 IOPS/GB baseline (60 IOPS), adequate for MVP. gp3 would be cheaper and faster at scale.'),

  h3('S3 Bucket'),
  para('Amazon S3 is object storage with 11 nines (99.999999999%) durability. Objects are redundantly stored across multiple Availability Zones within a region. For RaagPath, this stores reference audio clips for ragas — files that are written once and read many times.'),
  bullet('Pre-signed URLs: generate a time-limited URL server-side, return it to the client. Client downloads directly from S3 — no proxying through the app server (saves bandwidth and latency).'),
  bullet('Cost: $0.023/GB/month storage + $0.0004/1000 GET requests. A 10 MB raga clip served 1,000 times/day costs ~$0.04/day.'),
  bullet('CDN-ready: placing CloudFront in front of S3 adds global edge caching with zero architecture changes.'),

  h2('Terraform File Structure'),
  code([
    'infra/',
    '  ec2.tf          # EC2 instance + IAM role for ECR pull + SSH key pair',
    '  rds.tf          # RDS instance + subnet group + parameter group',
    '  s3.tf           # S3 bucket + lifecycle rules + CORS policy for browser upload',
    '  vpc.tf          # VPC + subnets + internet gateway + route tables',
    '  outputs.tf      # EC2 public IP, RDS endpoint, S3 bucket name',
    '  variables.tf    # Input variable declarations',
    '  terraform.tfvars # Actual variable values (gitignored — never committed)',
  ]),
  callout('Senior Engineer Note: Terraform State',
    [
      'terraform.tfstate is the source of truth for what Terraform has deployed. Lose it and Terraform loses track of your infrastructure.',
      'For MVP: state stored locally (fine for solo dev). For teams: store state in S3 + DynamoDB locking (terraform init -backend-config).',
      'Never commit terraform.tfvars (contains secrets) or .terraform/ (local provider cache) to git.',
    ]),
  pgBreak(),

  // ── 1.2 SECURITY GROUPS ─────────────────────────────────────────────────────
  h1('1.2 — Security Groups & RDS Connectivity'),
  summaryTable([
    ['What',   'AWS Security Groups configured for EC2 (SSH/HTTP) and RDS (Postgres from EC2 only)'],
    ['Why',    'Defense-in-depth: RDS is never directly reachable from the internet'],
    ['Files',  'Security group rules embedded in infra/ec2.tf and infra/rds.tf'],
    ['Status', 'DONE — verified: psql from EC2 to RDS succeeds; direct connection from laptop blocked'],
  ]),
  spacer(),

  h2('What We Built'),
  para('Two security groups control network traffic. The EC2 security group allows inbound SSH (port 22) from a specific admin IP, HTTP (port 80), and HTTPS (port 443) from anywhere. The RDS security group allows inbound PostgreSQL (port 5432) exclusively from the EC2 security group — not from any IP address, and crucially not from the internet.'),

  h2('Security Groups vs Network ACLs'),
  para('AWS provides two layers of network security:'),
  bullet('Security Groups (SG): stateful, applied at the instance level, evaluates all rules before deciding.'),
  bullet('Network ACLs (NACL): stateless, applied at the subnet level, rules evaluated in number order.'),
  spacer(),
  para('Stateful vs stateless is the critical difference. Security groups track connection state: if you send a request, the return traffic is automatically allowed without an explicit outbound rule. NACLs are stateless: you must explicitly allow both inbound and outbound for each connection, including return traffic. For our use case, security groups provide the right abstraction at the right level.'),

  h2('Why Reference the EC2 Security Group (Not an IP)'),
  code([
    '# In rds.tf — RDS ingress rule',
    'ingress {',
    '  from_port       = 5432',
    '  to_port         = 5432',
    '  protocol        = "tcp"',
    '  security_groups = [aws_security_group.ec2_sg.id]  # Reference SG, not IP',
    '}',
  ]),
  para('If the EC2 instance is replaced (say, after a crash requiring a new instance), the new instance gets the same security group. The RDS rule automatically allows the new instance — no manual IP update needed. IP-based rules would break every time the EC2 instance is restarted.'),

  h2('Verification (Critical — Do Before Writing App Code)'),
  code([
    '# From EC2 terminal after SSH in',
    'psql -h <rds-endpoint>.us-east-1.rds.amazonaws.com \\',
    '     -U raagpath -d raagpath -p 5432',
    '# Expected: Password prompt -> successful connection',
    '',
    '# From your laptop (should FAIL)',
    'psql -h <rds-endpoint> -U raagpath  # Connection timeout -> security group working',
  ]),
  callout('Why Verify Network Before Writing Application Code',
    [
      'If you discover connectivity issues after writing auth code, you now have two systems to debug simultaneously.',
      'Isolating infra vs app bugs is a fundamental debugging discipline: verify each layer independently before building on top of it.',
      'Classic mistake: spend 2 hours debugging a Spring Boot DataSource exception that is actually a security group misconfiguration.',
    ]),
  pgBreak(),

  // ── 1.3 DOCKER ON EC2 ───────────────────────────────────────────────────────
  h1('1.3 — Docker on EC2'),
  summaryTable([
    ['What',   'Docker Engine installed on EC2, ec2-user added to docker group'],
    ['Why',    'Containerization for reproducible, isolated, portable application deployment'],
    ['Files',  'No files — EC2 system configuration (run once during provisioning)'],
    ['Status', 'DONE — docker run hello-world succeeds on EC2'],
  ]),
  spacer(),

  h2('Installation Commands'),
  code([
    'sudo yum install docker -y              # Install Docker Engine',
    'sudo systemctl enable docker            # Start on boot',
    'sudo systemctl start docker             # Start immediately',
    'sudo usermod -aG docker ec2-user        # No sudo needed for docker commands',
    '',
    '# Log out and back in for group membership to take effect',
    'docker run hello-world                  # Verify: pulls + runs test image',
  ]),

  h2('How Docker Works — Architecture Deep Dive'),
  para('Docker is a client-server architecture. The Docker CLI sends REST API calls to the Docker daemon (dockerd), which delegates container lifecycle management to containerd, which uses runc (an OCI-compliant runtime) to actually spawn processes. Understanding this stack is important for debugging.'),
  code([
    'Docker CLI  →  Docker daemon (dockerd)  →  containerd  →  runc  →  Linux kernel',
    '  (REST)         (management layer)       (lifecycle)   (spawn)   (namespaces/cgroups)',
  ]),
  spacer(),

  h3('Linux Kernel Features Docker Uses'),
  para('Docker\'s isolation is not virtualization — there is no hypervisor. Containers share the host OS kernel but are isolated using kernel primitives:'),
  bullet('PID Namespace: container processes have their own PID numbering. Container init is PID 1 inside the container, but has a different PID on the host.'),
  bullet('Network Namespace: each container gets a private network stack — its own eth0 interface, routing table, and IP address. This is how two containers can both listen on port 8080 without conflict.'),
  bullet('Mount Namespace: containers see an isolated filesystem. The host filesystem is not visible inside the container.'),
  bullet('UTS Namespace: each container can have its own hostname.'),
  bullet('User Namespace: maps container root (UID 0) to an unprivileged host user — rootless containers.'),
  bullet('cgroups (Control Groups): resource limiting. CPU quota (e.g., 0.5 CPU cores), memory hard limit (OOM kill when exceeded), block I/O throttling. We do not set explicit limits for the MVP but should for production.'),
  spacer(),

  h3('Union File System (OverlayFS)'),
  para('Docker images are composed of layers. Each Dockerfile instruction (FROM, COPY, RUN) creates a read-only layer. When a container starts, Docker adds a thin writable layer on top. This is copy-on-write: reads traverse layers from top to bottom; writes copy the file to the top writable layer.'),
  callout('Why This Matters for Build Performance',
    [
      'Two images that share the same base (e.g., eclipse-temurin:21-jre-alpine) share those layers on disk.',
      'On EC2: pulling a new version of your app image only downloads changed layers, not the entire image.',
      'Layer cache order in Dockerfile matters: put infrequently-changed instructions first (package.json COPY before source COPY).',
    ]),

  h2('Why Docker Over Alternatives'),
  bullet('vs VMs (EC2 AMI per service): Docker images are megabytes; VM images are gigabytes. Start time: 2s vs 60s. Density: 10x more containers than VMs per host.'),
  bullet('vs Podman: rootless by default, daemon-less. Excellent for security-conscious environments. We chose Docker for better GitHub Actions ecosystem integration and team familiarity.'),
  bullet('vs systemd services (bare JAR): would work, but loses environment isolation, port management, and image versioning. Rollback is "run the old JAR" — much less clean than docker pull.'),
  pgBreak(),

  // ── 1.4 SPRING BOOT ─────────────────────────────────────────────────────────
  h1('1.4 — Spring Boot 3.3 + Java 21 Scaffold'),
  summaryTable([
    ['What',   'Spring Boot 3.3 project with Gradle build, WAR packaging, JPA + Flyway + Redis deps'],
    ['Why',    'Industry-standard Java framework with excellent autoconfiguration and production readiness'],
    ['Files',  'build.gradle, src/main/resources/application.yml, HealthController.java'],
    ['Status', 'DONE — gradlew bootRun serves /api/health returning 200 OK'],
  ]),
  spacer(),

  h2('Why Spring Boot 3.3'),
  para('Spring Boot 3.3 (released mid-2024) is the current stable LTS release. It requires Java 17+ (we use Java 21), supports Jakarta EE 10 (javax.* → jakarta.* namespace migration), and includes GraalVM native image compilation support for sub-100ms startup times.'),
  bullet('Autoconfiguration: add a dependency to build.gradle and 90% of the wiring happens automatically. Spring Boot reads the classpath and configures beans accordingly.'),
  bullet('Production readiness out of the box: Spring Actuator provides /actuator/health, /actuator/metrics, graceful shutdown, structured JSON logging.'),
  bullet('Ecosystem: Spring Security (our JWT auth), Spring Data JPA (our repositories), Spring Data Redis (caching), Spring WebMVC (REST controllers).'),

  h2('Why Java 21 Specifically'),
  para('Java 21 is an LTS release (supported until September 2031). Beyond stability, it introduces Project Loom virtual threads — the most significant Java performance improvement in decades:'),
  code([
    '# application.yml',
    'spring:',
    '  threads:',
    '    virtual:',
    '      enabled: true   # Enable Project Loom virtual threads for all @Async + Tomcat',
  ]),
  para('Traditional Java threads are 1:1 with OS threads. Each OS thread consumes ~512 KB of stack memory. A t2.micro with 1 GB RAM can support roughly 2,000 traditional threads before exhaustion. Virtual threads are M:N — thousands of virtual threads are multiplexed onto a handful of OS threads. The JVM parks virtual threads at blocking operations (network I/O, database queries) and runs others. For RaagPath, each HTTP request on its own virtual thread means we can handle hundreds of concurrent practice sessions without thread pool tuning.'),
  bullet('Each HTTP request = one virtual thread. No thread pool size tuning needed.'),
  bullet('Database query blocking: virtual thread yields (parks), OS thread free for other work.'),
  bullet('Memory: virtual thread stack starts tiny, grows on demand (no 512 KB pre-allocation).'),

  h2('How Spring Boot Autoconfiguration Works'),
  para('This is the most important concept to understand about Spring Boot. The @SpringBootApplication annotation is actually three annotations combined:'),
  code([
    '@SpringBootApplication',
    '// = @Configuration + @EnableAutoConfiguration + @ComponentScan',
    '',
    '// @EnableAutoConfiguration reads:',
    '// META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports',
    '// This file lists 150+ AutoConfiguration classes that conditionally create beans',
    '',
    '// Example: DataSourceAutoConfiguration',
    '// Condition: PostgreSQL driver on classpath AND spring.datasource.url configured',
    '// Action: Creates HikariCP connection pool DataSource bean',
    '',
    '// Example: FlywayAutoConfiguration',
    '// Condition: Flyway on classpath AND DataSource available',
    '// Action: Runs pending migrations on startup (before any request is served)',
    '',
    '// Example: SecurityAutoConfiguration',
    '// Condition: Spring Security on classpath',
    '// Action: Enables HTTP Basic auth (we override with SecurityConfig.java)',
  ]),
  spacer(),

  h2('application.yml — Key Decisions'),
  code([
    'spring:',
    '  datasource:',
    '    url: ${SPRING_DATASOURCE_URL}     # 12-factor: secrets via env vars, never hardcoded',
    '    username: ${DB_USERNAME}',
    '    password: ${DB_PASSWORD}',
    '    hikari:',
    '      maximum-pool-size: 5            # t2.micro constraint: conserve connections',
    '      connection-timeout: 30000',
    '  jpa:',
    '    hibernate:',
    '      ddl-auto: validate              # Hibernate validates schema; Flyway owns DDL',
    '    open-in-view: false               # Disable OSIV: avoid lazy-loading N+1 surprises',
    '  flyway:',
    '    baseline-on-migrate: true         # Handles existing databases gracefully',
    '  data:',
    '    redis:',
    '      host: ${REDIS_HOST:localhost}   # ":localhost" = default if env var unset',
    '      port: ${REDIS_PORT:6379}',
    '',
    'server:',
    '  port: 8080',
    '  shutdown: graceful                  # Drain in-flight requests before shutdown',
  ]),
  callout('Why ddl-auto: validate (Not create-drop)',
    [
      'ddl-auto: create-drop drops and recreates tables on each restart. Safe for unit tests, catastrophic in production.',
      'ddl-auto: update tries to alter schema to match entities. Silent data loss risk (drops columns, fails on complex changes).',
      'ddl-auto: validate only checks entity definitions match DB schema. Fails loudly if there is a mismatch — Flyway is the single source of truth.',
      'Pattern: Flyway manages all DDL. JPA/Hibernate never touches the schema.',
    ]),
  pgBreak(),

  // ── 1.5 NEXT.JS ─────────────────────────────────────────────────────────────
  h1('1.5 — Next.js 16 Scaffold'),
  summaryTable([
    ['What',   'Next.js 16 app with App Router, static export, Tailwind CSS, TypeScript'],
    ['Why',    'React-based, static export eliminates Node.js server in production'],
    ['Files',  'frontend/next.config.ts, frontend/tailwind.config.ts, frontend/src/app/layout.tsx'],
    ['Status', 'DONE — next build produces static HTML/CSS/JS in /out directory'],
  ]),
  spacer(),

  h2('Why Static Export (Not SSR/SSG)'),
  para('Next.js supports three rendering modes: Server-Side Rendering (SSR — page generated on each request), Static Site Generation (SSG — page generated at build time), and Static Export (all pages pre-rendered to HTML files). We use Static Export.'),
  para('The key insight: with static export, the entire Next.js frontend compiles to plain HTML, CSS, and JavaScript files. Spring Boot serves these from src/main/resources/static/. There is no Node.js server running in production — the frontend is just files, and the Spring Boot JAR is the only server process.'),
  bullet('Single deployment unit: one Docker image, one process. Simpler ops, simpler debugging.'),
  bullet('No Node.js runtime cost: static files served by Spring Boot\'s built-in Tomcat at zero additional resource cost.'),
  bullet('Trade-off: no server-side rendering = no dynamic HTML at request time. All data fetching is client-side (API calls to Spring Boot). This is fine for a SPA-style music app.'),

  h2('App Router Architecture'),
  para('Next.js 16 uses the App Router (introduced in Next.js 13). The file system is the router:'),
  code([
    'frontend/src/app/',
    '  layout.tsx          # Root layout: <html><body> — applies to all pages',
    '  page.tsx            # Route: / (homepage)',
    '  login/page.tsx      # Route: /login',
    '  register/page.tsx   # Route: /register',
    '  dashboard/page.tsx  # Route: /dashboard',
    '  practice/page.tsx   # Route: /practice (Day 3)',
    '',
    'frontend/src/lib/',
    '  auth.ts             # Cookie helpers + API wrapper functions',
    '',
    'frontend/src/middleware.ts  # Edge middleware for route protection',
  ]),
  spacer(),

  h2('Tailwind CSS — How It Works'),
  para('Tailwind is a utility-first CSS framework. Instead of writing CSS files, you apply utility classes directly in your JSX. Tailwind scans your source files at build time and generates a CSS file containing only the classes you actually use (via PurgeCSS integration).'),
  code([
    '// Without Tailwind — separate CSS file needed',
    '<div className="card">  // card { padding: 2rem; background: white; border-radius: 16px; }',
    '',
    '// With Tailwind — inline utilities',
    '<div className="p-8 bg-white rounded-2xl shadow-xl">',
    '',
    '// RaagPath custom colors in tailwind.config.ts',
    'extend: {',
    '  colors: {',
    "    raga:    '#1a0a2e',   // Deep purple background",
    "    saffron: '#f59e0b',   // Saffron accent (Indian classical music theme)",
    '  }',
    '}',
  ]),
  callout('Senior Engineer Note: Why Not CSS-in-JS (styled-components, Emotion)',
    [
      'CSS-in-JS runs JavaScript at runtime to generate CSS — adds ~30 KB bundle + runtime overhead.',
      'Tailwind generates pure static CSS at build time: zero runtime cost.',
      'Trade-off: Tailwind classes in JSX can look verbose. Mitigated by extracting repeated patterns into components.',
    ]),
  pgBreak(),

  // ── 1.6 GITHUB + ECR ────────────────────────────────────────────────────────
  h1('1.6 — GitHub Repository & ECR Public Registry'),
  summaryTable([
    ['What',   'GitHub repo for source control + ECR Public gallery for Docker image registry'],
    ['Why',    'Source control + container registry with IAM-native auth and no rate limits'],
    ['Files',  '.gitignore, GitHub repo created, ECR public.ecr.aws/v8m0u4l8/raagpath'],
    ['Status', 'DONE — code pushed to GitHub, ECR public registry ready for CI/CD'],
  ]),
  spacer(),

  h2('ECR Public vs DockerHub vs GitHub Container Registry'),
  para('We chose Amazon ECR Public. The key differentiators:'),
  techTable([
    ['Feature',        'ECR Public',            'DockerHub (free)'],
    ['Rate limits',    'None',                  '100 pulls/6 hr (unauthenticated)'],
    ['Auth for push',  'AWS IAM (OIDC)',         'Username + token secret'],
    ['Auth for pull',  'None (public)',          'None (public repos)'],
    ['Storage',        'Free for public',       '1 private repo free'],
    ['AWS integration','Native IAM roles',      'Requires storing token in Secrets'],
    ['CI/CD',          'OIDC (no secrets)',      'Secret management required'],
  ]),
  spacer(),

  h2('Container Image Tagging Strategy'),
  para('Each push to main creates two tags:'),
  code([
    'docker tag raagpath:latest public.ecr.aws/v8m0u4l8/raagpath:${{ github.sha }}',
    'docker tag raagpath:latest public.ecr.aws/v8m0u4l8/raagpath:latest',
    '',
    '# SHA tag:    abc1234 — immutable, 1:1 mapping to a git commit',
    '# latest tag: mutable, always points to most recent build',
  ]),
  callout('Senior Engineer Note: Tag Immutability',
    [
      'Never deploy with :latest in production at scale. If a bad image is pushed, :latest points to it immediately — impossible to know what is running.',
      'Deploy with the git SHA tag: you can look up exactly which commit is running on any server.',
      'For MVP: :latest is pragmatically acceptable. For a team product: enforce SHA-based deploys in CI.',
    ]),
  pgBreak(),

  // ── 1.7 MULTI-STAGE DOCKERFILE ──────────────────────────────────────────────
  h1('1.7 — Multi-Stage Dockerfile'),
  summaryTable([
    ['What',   'Single Dockerfile with 3 stages: Next.js builder, Gradle builder, runtime image'],
    ['Why',    'Build tools excluded from final image; runtime image ~150 MB vs ~600 MB naive'],
    ['Files',  'Dockerfile, .dockerignore'],
    ['Status', 'DONE — docker build succeeds; docker run -p 8080:8080 serves /api/health'],
  ]),
  spacer(),

  h2('The Multi-Stage Build'),
  para('A naive Dockerfile copies all source code, installs npm + Gradle + JDK, builds everything, and ships the result — including all build tools. Multi-stage builds let you use heavy build environments without shipping them in the final image.'),
  code([
    '# ── Stage 1: Build Next.js static frontend ─────────────────────────────',
    'FROM node:20-alpine AS frontend-builder',
    'WORKDIR /app/frontend',
    'COPY frontend/package*.json ./',
    'RUN npm ci                               # Layer cached until package.json changes',
    'COPY frontend/ ./',
    'RUN npm run build                        # Outputs static files to /app/frontend/out',
    '',
    '# ── Stage 2: Build Spring Boot WAR ──────────────────────────────────────',
    'FROM eclipse-temurin:21-jdk-alpine AS backend-builder',
    'WORKDIR /app',
    'COPY build.gradle settings.gradle gradlew ./',
    'COPY gradle/ gradle/',
    'RUN ./gradlew dependencies --no-daemon   # Cache dependency download as separate layer',
    'COPY backend/src ./src',
    '# Pull the compiled frontend into Spring Boot static resources',
    'COPY --from=frontend-builder /app/frontend/out ./src/main/resources/static/',
    'RUN ./gradlew bootWar --no-daemon',
    '',
    '# ── Stage 3: Minimal runtime image ───────────────────────────────────────',
    'FROM eclipse-temurin:21-jre-alpine AS runtime',
    'WORKDIR /app',
    'COPY --from=backend-builder /app/build/libs/*.war app.war',
    'EXPOSE 8080',
    'ENTRYPOINT ["java", "-jar", "app.war"]',
  ]),
  spacer(),

  h2('Layer Caching — Why Order Matters'),
  para('Docker rebuilds from the first changed layer onwards. By separating dependency installation from source code copying, we ensure that changing a Java class only invalidates the COPY src layer — not the RUN ./gradlew dependencies layer (which downloads ~50 MB of JARs).'),
  bullet('package.json copied first: npm install (slow) cached unless package.json changes.'),
  bullet('build.gradle + gradlew copied before src: gradle dependencies (slow) cached unless dependencies change.'),
  bullet('Source code copied last: changes only invalidate compilation, not dependency download.'),
  bullet('Result: cold build 5 minutes → warm build (source change only) ~40 seconds.'),
  spacer(),

  h2('Image Size Comparison'),
  techTable([
    ['Image',         'Base',                  'Approx. Size'],
    ['Naive (no MSB)', 'ubuntu + JDK + Node',  '~650 MB — build tools included'],
    ['Stage 1 only',   'node:20-alpine',        '~180 MB — Node still present'],
    ['Stage 3 final',  'eclipse-temurin:21-jre-alpine', '~150 MB — JRE only, no build toolchain'],
  ]),
  spacer(),
  callout('Why eclipse-temurin:21-jre-alpine',
    [
      'eclipse-temurin is the community build of OpenJDK from the Adoptium project — TCK-verified, production-grade.',
      'jre (not jdk): runtime only. No javac, no jshell, smaller image, smaller attack surface.',
      'alpine: ~5 MB base vs ~29 MB Ubuntu. Uses musl libc — watch for glibc-dependent native libraries.',
      'Alternative: distroless (Google) — even smaller, no shell at all. Better security, harder to debug.',
    ]),
  pgBreak(),

  // ── CLOSING ──────────────────────────────────────────────────────────────────
  h1('Day 1 — Retrospective & Key Engineering Decisions'),
  para('Day 1 established every layer of the production stack: network security, compute, database, container runtime, backend framework, frontend framework, source control, and image registry. The 5-hour investment means Day 2 could focus entirely on application code — no infrastructure scrambling.'),
  spacer(),

  h2('Key Architectural Decisions Summary'),
  techTable([
    ['Decision',                   'Choice Made',          'Alternative Rejected'],
    ['Kubernetes',                 'No (Docker direct)',   'k3s — 512 MB RAM requirement, free-tier incompatible'],
    ['IaC',                        'Terraform',            'Manual console — not reproducible'],
    ['Database',                   'RDS Managed',          'Self-hosted PostgreSQL on EC2 — operational burden'],
    ['Container registry',         'ECR Public',           'DockerHub — rate limits, secret management'],
    ['Java framework',             'Spring Boot 3.3',      'Quarkus (smaller, but less ecosystem)'],
    ['Frontend rendering',         'Static export',        'Next.js SSR — requires Node.js server in prod'],
    ['CSS approach',               'Tailwind utility CSS', 'CSS-in-JS — runtime overhead'],
    ['Build system (Java)',        'Gradle',               'Maven — slower incremental builds'],
  ]),
  spacer(),

  h2('What Comes Next (Day 2)'),
  bullet('Flyway V1 migration: create users table with proper constraints and indexes.'),
  bullet('JWT authentication: Spring Security 6 filter chain, BCrypt hashing, HMAC-SHA256 tokens.'),
  bullet('Next.js auth pages: login, register, dashboard with protected routes via middleware.'),
  bullet('GitHub Actions CI/CD: OIDC AWS authentication (no long-lived secrets), ECR push, SSH deploy.'),
  bullet('Docker Compose: multi-container stack with Redis for session caching.'),
  bullet('Nginx reverse proxy: port 80 → Spring Boot port 8080, security headers, TLS-ready.'),
  spacer(400),

  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({ text: 'RaagPath — Day 1 Deep Dive', size: 18, color: C.mid, font: 'Arial' })],
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
          new TextRun({ text: 'RaagPath — Day 1 Deep Dive', size: 18, color: C.mid, font: 'Arial' }),
          new TextRun({ text: '    Infrastructure Provisioning & Project Scaffold', size: 18, italics: true, color: C.mid, font: 'Arial' }),
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
  const outPath = 'C:\\ClaudeWorkspace\\Raag\\docs\\RaagPath-Day1-Deep-Dive.docx';
  fs.writeFileSync(outPath, buf);
  console.log('Written: ' + outPath);
}).catch(err => { console.error(err); process.exit(1); });
