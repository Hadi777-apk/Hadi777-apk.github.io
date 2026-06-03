const form = document.querySelector("#reviewForm");
const leadForm = document.querySelector("#leadForm");
const aiStatus = document.querySelector("#aiStatus");
const leadMessage = document.querySelector("#leadMessage");
const leadFallbackCard = document.querySelector("#leadFallbackCard");
const leadFallbackSummary = document.querySelector("#leadFallbackSummary");
const copyLeadSummary = document.querySelector("#copyLeadSummary");
const emailLeadSummary = document.querySelector("#emailLeadSummary");
const contactEmail = document.querySelector("meta[name='reviewlift-contact-email']")?.content || "";
const subscribeLink = document.querySelector("#subscribeLink");
const setupLink = document.querySelector("#setupLink");
const copyAll = document.querySelector("#copyAll");

const fields = {
  publicReply: document.querySelector("#publicReply"),
  privateFollowUp: document.querySelector("#privateFollowUp"),
  reviewRequest: document.querySelector("#reviewRequest"),
  actionPlan: document.querySelector("#actionPlan")
};

let latestKit = null;

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector("button[type='submit']");
    const payload = Object.fromEntries(new FormData(form));
    button.disabled = true;
    button.textContent = "Generating...";

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await readJsonResponse(response);
      if (!response.ok) throw new Error(data.error || "Generation failed.");
      latestKit = data;
      renderKit(data);
    } catch (error) {
      const data = createTemplateKit(payload);
      latestKit = data;
      renderKit(data);
    } finally {
      button.disabled = false;
      button.textContent = "Generate client sample";
    }
  });
}

if (leadForm) {
  prefillLeadFormFromQuery();

  leadForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    leadMessage.textContent = "";
    leadMessage.classList.remove("error");

    try {
      const payload = Object.fromEntries(new FormData(leadForm));
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await readJsonResponse(response);
      if (!response.ok) throw new Error(data.error || "Lead capture failed.");
      await submitNetlifyLead(payload);
      leadForm.reset();
      hideLeadFallback();
      leadMessage.textContent = `Lead saved: ${data.id}`;
    } catch (error) {
      await handleLeadFallback(Object.fromEntries(new FormData(leadForm)));
    }
  });
}

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-copy]");
  if (!button) return;
  const key = button.dataset.copy;
  await copyText(getTextForKey(key));
  flash(button);
});

if (copyAll) {
  copyAll.addEventListener("click", async () => {
    if (!latestKit) return;
    await copyText(["publicReply", "privateFollowUp", "reviewRequest", "actionPlan"].map(getTextForKey).join("\n\n---\n\n"));
    flash(copyAll);
  });
}

if (copyLeadSummary) {
  copyLeadSummary.addEventListener("click", async () => {
    await copyText(leadFallbackSummary?.value || "");
    flash(copyLeadSummary);
  });
}

async function bootstrap() {
  try {
    const response = await fetch("/api/config");
    const config = await readJsonResponse(response);
    if (aiStatus) aiStatus.textContent = config.aiEnabled ? "OpenAI mode" : "Template mode";
    if (subscribeLink && (config.stripePilot || config.stripeMonthly)) subscribeLink.href = config.stripePilot || config.stripeMonthly;
    if (setupLink && (config.stripeAudit || config.stripeSetup)) setupLink.href = config.stripeAudit || config.stripeSetup;
  } catch {
    if (aiStatus) aiStatus.textContent = "Template mode";
  }

  if (form) form.dispatchEvent(new Event("submit"));
}

function renderKit(data) {
  if (aiStatus) aiStatus.textContent = data.mode === "openai" ? "OpenAI mode" : "Template mode";
  if (fields.publicReply) fields.publicReply.textContent = data.publicReply || "";
  if (fields.privateFollowUp) fields.privateFollowUp.textContent = data.privateFollowUp || "";
  if (fields.reviewRequest) fields.reviewRequest.textContent = data.reviewRequest || "";
  if (!fields.actionPlan) return;
  fields.actionPlan.innerHTML = "";
  for (const item of data.actionPlan || []) {
    const li = document.createElement("li");
    li.textContent = item;
    fields.actionPlan.append(li);
  }
}

function getTextForKey(key) {
  if (!latestKit) return "";
  if (key === "actionPlan") return (latestKit.actionPlan || []).map((item, index) => `${index + 1}. ${item}`).join("\n");
  return latestKit[key] || "";
}

