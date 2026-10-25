require("dotenv").config({ path: "D:/Projects/MERN Project/job-portal/backend/.env" });
const mongoose = require("mongoose");
const Job = require("../models/job");
const { resolveCompanyLogo } = require("../utils/companyLogoHelper");

const jobsToPost = [
  {
    title: "AI Engineer",
    role: "AI Engineer (AI Labs)",
    company: "Kiwi",
    location: "Bengaluru, Karnataka, India",
    salary: "₹15,00,000 - ₹25,00,000 / year",
    salaryMin: 1500000,
    salaryMax: 2500000,
    salaryCurrency: "INR",
    applyUrl: "https://gokiwi.in/careers",
    isExternal: true,
    isActive: true,
    companyLogo: resolveCompanyLogo("Kiwi"),
    description: `<h3>Standard Job Title</h3>
<p>AI Engineer - AI Labs</p>

<h3>Role Summary</h3>
<p>Kiwi is building the future of credit on UPI. As an AI Engineer in Kiwi's AI Labs team in Bengaluru, you will architect, build, and deploy production-grade intelligent systems and autonomous agent workflows powering fraud detection, credit underwriting, and personalized financial experiences for millions of users.</p>

<h3>Key Responsibilities</h3>
<ul>
  <li>Design, develop, and deploy scalable AI/ML pipelines and LLM-powered applications across core financial workflows.</li>
  <li>Fine-tune generative AI models and implement Retrieval-Augmented Generation (RAG) architectures with vector embeddings.</li>
  <li>Collaborate closely with backend engineers, data platform teams, and product managers to integrate real-time model inference endpoints.</li>
  <li>Optimize model inference latency, throughput, and GPU/CPU compute efficiency for high-concurrency payment streams.</li>
  <li>Establish robust evaluation metrics, monitoring frameworks, and automated test pipelines for AI reliability.</li>
</ul>

<h3>Required Qualifications</h3>
<ul>
  <li>Strong proficiency in Python and deep learning frameworks (PyTorch, TensorFlow, or JAX).</li>
  <li>Hands-on experience with LLM orchestration frameworks (LangChain, LlamaIndex, or vLLM).</li>
  <li>Solid grounding in data structures, algorithms, linear algebra, and distributed systems architecture.</li>
  <li>Knowledge of REST/gRPC API development and containerized deployment with Docker and Kubernetes.</li>
  <li>Graduating batch 2024, 2025, or 2026 with a degree in Computer Science, AI/ML, Data Science, or related engineering discipline.</li>
</ul>

<h3>Preferred Qualifications</h3>
<ul>
  <li>Prior experience or internships in fintech, payment gateways, or credit scoring systems.</li>
  <li>Familiarity with vector databases (Pinecone, Weaviate, Milvus, or pgvector).</li>
  <li>Contributions to open-source AI projects or published papers in machine learning.</li>
</ul>

<h3>Compensation and Benefits</h3>
<p>Competitive annual CTC of ₹15 LPA – ₹25 LPA + ESOPs, comprehensive medical insurance, and fast-track learning opportunities with founding team members.</p>

<h3>Work Arrangement and Location</h3>
<p>Full-time on-site / hybrid role located at Kiwi HQ in Bengaluru, Karnataka.</p>`,
    descriptionEnglish: "Kiwi is hiring an AI Engineer for its AI Labs team in Bengaluru. Build generative AI, LLM pipelines, and automated agent workflows for fintech and credit on UPI.",
    isFullDescription: true,
    skillsRequired: ["Python", "PyTorch", "LLMs", "RAG", "LangChain", "Vector Databases", "Docker", "REST APIs", "Fintech"],
    educationRequired: "B.Tech / B.E / M.Tech / MS in CS, IT, AI/ML (2024/2025/2026 Batch)",
    experienceRequired: "0-2 Years",
    source: "EXTERNAL_REFERRAL",
    externalId: "KIWI-AI-ENG-2026",
    employmentType: "Full-Time",
    isRemote: false,
    domain: "Artificial Intelligence & Data Science",
    seniorityLevel: "Junior / Entry-Level",
    keywords: ["Kiwi", "AI Engineer", "Bengaluru", "AI Labs", "Fintech", "UPI", "Generative AI", "LLM", "2024", "2025", "2026"]
  },
  {
    title: "Software Engineering Intern (+PPO)",
    role: "Software Engineering Intern",
    company: "Ridecell",
    location: "Pune, Maharashtra, India",
    salary: "₹30,000 / month",
    salaryMin: 360000,
    salaryMax: 360000,
    salaryCurrency: "INR",
    applyUrl: "https://ridecell.com/careers/",
    isExternal: true,
    isActive: true,
    companyLogo: resolveCompanyLogo("Ridecell"),
    description: `<h3>Standard Job Title</h3>
<p>Software Engineering Intern (Backend / Systems)</p>

<h3>Role Summary</h3>
<p>Ridecell is the leading platform for fleet-driven businesses and autonomous vehicle operations. As a Software Engineering Intern at our Pune technical center, you will work alongside experienced engineers to design scalable backend microservices, real-time telemetry processing systems, and cloud APIs powering global mobility fleets.</p>

<h3>Key Responsibilities</h3>
<ul>
  <li>Contribute to core backend services utilizing Python, Django/FastAPI, and PostgreSQL.</li>
  <li>Develop and test resilient RESTful APIs supporting fleet automation, vehicle dispatching, and digital key management.</li>
  <li>Write clean, modular, and test-covered code (unit, integration, and performance benchmarks).</li>
  <li>Participate in agile sprint ceremonies, code reviews, architectural discussions, and system debugging sessions.</li>
  <li>Analyze database query performance and assist in caching and schema optimization.</li>
</ul>

<h3>Required Qualifications</h3>
<ul>
  <li>Strong foundation in Computer Science fundamentals: Object-Oriented Programming (OOP), Data Structures, and Algorithms.</li>
  <li>Proficiency in Python or Java with an understanding of web application architecture.</li>
  <li>Basic familiarity with relational databases (SQL, PostgreSQL) and REST API principles.</li>
  <li>Working knowledge of Git version control and Unix/Linux command-line environments.</li>
  <li>Graduating batch 2025, 2026, or 2027 pursuing B.E. / B.Tech / MCA in Computer Science or IT.</li>
</ul>

<h3>Preferred Qualifications</h3>
<ul>
  <li>Personal projects or previous internship experience with cloud platforms (AWS, GCP) and Docker.</li>
  <li>Enthusiasm for automotive tech, IoT, fleet management, and real-time distributed systems.</li>
</ul>

<h3>Compensation and Benefits</h3>
<p>Stipend of ₹30,000 per month with a Pre-Placement Offer (PPO) conversion opportunity based on internship performance.</p>

<h3>Work Arrangement and Location</h3>
<p>Internship located at Ridecell's Development Center in Pune, Maharashtra (Hybrid / Onsite).</p>`,
    descriptionEnglish: "Ridecell is hiring a Software Engineering Intern in Pune with PPO opportunity. Work on backend systems, Python, REST APIs, and vehicle fleet automation.",
    isFullDescription: true,
    skillsRequired: ["Python", "Data Structures", "Algorithms", "PostgreSQL", "REST APIs", "Git", "OOP", "Django"],
    educationRequired: "B.Tech / B.E / MCA in CS / IT (2025/2026/2027 Batch)",
    experienceRequired: "Fresher",
    source: "EXTERNAL_REFERRAL",
    externalId: "RIDECELL-SWE-INTERN-2026",
    employmentType: "Internship (+PPO)",
    isRemote: false,
    domain: "Software Engineering",
    seniorityLevel: "Intern / Fresher",
    keywords: ["Ridecell", "Software Engineering Intern", "Pune", "Backend", "Python", "PPO", "2025", "2026", "2027"]
  },
  {
    title: "Data Analyst",
    role: "Data Analyst",
    company: "SculptSoft",
    location: "Ahmedabad, Gujarat, India",
    salary: "₹25,000 - ₹30,000 / month",
    salaryMin: 300000,
    salaryMax: 360000,
    salaryCurrency: "INR",
    applyUrl: "https://www.sculptsoft.com/career",
    isExternal: true,
    isActive: true,
    companyLogo: resolveCompanyLogo("SculptSoft"),
    description: `<h3>Standard Job Title</h3>
<p>Data Analyst</p>

<h3>Role Summary</h3>
<p>SculptSoft is an enterprise digital transformation and AI software consultancy based in Ahmedabad. We are seeking a detail-oriented Data Analyst to extract, model, and visualize business datasets, generating actionable business intelligence for international and enterprise clients.</p>

<h3>Key Responsibilities</h3>
<ul>
  <li>Query, clean, transform, and validate complex relational and non-relational datasets.</li>
  <li>Build interactive executive dashboards and KPI reports using Power BI, Tableau, or Google Looker Studio.</li>
  <li>Write optimized SQL queries, stored procedures, and data aggregation scripts in Python.</li>
  <li>Collaborate with product and business stakeholders to translate raw analytics into strategic insights.</li>
  <li>Perform exploratory data analysis (EDA) to detect anomalies, user behavior patterns, and conversion bottlenecks.</li>
</ul>

<h3>Required Qualifications</h3>
<ul>
  <li>Solid expertise in SQL querying, join operations, aggregations, and window functions.</li>
  <li>Proficiency in Python (pandas, numpy) or Advanced Excel (Power Query, Pivot Tables, VLOOKUP).</li>
  <li>Hands-on experience developing dashboards with Power BI or Tableau.</li>
  <li>Strong analytical reasoning and ability to present quantitative insights clearly to non-technical stakeholders.</li>
  <li>Graduating batch 2025, 2026, or 2027 with a degree in Computer Science, Data Analytics, Statistics, Mathematics, or IT.</li>
</ul>

<h3>Preferred Qualifications</h3>
<ul>
  <li>Exposure to Google Analytics, Google Tag Manager, or web tracking funnels.</li>
  <li>Basic understanding of database schema design and ETL pipeline fundamentals.</li>
</ul>

<h3>Compensation and Benefits</h3>
<p>Salary range of ₹25,000 – ₹30,000 per month, continuous mentorship, and hands-on exposure to global digital transformation projects.</p>

<h3>Work Arrangement and Location</h3>
<p>On-site role located at SculptSoft, Navratna Corporate Park, Ambli - Bopal Road, Ahmedabad, Gujarat.</p>`,
    descriptionEnglish: "SculptSoft is hiring a Data Analyst in Ahmedabad. Responsibilities include building Power BI/Tableau dashboards, SQL querying, and Python exploratory data analysis.",
    isFullDescription: true,
    skillsRequired: ["SQL", "Power BI", "Tableau", "Python", "Pandas", "Advanced Excel", "Data Modeling", "Business Intelligence"],
    educationRequired: "B.Tech / B.Sc / BCA / MCA in CS, IT, Statistics, or Analytics (2025/2026/2027 Batch)",
    experienceRequired: "Fresher",
    source: "EXTERNAL_REFERRAL",
    externalId: "SCULPTSOFT-DA-2026",
    employmentType: "Full-Time",
    isRemote: false,
    domain: "Artificial Intelligence & Data Science",
    seniorityLevel: "Junior / Entry-Level",
    keywords: ["SculptSoft", "Data Analyst", "Ahmedabad", "SQL", "Power BI", "Python", "Tableau", "2025", "2026", "2027"]
  },
  {
    title: "Software Intern (+PPO)",
    role: "Software Engineering Intern",
    company: "Credgenics",
    location: "Noida, Uttar Pradesh, India",
    salary: "₹25,000 / month",
    salaryMin: 300000,
    salaryMax: 300000,
    salaryCurrency: "INR",
    applyUrl: "https://credgenics.com/careers",
    isExternal: true,
    isActive: true,
    companyLogo: resolveCompanyLogo("Credgenics"),
    description: `<h3>Standard Job Title</h3>
<p>Software Engineering Intern (Full Stack / Backend)</p>

<h3>Role Summary</h3>
<p>Credgenics is India's leading fintech loan collections and debt resolution platform processing millions of transactions. As a Software Intern, you will join our core engineering squad in Noida, building highly scalable microservices, automated communication engines, and payment orchestration workflows.</p>

<h3>Key Responsibilities</h3>
<ul>
  <li>Develop, test, and maintain robust web services and APIs using Python, Java, or Node.js.</li>
  <li>Participate in frontend feature development using React.js, TypeScript, and modern state management.</li>
  <li>Assist in writing automated unit and integration tests to ensure fault-tolerant platform reliability.</li>
  <li>Investigate production issues, debug bottlenecks, and optimize database queries across MongoDB and PostgreSQL.</li>
  <li>Learn industry-standard CI/CD pipelines, containerization, and AWS cloud deployment patterns.</li>
</ul>

<h3>Required Qualifications</h3>
<ul>
  <li>Strong understanding of Data Structures, Algorithms, and Object-Oriented Programming concepts.</li>
  <li>Familiarity with at least one modern language: Python, Java, JavaScript, or C++.</li>
  <li>Basic experience building web applications or REST APIs with Express, Django, or Spring Boot.</li>
  <li>Enthusiasm for problem-solving, clean code principles, and collaborative team development.</li>
  <li>Batches graduating in 2026, 2027, or 2028 pursuing B.Tech / B.E / MCA in Computer Science or related branches.</li>
</ul>

<h3>Preferred Qualifications</h3>
<ul>
  <li>Good ranking on competitive programming platforms (LeetCode, Codeforces) or active GitHub repositories.</li>
  <li>Knowledge of cloud services (AWS, Docker) or message queues (RabbitMQ, Kafka).</li>
</ul>

<h3>Compensation and Benefits</h3>
<p>Monthly stipend of ₹25,000 with high-performing interns eligible for full-time Pre-Placement Offers (PPO) upon graduation.</p>

<h3>Work Arrangement and Location</h3>
<p>On-site internship at Credgenics Technology Hub, Sector 62, Noida, Uttar Pradesh.</p>`,
    descriptionEnglish: "Credgenics is hiring a Software Intern in Noida with a PPO opportunity. Work on fintech microservices, APIs, React, and scalable backend platforms.",
    isFullDescription: true,
    skillsRequired: ["Java", "Python", "JavaScript", "React", "Data Structures", "Algorithms", "REST APIs", "SQL", "Fintech"],
    educationRequired: "B.Tech / B.E / MCA in CS / IT (2026/2027/2028 Batch)",
    experienceRequired: "Fresher",
    source: "EXTERNAL_REFERRAL",
    externalId: "CREDGENICS-SWE-INTERN-2026",
    employmentType: "Internship (+PPO)",
    isRemote: false,
    domain: "Software Engineering",
    seniorityLevel: "Intern / Fresher",
    keywords: ["Credgenics", "Software Intern", "Noida", "PPO", "Fintech", "Full Stack", "Backend", "2026", "2027", "2028"]
  },
  {
    title: "Associate Software Engineer (Frontend)",
    role: "Associate Software Engineer - Frontend",
    company: "Appbrew",
    location: "Delhi NCR, India",
    salary: "₹45,000 - ₹70,000 / month",
    salaryMin: 540000,
    salaryMax: 840000,
    salaryCurrency: "INR",
    applyUrl: "https://appbrew.tech/careers",
    isExternal: true,
    isActive: true,
    companyLogo: resolveCompanyLogo("Appbrew"),
    description: `<h3>Standard Job Title</h3>
<p>Associate Software Engineer (Frontend / UI)</p>

<h3>Role Summary</h3>
<p>Appbrew builds high-converting mobile app platforms and headless storefront infrastructure for top direct-to-consumer (D2C) and Shopify brands. We are seeking an Associate Software Engineer specializing in Frontend Development to engineer lightning-fast, pixel-perfect user interfaces and component libraries.</p>

<h3>Key Responsibilities</h3>
<ul>
  <li>Develop and maintain performant user interfaces using React.js, Next.js, and TypeScript.</li>
  <li>Translate Figma designs into responsive, accessible, and clean frontend components.</li>
  <li>Integrate GraphQL and REST APIs with seamless error handling and caching strategies.</li>
  <li>Profile web performance, optimize Core Web Vitals, and ensure sub-second page transitions.</li>
  <li>Collaborate with product designers and backend engineers in rapid iterative sprint cycles.</li>
</ul>

<h3>Required Qualifications</h3>
<ul>
  <li>Strong command of modern JavaScript (ES6+), TypeScript, HTML5, and CSS3 / Tailwind CSS.</li>
  <li>Hands-on experience building web apps with React.js and modern state management (Zustand, Redux, or React Query).</li>
  <li>Demonstrated portfolio or GitHub projects showing pixel-perfect, responsive UI execution.</li>
  <li>Familiarity with Git workflows, pull requests, and component-driven development.</li>
  <li>Graduating batch 2024, 2025, or 2026 with a degree in Computer Science, IT, or equivalent practical experience.</li>
</ul>

<h3>Preferred Qualifications</h3>
<ul>
  <li>Experience with Next.js, Server-Side Rendering (SSR), or React Native.</li>
  <li>Understanding of eCommerce architectures, Shopify Storefront API, or web performance profiling.</li>
</ul>

<h3>Compensation and Benefits</h3>
<p>Competitive monthly salary of ₹45,000 – ₹70,000, high-growth startup equity potential, and modern hardware setup.</p>

<h3>Work Arrangement and Location</h3>
<p>Hybrid / In-office role based in Delhi NCR (Noida / Gurugram).</p>`,
    descriptionEnglish: "Appbrew is hiring an Associate Software Engineer (Frontend) in Delhi NCR. Build responsive UI, React.js, TypeScript, and high-performance storefront components.",
    isFullDescription: true,
    skillsRequired: ["React.js", "TypeScript", "JavaScript", "Tailwind CSS", "HTML5", "CSS3", "Next.js", "REST APIs", "UI/UX"],
    educationRequired: "B.Tech / B.E / BCA / MCA in CS / IT (2024/2025/2026 Batch)",
    experienceRequired: "0-2 Years",
    source: "EXTERNAL_REFERRAL",
    externalId: "APPBREW-ASE-FRONTEND-2026",
    employmentType: "Full-Time",
    isRemote: false,
    domain: "Software Engineering",
    seniorityLevel: "Junior / Entry-Level",
    keywords: ["Appbrew", "Frontend Engineer", "Delhi NCR", "React", "TypeScript", "Next.js", "Associate Software Engineer", "2024", "2025", "2026"]
  },
  {
    title: "Jr. AI Engineer",
    role: "Junior AI Engineer",
    company: "aiqon",
    location: "Hyderabad, Telangana, India",
    salary: "₹35,000 - ₹40,000 / month",
    salaryMin: 420000,
    salaryMax: 480000,
    salaryCurrency: "INR",
    applyUrl: "https://aiqon.in/",
    isExternal: true,
    isActive: true,
    companyLogo: resolveCompanyLogo("aiqon"),
    description: `<h3>Standard Job Title</h3>
<p>Junior AI Engineer (Applied AI & Full Stack)</p>

<h3>Role Summary</h3>
<p>aiqon is an applied AI product studio and innovation lab headquartered in Hyderabad. As a Jr. AI Engineer, you will build production-grade intelligent applications for global clients across the US and Australia, integrating modern foundation models, document extraction pipelines, and computer vision systems with robust web applications.</p>

<h3>Key Responsibilities</h3>
<ul>
  <li>Develop, fine-tune, and adapt machine learning models for production workflows (document OCR, logistics tracking, multimodal vision).</li>
  <li>Build and maintain model inference services, retrieval pipelines (RAG), and RESTful backend APIs in Python and TypeScript.</li>
  <li>Implement user-facing interfaces in React.js to provide interactive AI tooling and dashboards.</li>
  <li>Monitor and troubleshoot production model drift, latency, and edge-case exceptions.</li>
  <li>Collaborate directly with international engineering teams with overlapping working hours.</li>
</ul>

<h3>Required Qualifications</h3>
<ul>
  <li>Solid programming skills in Python with exposure to TypeScript or modern JavaScript.</li>
  <li>Foundational knowledge of machine learning concepts, LLM APIs (OpenAI, Gemini, Anthropic), and embedding models.</li>
  <li>Understanding of web fundamentals: REST APIs, HTTP protocols, and basic full-stack frameworks (FastAPI, Flask, Express, or React).</li>
  <li>Strong communication skills for daily standups with US and Australian stakeholders.</li>
  <li>Graduating batch 2025, 2026, or 2027 with a degree in CS, AI/ML, Data Science, or Software Engineering.</li>
</ul>

<h3>Preferred Qualifications</h3>
<ul>
  <li>Active GitHub projects demonstrating deployed LLM agents, RAG applications, or computer vision tools.</li>
  <li>Experience with Docker and basic cloud deployment on AWS or GCP.</li>
</ul>

<h3>Compensation and Benefits</h3>
<p>Salary of ₹35,000 – ₹40,000 per month (₹4.2 LPA – ₹4.8 LPA), global client exposure, and rapid skill progression in applied frontier AI.</p>

<h3>Work Arrangement and Location</h3>
<p>Hybrid role based at aiqon Labs, Asian Suncity, Kondapur, Hyderabad, Telangana.</p>`,
    descriptionEnglish: "aiqon is hiring a Jr. AI Engineer in Hyderabad. Work on applied machine learning, LLM fine-tuning, RAG pipelines, and full-stack AI integrations.",
    isFullDescription: true,
    skillsRequired: ["Python", "Machine Learning", "LLMs", "RAG", "TypeScript", "FastAPI", "React", "Computer Vision", "Docker"],
    educationRequired: "B.Tech / B.E / M.Tech in CS / AI / Data Science (2025/2026/2027 Batch)",
    experienceRequired: "Fresher",
    source: "EXTERNAL_REFERRAL",
    externalId: "AIQON-JR-AI-ENG-2026",
    employmentType: "Full-Time",
    isRemote: false,
    domain: "Artificial Intelligence & Data Science",
    seniorityLevel: "Junior / Entry-Level",
    keywords: ["aiqon", "Jr AI Engineer", "Hyderabad", "Applied AI", "Python", "LLMs", "RAG", "2025", "2026", "2027"]
  },
  {
    title: "Business Analyst",
    role: "Business Analyst",
    company: "TekWorks",
    location: "Hyderabad, Telangana, India",
    salary: "₹30,000 - ₹35,000 / month",
    salaryMin: 360000,
    salaryMax: 420000,
    salaryCurrency: "INR",
    applyUrl: "https://www.tekworks.in/careers",
    isExternal: true,
    isActive: true,
    companyLogo: resolveCompanyLogo("TekWorks"),
    description: `<h3>Standard Job Title</h3>
<p>Business Analyst</p>

<h3>Role Summary</h3>
<p>TekWorks is an enterprise tech solutions and digital services firm operating from Hyderabad's Financial District. We are hiring a Business Analyst to bridge technical architecture and business objectives by gathering requirements, creating specification documentation, and facilitating client delivery lifecycles.</p>

<h3>Key Responsibilities</h3>
<ul>
  <li>Elicit, analyze, and document comprehensive business requirements, user stories, and process flow diagrams.</li>
  <li>Author detailed Product Requirement Documents (PRDs), Functional Specification Documents (FSDs), and acceptance criteria.</li>
  <li>Facilitate sprint planning, grooming sessions, and requirements walk-throughs with engineering and QA squads.</li>
  <li>Coordinate User Acceptance Testing (UAT) cycles and validate that delivered software satisfies business requirements.</li>
  <li>Analyze market trends, user journey metrics, and system efficiency to recommend iterative process enhancements.</li>
</ul>

<h3>Required Qualifications</h3>
<ul>
  <li>Strong conceptual understanding of the Software Development Life Cycle (SDLC), Agile, and Scrum methodologies.</li>
  <li>Exceptional written and oral communication skills with the ability to articulate technical concepts clearly.</li>
  <li>Proficiency with documentation and diagramming tools (Jira, Confluence, Lucidchart, MS Visio).</li>
  <li>Analytical mindset with working knowledge of SQL and Excel for data validation.</li>
  <li>Graduating batch 2024, 2025, or 2026 with a degree in B.Tech, MCA, MBA/PGDM, or related business/technical fields.</li>
</ul>

<h3>Preferred Qualifications</h3>
<ul>
  <li>Certifications or coursework in Business Analysis (CBAP, PMI-PBA, or Scrum Master).</li>
  <li>Prior internship experience in an IT consulting, SaaS, or software services organization.</li>
</ul>

<h3>Compensation and Benefits</h3>
<p>Monthly salary of ₹30,000 – ₹35,000, performance bonuses, and career advancement across digital transformation engagements.</p>

<h3>Work Arrangement and Location</h3>
<p>On-site position at TekWorks, Navanaami EON, Financial District, Nanakramguda, Hyderabad, Telangana.</p>`,
    descriptionEnglish: "TekWorks is hiring a Business Analyst in Hyderabad. Responsibilities include gathering requirements, authoring PRDs, Agile sprint coordination, and UAT.",
    isFullDescription: true,
    skillsRequired: ["Business Analysis", "Agile", "Scrum", "PRD", "User Stories", "Jira", "SQL", "Requirements Gathering", "UAT"],
    educationRequired: "B.Tech / MCA / MBA / BBA (2024/2025/2026 Batch)",
    experienceRequired: "0-2 Years",
    source: "EXTERNAL_REFERRAL",
    externalId: "TEKWORKS-BA-2026",
    employmentType: "Full-Time",
    isRemote: false,
    domain: "Business & Management",
    seniorityLevel: "Junior / Entry-Level",
    keywords: ["TekWorks", "Business Analyst", "Hyderabad", "Financial District", "Agile", "PRD", "Scrum", "2024", "2025", "2026"]
  },
  {
    title: "Associate Product Manager",
    role: "Associate Product Manager (APM)",
    company: "Klimb",
    location: "Remote, India",
    salary: "₹40,000 - ₹60,000 / month",
    salaryMin: 480000,
    salaryMax: 720000,
    salaryCurrency: "INR",
    applyUrl: "https://www.klimb.io/careers",
    isExternal: true,
    isActive: true,
    companyLogo: resolveCompanyLogo("Klimb"),
    description: `<h3>Standard Job Title</h3>
<p>Associate Product Manager (APM)</p>

<h3>Role Summary</h3>
<p>Klimb is an innovative recruitment automation and talent intelligence SaaS platform. As an Associate Product Manager working remotely, you will take ownership of product modules spanning AI-driven resume parsing, applicant workflow automation, and candidate engagement experiences.</p>

<h3>Key Responsibilities</h3>
<ul>
  <li>Define and execute product feature roadmaps in close partnership with design and engineering teams.</li>
  <li>Conduct customer discovery interviews, user behavior tracking, and competitive market analysis.</li>
  <li>Write clear, comprehensive Product Requirement Documents (PRDs), wireframes, and user acceptance criteria.</li>
  <li>Prioritize sprint backlogs, lead sprint ceremonies, and track key release delivery metrics.</li>
  <li>Analyze product adoption funnels, user retention, and feature engagement using analytics platforms.</li>
</ul>

<h3>Required Qualifications</h3>
<ul>
  <li>Strong analytical, quantitative, and first-principles problem-solving capabilities.</li>
  <li>Technical background with a B.Tech / B.E. in Computer Science, IT, or equivalent engineering degree.</li>
  <li>Ability to communicate complex technical trade-offs with both engineers and business stakeholders.</li>
  <li>Familiarity with modern product management tools (Figma, Jira, Notion, Mixpanel, Amplitude).</li>
  <li>Graduating batch 2025, 2026, or 2027. Freshers with strong product intuition or internship experience are welcome.</li>
</ul>

<h3>Preferred Qualifications</h3>
<ul>
  <li>Past internship or project experience as an APM, Product Intern, or Technical Founder.</li>
  <li>Understanding of B2B SaaS business models, hiring workflows, and AI automation.</li>
</ul>

<h3>Compensation and Benefits</h3>
<p>Monthly compensation of ₹40,000 – ₹60,000, flexible remote work culture, and direct mentorship from experienced SaaS product leaders.</p>

<h3>Work Arrangement and Location</h3>
<p>100% Remote (India).</p>`,
    descriptionEnglish: "Klimb is hiring an Associate Product Manager (Remote). Drive recruitment automation SaaS features, write PRDs, and work with AI and engineering teams.",
    isFullDescription: true,
    skillsRequired: ["Product Management", "PRD", "User Research", "Agile", "Roadmap Planning", "Figma", "Jira", "Data Analytics", "SaaS"],
    educationRequired: "B.Tech / B.E in CS / IT / Engineering (2025/2026/2027 Batch)",
    experienceRequired: "Fresher",
    source: "EXTERNAL_REFERRAL",
    externalId: "KLIMB-APM-2026",
    employmentType: "Full-Time",
    isRemote: true,
    domain: "Product Management",
    seniorityLevel: "Junior / Entry-Level",
    keywords: ["Klimb", "Associate Product Manager", "APM", "Remote", "SaaS", "Product Management", "2025", "2026", "2027"]
  }
];

