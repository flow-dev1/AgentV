export function renderPrivacy() {
  const brandName = "AgentV";
  const contactEmail = "legal@agentv.me";

  const policyText = {
    "Introduction": `
      This Privacy Policy describes how AgentV ("we," "us," or "our") collects, uses, and protects data through the TikTok Community Brain Agent. This application is designed to facilitate community engagement and market research by analyzing public interactions on our official TikTok content[cite: 5, 13].
    `,
    "Data We Collect": `
      We collect the following data via the TikTok API: 
      (a) Public comment text and metadata[cite: 574]; 
      (b) Publicly available account statistics such as follower counts[cite: 575, 1179]; 
      (c) Video performance metrics (views, retention rates, watch time)[cite: 1044, 1047]. 
      Note: Our system utilizes a two-pass architecture (Regex and LLM-based) to scrub Personal Identifiable Information (PII) from comments before processing [cite: 1412-1415].
    `,
    "Lawful Basis for Processing": `
      Under GDPR, we process your data based on: 
      (a) **Legitimate Interests**: To provide responsive customer service and understand audience trends[cite: 449, 1001]; 
      (b) **Consent**: When you interact with our content, you do so according to TikTok’s Terms of Service.
    `,
    "How We Use Data": `
      Data is used to: 
      (a) Categorize comments by intent (e.g., FAQ, buy-intent) [cite: 560-563, 1079]; 
      (b) Draft human-verified responses[cite: 24, 1082]; 
      (c) Perform Lead Scoring to prioritize engagement[cite: 1102, 1393]; 
      (d) Generate creative briefs to improve content quality[cite: 1021, 1025].
    `,
    "Data Sharing and Processors": `
      We utilize third-party sub-processors to run the agent: 
      (a) **Supabase (PostgreSQL/Deno)** for data storage and logic[cite: 1003, 1026]; 
      (b) **Google Cloud (Gemini LLM)** for intent classification and text analysis [cite: 1023-1025]. 
      We do not sell your personal data to third parties.
    `,
    "International Transfers": `
      Data processed by our sub-processors may be stored in the United States. We ensure these transfers are protected by Standard Contractual Clauses (SCCs) or other recognized legal frameworks to ensure a level of protection equivalent to GDPR.
    `,
    "Retention Periods": `
      Interaction logs and comment data are retained only as long as necessary for business analysis, typically not exceeding the duration of the associated marketing campaign or until a deletion request is processed[cite: 1051, 1267].
    `,
    "Your GDPR Rights": `
      You have the right to access, rectify, or erase your data. Because our agent utilizes "Lead Scoring," you have a specific right to object to automated profiling. To exercise these rights, contact us at ${contactEmail} [cite: 910-912].
    `,
    "Security Measures": `
      Our agent employs a "Privacy-First" design. We use a two-pass scrubbing method to redact phone numbers, emails, and obfuscated contact details before data is processed by the intelligence layer [cite: 1412-1415]. All administrative access is protected via secure authentication.
    `,
    "Contact and Complaints": `
      For questions regarding this policy, contact us at legal@agentv.me. If you are in the EU, you have the right to lodge a complaint with your local Data Protection Authority.
    `
  };

  const sections = Object.keys(policyText);

  const content = sections
    .map(
      (title, index) => `
      <section class="policy-section card">
        <h2>${index + 1}. ${title}</h2>
        <p>
          ${policyText[title]}
        </p>
      </section>
    `
    )
    .join("");

  return `
    <section class="card">
      <h1>Privacy Policy</h1>
      <p>Last Updated: ${new Date().toLocaleDateString()}</p>
      <p>This policy details how the TikTok Community Brain Agent processes data in compliance with GDPR and TikTok Developer policies.</p>
    </section>
    ${content}
  `;
}