async function copyText(text) {
  if (!text) return;
  await navigator.clipboard.writeText(text);
}

async function readJsonResponse(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: text.slice(0, 160) };
  }
}

function createTemplateKit(rawPayload) {
  const payload = normalizePayload(rawPayload);
  const isNegative = Number(payload.rating) <= 3;
  const bilingual = payload.language === "bilingual" || payload.language.includes("Chinese");
  const customer = payload.customerName || "there";
  const business = payload.businessName;
  const platform = payload.primaryPlatform || "Google";
  const isYelp = platform.toLowerCase().includes("yelp");
  const reviewSummary = summarizeReview(payload.reviewText);

  const publicReplyEn = isNegative
    ? `Hi ${customer}, thank you for telling us about this. We are sorry your visit did not meet the standard we want for ${business}. We are reviewing the details with our team and would like to make this right. Please contact us directly so we can follow up quickly.`
    : `Hi ${customer}, thank you for choosing ${business} and for taking the time to share this. We appreciate your support and will keep working to deliver the same level of service every visit.`;

  const publicReplyZh = isNegative
    ? `${customer}，感谢您把这次体验告诉我们。很抱歉这次没有达到 ${business} 应有的服务标准。我们会和团队复盘，也希望您直接联系我们，让我们尽快跟进处理。`
    : `${customer}，感谢您支持 ${business} 并留下评价。我们会继续保持服务质量，也欢迎您下次再来。`;

  const privateEn = isNegative
    ? `Hi ${customer}, this is ${business}. I saw your review about "${reviewSummary}" and wanted to personally follow up. Could you share the best time to talk today? I want to understand what happened and offer a fair next step.`
    : isYelp
      ? `Hi ${customer}, thank you again for visiting ${business}. Your feedback helps our local business a lot. If you have a minute, would you share any extra notes with our team directly so we can keep improving?`
      : `Hi ${customer}, thank you again for visiting ${business}. Your feedback helps our local business a lot. If you have a minute, would you consider sharing the same experience on Google?`;

  const privateZh = isNegative
    ? `${customer} 您好，我是 ${business}。我看到您提到“${reviewSummary}”，想亲自跟进一下。今天什么时候方便沟通？我们想了解清楚并给出合适处理。`
    : isYelp
      ? `${customer} 您好，感谢您支持 ${business}。如果方便的话，欢迎把更多反馈直接发给我们团队，我们会继续改进服务。`
      : `${customer} 您好，感谢您支持 ${business}。如果方便的话，能不能把这次好的体验也发到 Google 评价？这对我们本地小店很有帮助。`;

  const requestEn = isYelp
    ? "Front-desk note: Do not ask customers for Yelp reviews. For happy customers, share the Google review link or invite direct feedback: [paste Google review or feedback link]"
    : `Hi ${customer}, thank you for supporting ${business}. If our service helped you today, a quick Google review would mean a lot to our team: [paste Google review link]`;
  const requestZh = isYelp
    ? "前台提示：不要邀请顾客写 Yelp 评价。遇到满意顾客时，可分享 Google 评价链接或请对方直接反馈：[粘贴 Google 评价或反馈链接]"
    : `${customer} 您好，感谢支持 ${business}。如果今天服务满意，麻烦帮我们在 Google 留个评价：[粘贴 Google 评价链接]`;

  return {
    mode: "template",
    publicReply: bilingual ? `${publicReplyEn}\n\n${publicReplyZh}` : publicReplyEn,
    privateFollowUp: bilingual ? `${privateEn}\n\n${privateZh}` : privateEn,
    reviewRequest: bilingual ? `${requestEn}\n\n${requestZh}` : requestEn,
    actionPlan: [
      "Reply publicly within 24 hours without arguing or blaming the customer.",
      "Send one private follow-up message and log the result in a simple spreadsheet.",
      isYelp
        ? "For Yelp, respond and recover without asking the customer to write or change a review."
        : isNegative
        ? "Ask the manager to review the exact service gap before offering compensation."
        : "Share a Google review link with recent happy customers without incentives or selective gating."
    ]
  };
}