async function postAllJobs() {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB Atlas successfully.\n");

    let createdCount = 0;
    let updatedCount = 0;

    for (const job of jobsToPost) {
      const existing = await Job.findOne({
        $or: [
          { externalId: job.externalId },
          { title: job.title, company: job.company }
        ]
      });

      if (existing) {
        await Job.findByIdAndUpdate(existing._id, job, { new: true });
        console.log(`[UPDATED] ${job.company} - ${job.title} (ID: ${existing._id})`);
        console.log(`          Logo: ${job.companyLogo}`);
        console.log(`          Location: ${job.location} | Salary: ${job.salary}\n`);
        updatedCount++;
      } else {
        const created = await Job.create(job);
        console.log(`[CREATED] ${job.company} - ${job.title} (ID: ${created._id})`);
        console.log(`          Logo: ${job.companyLogo}`);
        console.log(`          Location: ${job.location} | Salary: ${job.salary}\n`);
        createdCount++;
      }
    }

    console.log(`========================================`);
    console.log(`Posting Complete: ${createdCount} Created, ${updatedCount} Updated.`);
    console.log(`All 8 referral opportunities are now live on the production site!`);
    console.log(`========================================`);

    process.exit(0);
  } catch (error) {
    console.error("Error executing job posting script:", error);
    process.exit(1);
  }
}

postAllJobs();
