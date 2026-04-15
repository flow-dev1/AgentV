export function renderToS() {
  const brandName = "AgentV";
  const contactEmail = "legal@agentv.ai";

  const tosText = {
    "Acceptance of Terms": `
      By accessing or using the AgentV TikTok Community Brain Agent, you agree to be bound by these Terms of Service. This agent provides asynchronous, event-driven community management and market intelligence services[cite: 5, 994]. If you do not agree to these terms, you may not access the service.
    `,
    "Authorized Use and Account Safety": `
      You are responsible for maintaining the security of your TikTok account credentials and your AgentV dashboard. You must ensure that all "Human-in-the-Loop" approvals are conducted by authorized personnel to maintain brand integrity [cite: 28-29, 437].
    `,
    "AI Content and Accuracy Disclaimer": `
      AgentV utilizes Large Language Models (LLMs), specifically Gemini 1.5 Flash and Pro, to classify intent and draft responses [cite: 1023-1025]. You acknowledge that AI-generated content may contain inaccuracies. You are solely responsible for reviewing and verifying all "Shadow Drafts" or "AI-Suggested Tags" before they are committed to your public TikTok profile [cite: 762-764, 910-912, 954].
    `,
    "Engagement and Monitoring Loops": `
      The service performs continuous polling of the TikTok API to monitor comments and video performance[cite: 16, 237, 1001]. You grant AgentV permission to ingest this data to provide sentiment analysis, intent classification, and viral velocity alerts [cite: 22-23, 765, 1209].
    `,
    "Lead Scoring and Automated Processing": `
      Our service utilizes a composite Lead Scoring engine to prioritize interactions based on intent, sentiment, and follower reach [cite: 820, 873-874, 1129]. You acknowledge that this scoring is a tool for prioritization and does not constitute a legal guarantee of lead quality or conversion[cite: 1419].
    `,
    "PII Redaction Protocol": `
      AgentV implements a mandatory two-pass PII scrubbing architecture (Regex + LLM-contextual) to minimize the processing of sensitive user data [cite: 1412-1415]. You agree not to bypass these protections or attempt to de-identify redacted information.
    `,
    "Third-Party API Compliance": `
      Your use of this service is strictly subject to the TikTok Developer Terms and Community Guidelines. AgentV is not responsible for any account restrictions, shadowbans, or API revocations resulting from your failure to follow the mandatory human-approval protocols or rate-limiting strategies defined in our documentation [cite: 432-433, 438-439].
    `,
    "Creative Briefs and Performance Feedback": `
      The Intelligence Loop provides creative suggestions and "Fuzzy Matching" to link filmed content back to AI briefs [cite: 365, 1302-1305]. These are recommendations only; AgentV does not guarantee video performance or algorithmic virality.
    `,
    "Intellectual Property": `
      AgentV retains all rights to the underlying architecture, custom Deno Edge Functions, and proprietary Lead Scoring algorithms [cite: 18-20, 1003-1017]. You retain ownership of your original brand content and the final verified replies posted to your account.
    `,
    "Limitation of Liability": `
      To the maximum extent permitted by law, AgentV and its creators shall not be liable for any direct, indirect, or consequential damages resulting from AI hallucinations, TikTok API outages, or the misuse of the automated engagement features.
    `,
    "Governing Law and Contact": `
      These terms are governed by the laws of your jurisdiction. For legal inquiries or to report service abuse, please contact ${contactEmail}.
    `
  };

  const sections = Object.keys(tosText);

  const content = sections
    .map(
      (title, index) => `
      <section class="policy-section card">
        <h2>${index + 1}. ${title}</h2>
        <p>
          ${tosText[title]}
        </p>
      </section>
    `
    )
    .join("");

  return `
    <section class="card">
      <h1>Terms of Service</h1>
      <p>Version 3.0 | Effective Date: ${new Date().toLocaleDateString()}</p>
      <p>These terms govern the use of the AgentV TikTok Community Brain Agent platform.</p>
    </section>
    ${content}
  `;
}