function normalizePayload(body) {
  return {
    businessName: clean(body.businessName, 120) || "the business",
    businessType: clean(body.businessType, 120) || "local service business",
    customerName: clean(body.customerName, 80),
    reviewText: clean(body.reviewText, 2200),
    rating: Number(body.rating || 3),
    language: clean(body.language, 40) || "bilingual",
    primaryPlatform: clean(body.primaryPlatform, 40) || "Google",
    tone: clean(body.tone, 40) || "warm",
    goal: clean(body.goal, 80) || "recover and protect reputation",
    market: clean(body.market, 80) || "US local customers"
  };
}

function clean(value, limit) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

function summarizeReview(text) {
  if (!text) return "your experience";
  const cleaned = text.replace(/[^\p{L}\p{N}\s,.!?-]/gu, "").trim();
  return cleaned.length > 90 ? `${cleaned.slice(0, 87)}...` : cleaned;
}

async function handleLeadFallback(payload) {
  const summary = buildLeadSummary(payload);
  localStorage.setItem("reviewlift-latest-lead", JSON.stringify({
    createdAt: new Date().toISOString(),
    ...payload
  }));
  showLeadFallback(summary);

  try {
    await copyText(summary);
    leadMessage.textContent = "This preview could not save the request online, so the payment request summary was copied. Reply with it in the same email or text thread so we can invoice you.";
  } catch {
    leadMessage.textContent = "This preview could not save the request online. Copy the payment request summary below and send it in the same email or text thread.";
  }
  leadMessage.classList.add("error");
}

function showLeadFallback(summary) {
  if (leadFallbackSummary) leadFallbackSummary.value = summary;
  if (emailLeadSummary && contactEmail) {
    emailLeadSummary.href = buildMailto(contactEmail, "ReviewLift payment request", summary);
    emailLeadSummary.hidden = false;
  } else if (emailLeadSummary) {
    emailLeadSummary.hidden = true;
  }
  if (leadFallbackCard) leadFallbackCard.hidden = false;
}

function hideLeadFallback() {
  if (leadFallbackSummary) leadFallbackSummary.value = "";
  if (emailLeadSummary) emailLeadSummary.hidden = true;
  if (leadFallbackCard) leadFallbackCard.hidden = true;
}

function buildMailto(email, subject, body) {
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function prefillLeadFormFromQuery() {
  if (!leadForm) return;
  const params = new URLSearchParams(window.location.search);
  if (!params.size) return;

  const mappings = {
    business: "businessName",
    businessName: "businessName",
    email: "email",
    phone: "phone",
    offer: "offer",
    paymentPreference: "paymentPreference",
    payment: "paymentPreference",
    note: "note",
    sourcePage: "sourcePage"
  };

  for (const [paramName, fieldName] of Object.entries(mappings)) {
    const value = params.get(paramName);
    if (!value) continue;
    const field = leadForm.elements[fieldName];
    if (!field) continue;
    if (field.tagName === "SELECT") {
      setSelectValue(field, value);
    } else {
      field.value = value;
    }
  }
}

function setSelectValue(select, value) {
  const hasOption = [...select.options].some((option) => option.value === value);
  if (!hasOption) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.prepend(option);
  }
  select.value = value;
}

function buildLeadSummary(payload) {
  return [
    "ReviewLift payment request",
    `Business: ${payload.businessName || "Not provided"}`,
    `Email: ${payload.email || "Not provided"}`,
    `Phone / WeChat: ${payload.phone || "Not provided"}`,
    `Package: ${payload.offer || "Not provided"}`,
    `Preferred payment: ${payload.paymentPreference || "Not provided"}`,
    `Source page: ${payload.sourcePage || "Not provided"}`,
    `Review link or note: ${payload.note || "Not provided"}`
  ].join("\n");
}

async function submitNetlifyLead(payload) {
  if (!leadForm?.getAttribute("name")) return;
  if (!location.hostname.endsWith("netlify.app")) return;
  const body = new URLSearchParams();
  body.set("form-name", leadForm.getAttribute("name") || "reviewlift-lead");
  for (const [key, value] of Object.entries(payload)) {
    if (key === "bot-field" || key === "form-name") continue;
    body.set(key, value || "");
  }

  try {
    await fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body
    });
  } catch {
    // The JSON API already captured the lead; Netlify Forms is a dashboard fallback.
  }
}

function flash(button) {
  const original = button.textContent;
  button.textContent = "Copied";
  setTimeout(() => {
    button.textContent = original;
  }, 900);
}

bootstrap();
