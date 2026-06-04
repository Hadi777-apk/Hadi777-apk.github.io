const state = {
  data: null,
  module: "overseas-auto",
  topic: "全部",
  query: ""
};

const elements = {
  todayLabel: document.querySelector("#todayLabel"),
  updatedAt: document.querySelector("#updatedAt"),
  nextRefresh: document.querySelector("#nextRefresh"),
  moduleTabs: document.querySelector("#moduleTabs"),
  topicFilters: document.querySelector("#topicFilters"),
  searchInput: document.querySelector("#searchInput"),
  highlightsList: document.querySelector("#highlightsList"),
  newsList: document.querySelector("#newsList"),
  itemCount: document.querySelector("#itemCount"),
  emptyState: document.querySelector("#emptyState"),
  refreshButton: document.querySelector("#refreshButton")
};

const formatter = new Intl.DateTimeFormat("zh-CN", {
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit"
});

const dayFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "long"
});

const defaultModules = [
  {
    key: "overseas-auto",
    label: "海外汽车资讯",
    description: "海外车企、电动车、电池、自动驾驶、供应链和政策市场。"
  },
  {
    key: "ai",
    label: "海外AI资讯",
    description: "海外大模型、AI应用、算力芯片、资本动作和监管变化。"
  },
  {
    key: "embodied-ai",
    label: "海外具身智能资讯",
    description: "海外人形机器人、具身智能、工业机器人和机器人产业链。"
  }
];

function formatDate(value) {
  if (!value) return "--";
  return formatter.format(new Date(value));
}

function relativeTime(value) {
  const hours = Math.max(0, Math.round((Date.now() - Date.parse(value)) / 36e5));
  if (hours < 1) return "刚刚";
  if (hours < 24) return `${hours} 小时前`;
  return `${Math.round(hours / 24)} 天前`;
}

function escapeHtml(value = "") {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function storyUrl(item) {
  const value = item?.sourceUrl || item?.url || "";
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return "#";
    if (url.hostname === "news.google.com" && url.pathname.startsWith("/rss/articles/")) {
      const query = encodeURIComponent(`${item.title || item.translatedTitle || ""} ${item.source || ""}`.trim());
      return `https://www.google.com/search?q=${query}`;
    }
    return url.href;
  } catch {
    return "#";
  }
}

function moduleForItem(item) {
  if (item?.module) return item.module;

  const topic = item?.topic || "";
  const topicLabel = item?.topicLabel || "";
  const text = `${item?.title || ""} ${item?.translatedTitle || ""} ${item?.summary || ""} ${item?.translatedSummary || ""}`.toLowerCase();
  if (/Global Automakers|EV and Battery|Autonomous and Software|Supply Chain and Manufacturing|Policy and Markets/.test(topic) || /全球车企|电动车|自动驾驶|供应链|政策与市场/.test(topicLabel)) {
    return "overseas-auto";
  }
  if (topic.includes("AI") || text.includes("openai") || text.includes("anthropic") || text.includes("chatgpt") || text.includes("deepmind") || text.includes("nvidia")) {
    return "ai";
  }
  if (topic.includes("Robot") || topic.includes("Embodied") || text.includes("humanoid") || text.includes("robotics") || text.includes("embodied ai") || text.includes("unitree")) {
    return "embodied-ai";
  }
  return "overseas-auto";
}

function getModules() {
  const modules = state.data?.modules?.length ? state.data.modules : defaultModules;
  return modules.map((module) => ({
    ...module,
    count: (state.data?.items || []).filter((item) => moduleForItem(item) === module.key).length
  }));
}

function currentModule() {
  return getModules().find((module) => module.key === state.module) || getModules()[0] || defaultModules[0];
}

const visualCatalog = {
  tesla: [
    { src: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=900&q=80", alt: "Tesla electric vehicle" },
    { src: "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=900&q=80", alt: "Tesla vehicle interior" },
    { src: "https://images.unsplash.com/photo-1614200187524-dc4b892acf16?auto=format&fit=crop&w=900&q=80", alt: "Electric vehicle charging detail" }
  ],
  toyota: [
    { src: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=80", alt: "Toyota or Lexus vehicle" },
    { src: "https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=900&q=80", alt: "Modern car front detail" },
    { src: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=900&q=80", alt: "Sport sedan on road" }
  ],
  ford: [
    { src: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80", alt: "Ford vehicle on road" },
    { src: "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=900&q=80", alt: "Automotive rear view" },
    { src: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=900&q=80", alt: "Vehicle driving through landscape" }
  ],
  robotaxi: [
    { src: "https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&w=900&q=80", alt: "Autonomous driving concept vehicle" },
    { src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=80", alt: "City driving technology" },
    { src: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=900&q=80", alt: "Urban road traffic" }
  ],
  battery: [
    { src: "https://images.unsplash.com/photo-1593941707882-a56bbc8df1a1?auto=format&fit=crop&w=900&q=80", alt: "Electric vehicle charging" },
    { src: "https://images.unsplash.com/photo-1615906655593-ad0386982a0f?auto=format&fit=crop&w=900&q=80", alt: "EV charging port" },
    { src: "https://images.unsplash.com/photo-1620891549027-942fdc95d3f5?auto=format&fit=crop&w=900&q=80", alt: "Clean energy and battery technology" }
  ],
  factory: [
    { src: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80", alt: "Automotive manufacturing line" },
    { src: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=900&q=80", alt: "Industrial production work" },
    { src: "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?auto=format&fit=crop&w=900&q=80", alt: "Manufacturing facility" }
  ],
  policy: [
    { src: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=900&q=80", alt: "City traffic and mobility infrastructure" },
    { src: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80", alt: "City market environment" },
    { src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80", alt: "Urban transport context" }
  ],
  global: [
    { src: "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=900&q=80", alt: "Modern vehicle in international market" },
    { src: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=900&q=80", alt: "Performance car detail" },
    { src: "https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&w=900&q=80", alt: "Car on open road" }
  ],
  market: [
    { src: "https://images.unsplash.com/photo-1533106418989-88406c7cc8ca?auto=format&fit=crop&w=900&q=80", alt: "Showroom vehicle detail" },
    { src: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=900&q=80", alt: "Vehicle crossing city street" },
    { src: "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=900&q=80", alt: "Classic car in motion" },
    { src: "https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?auto=format&fit=crop&w=900&q=80", alt: "Luxury car detail" },
    { src: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=900&q=80", alt: "Vehicle on mountain road" },
    { src: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=900&q=80", alt: "Car front profile" },
    { src: "https://images.unsplash.com/photo-1541443131876-44b03de101c5?auto=format&fit=crop&w=900&q=80", alt: "Interior driving perspective" },
    { src: "https://images.unsplash.com/photo-1603386329225-868f9b1ee6c9?auto=format&fit=crop&w=900&q=80", alt: "SUV road scene" },
    { src: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=80", alt: "Automotive road lifestyle" }
  ],
  ai: [
    { src: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=900&q=80", alt: "Artificial intelligence interface" },
    { src: "https://images.unsplash.com/photo-1674027444485-cec3da58eef4?auto=format&fit=crop&w=900&q=80", alt: "AI data visualization" },
    { src: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=900&q=80", alt: "AI neural network concept" },
    { src: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80", alt: "AI product on laptop" },
    { src: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=900&q=80", alt: "Technology workspace" },
    { src: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80", alt: "Data dashboard" }
  ],
  aiInfra: [
    { src: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=900&q=80", alt: "Data center server racks" },
    { src: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80", alt: "Computer chip closeup" },
    { src: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=900&q=80", alt: "Hardware and compute infrastructure" },
    { src: "https://images.unsplash.com/photo-1563770660941-10a63607739a?auto=format&fit=crop&w=900&q=80", alt: "Server room infrastructure" },
    { src: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=900&q=80", alt: "GPU and electronics" },
    { src: "https://images.unsplash.com/photo-1597852074816-d933c7d2b988?auto=format&fit=crop&w=900&q=80", alt: "Semiconductor manufacturing detail" }
  ],
  aiPolicy: [
    { src: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=900&q=80", alt: "Policy and business documents" },
    { src: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80", alt: "Industry analysis workspace" },
    { src: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=900&q=80", alt: "Business regulation discussion" },
    { src: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=80", alt: "Technology business meeting" }
  ],
  robotics: [
    { src: "https://images.unsplash.com/photo-1516192518150-0d8fee5425e3?auto=format&fit=crop&w=900&q=80", alt: "Robot arm in lab" },
    { src: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=900&q=80", alt: "Humanoid robot concept" },
    { src: "https://images.unsplash.com/photo-1535378917042-10a22c95931a?auto=format&fit=crop&w=900&q=80", alt: "Robot and human interaction" },
    { src: "https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?auto=format&fit=crop&w=900&q=80", alt: "Robotics engineering" },
    { src: "https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?auto=format&fit=crop&w=900&q=80", alt: "Robotics lab hardware" },
    { src: "https://images.unsplash.com/photo-1581093588401-fbb62a02f120?auto=format&fit=crop&w=900&q=80", alt: "Automation robot detail" }
  ],
  humanoid: [
    { src: "https://images.unsplash.com/photo-1561557944-6e7860d1a7eb?auto=format&fit=crop&w=900&q=80", alt: "Humanoid robot portrait" },
    { src: "https://images.unsplash.com/photo-1531746790731-6c087fecd65a?auto=format&fit=crop&w=900&q=80", alt: "Robot assistant concept" },
    { src: "https://images.unsplash.com/photo-1527430253228-e93688616381?auto=format&fit=crop&w=900&q=80", alt: "Robot hand closeup" },
    { src: "https://images.unsplash.com/photo-1526378722484-bd91ca387e72?auto=format&fit=crop&w=900&q=80", alt: "Human and machine interaction" }
  ],
  robotFactory: [
    { src: "https://images.unsplash.com/photo-1581092162384-8987c1d64718?auto=format&fit=crop&w=900&q=80", alt: "Industrial robot production" },
    { src: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=900&q=80", alt: "Factory automation" },
    { src: "https://images.unsplash.com/photo-1581091215367-59ab6b30f5cf?auto=format&fit=crop&w=900&q=80", alt: "Robotic manufacturing line" },
    { src: "https://images.unsplash.com/photo-1565043666747-69f6646db940?auto=format&fit=crop&w=900&q=80", alt: "Warehouse automation" }
  ]
};

function detectSignals(text) {
  const lower = text.toLowerCase();
  return {
    mentionsTesla: lower.includes("tesla") || lower.includes("特斯拉"),
    mentionsWaymo: lower.includes("waymo"),
    mentionsByd: lower.includes("byd") || lower.includes("比亚迪"),
    mentionsRobotaxi: lower.includes("robotaxi") || lower.includes("自动驾驶") || lower.includes("self-driving"),
    mentionsBattery: lower.includes("battery") || lower.includes("电池") || lower.includes("charging") || lower.includes("充电"),
    mentionsPolicy: lower.includes("tariff") || lower.includes("policy") || lower.includes("regulation") || lower.includes("监管") || lower.includes("政策"),
    mentionsSales: lower.includes("sales") || lower.includes("delivery") || lower.includes("销量") || lower.includes("交付"),
    mentionsFactory: lower.includes("factory") || lower.includes("plant") || lower.includes("制造") || lower.includes("工厂"),
    mentionsOpenAI: lower.includes("openai") || lower.includes("chatgpt"),
    mentionsModel: lower.includes("model") || lower.includes("llm") || lower.includes("gemini") || lower.includes("claude") || lower.includes("模型"),
    mentionsChip: lower.includes("nvidia") || lower.includes("gpu") || lower.includes("chip") || lower.includes("inference") || lower.includes("算力") || lower.includes("芯片"),
    mentionsRobot: lower.includes("robot") || lower.includes("robotics") || lower.includes("机器人"),
    mentionsHumanoid: lower.includes("humanoid") || lower.includes("optimus") || lower.includes("unitree") || lower.includes("figure ai") || lower.includes("人形"),
    mentionsEmbodied: lower.includes("embodied ai") || lower.includes("physical ai") || lower.includes("具身")
  };
}

function topicPerspective(topic) {
  const map = {
    "全球车企": "这类消息通常反映的是主机厂竞争格局、车型节奏和市场份额变化，值得把它放到品牌长期战略里看，而不是只盯一天的情绪波动。",
    "电动车与电池": "这类消息更值得关注成本、续航、补能效率和供应链安全，因为这些因素最后都会传导到价格、利润和消费者接受度。",
    "自动驾驶与软件": "这类消息真正重要的地方不只是技术演示，而是它能否进入稳定运营、合规落地和商业闭环，这决定它究竟是故事还是生意。",
    "供应链与制造": "这类消息往往不是最热闹的一类，但对交付节奏、成本控制和产能扩张最关键，经常会比发布会新闻更早反映行业真实温度。",
    "政策与市场": "这类消息通常会改变企业的决策边界，包括定价、出口路线、投资区域和产品组合，所以往往对中长期影响更大。"
  };
  return map[topic] || "这条消息最好放进行业节奏里一起看，单看标题容易高估短期影响，结合车企战略、成本和政策环境判断会更稳。";
}

function visualKeysForItem(item) {
  const text = `${item?.title || ""} ${item?.translatedTitle || ""} ${item?.summary || ""} ${item?.translatedSummary || ""}`.toLowerCase();
  const keys = [];
  const moduleKey = moduleForItem(item);

  if (moduleKey === "ai") {
    if (text.includes("nvidia") || text.includes("gpu") || text.includes("chip") || text.includes("data center") || text.includes("inference") || text.includes("算力") || text.includes("芯片")) keys.push("aiInfra");
    if (text.includes("regulation") || text.includes("policy") || text.includes("safety") || text.includes("startup") || text.includes("监管") || text.includes("政策")) keys.push("aiPolicy");
    keys.push("ai");
    return [...new Set(keys)];
  }

  if (moduleKey === "embodied-ai") {
    if (text.includes("humanoid") || text.includes("optimus") || text.includes("unitree") || text.includes("figure ai") || text.includes("人形")) keys.push("humanoid");
    if (text.includes("factory") || text.includes("warehouse") || text.includes("industrial") || text.includes("logistics") || text.includes("工厂") || text.includes("仓储")) keys.push("robotFactory");
    keys.push("robotics");
    keys.push("aiInfra");
    return [...new Set(keys)];
  }

  if (text.includes("tesla") || text.includes("特斯拉")) keys.push("tesla");
  if (text.includes("toyota") || text.includes("丰田") || text.includes("lexus") || text.includes("雷克萨斯")) keys.push("toyota");
  if (text.includes("ford") || text.includes("福特")) keys.push("ford");
  if (text.includes("waymo") || text.includes("robotaxi") || text.includes("自动驾驶") || text.includes("fsd")) keys.push("robotaxi");
  if (text.includes("battery") || text.includes("charging") || text.includes("电池") || text.includes("充电") || text.includes("储能")) keys.push("battery");
  if (text.includes("factory") || text.includes("plant") || text.includes("制造") || text.includes("工厂") || text.includes("supply chain") || text.includes("供应链")) keys.push("factory");
  if (text.includes("policy") || text.includes("regulation") || text.includes("tariff") || text.includes("监管") || text.includes("政策")) keys.push("policy");

  const topic = item?.topicLabel || item?.topic || "";
  if (topic.includes("自动驾驶")) keys.push("robotaxi");
  if (topic.includes("电池") || topic.includes("电动车")) keys.push("battery");
  if (topic.includes("供应链") || topic.includes("制造")) keys.push("factory");
  if (topic.includes("政策") || topic.includes("市场")) keys.push("policy");
  keys.push("market");
  keys.push("global");
  return [...new Set(keys)];
}

function visualsForItem(item, order = 0) {
  const seed = `${item?.id || item?.title || ""}|${item?.source || ""}|${item?.topic || ""}|${order}`;
  const pool = visualKeysForItem(item).flatMap((key) => visualCatalog[key] || []);
  if (!pool.length) return visualCatalog.market.slice(0, 3);
  const start = (stableIndex(seed, pool.length) + order * 5) % pool.length;
  const step = 1 + (stableIndex(`${seed}|step`, Math.max(1, pool.length - 1)) % Math.max(1, pool.length - 1));
  const picked = [];
  for (let offset = 0; picked.length < 3 && offset < pool.length * 3; offset += 1) {
    const visual = pool[(start + offset * step) % pool.length];
    if (!picked.some((item) => item.src === visual.src)) picked.push(visual);
  }
  if (picked.length < 3) {
    pool.forEach((visual) => {
      if (picked.length < 3 && !picked.some((item) => item.src === visual.src)) picked.push(visual);
    });
  }
  return picked;
}

function renderGallery(item, compact = false, order = 0) {
  if (item?.imageUrl) {
    return `
      <div class="story-gallery single${compact ? " compact" : ""}">
        <figure>
          <img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.imageAlt || item.translatedTitle || item.title || "news image")}" loading="lazy" referrerpolicy="no-referrer" />
        </figure>
      </div>
    `;
  }

  return "";
}

function signalPerspective(signals) {
  if (signals.mentionsRobotaxi && signals.mentionsWaymo) {
    return "如果主角是 Waymo 这类已经在运营的玩家，重点就不只是“技术先进不先进”，而是它的服务范围、事故率、成本模型和监管关系有没有继续改善，因为这些指标才决定规模化是否真的可持续。";
  }
  if (signals.mentionsTesla) {
    return "如果事件和特斯拉相关，市场通常会把它放大解读，所以更要区分这是影响销量和利润的硬变量，还是更偏叙事层面的情绪刺激。真正值得盯的是价格、交付、软件进度以及竞争对手有没有同步施压。";
  }
  if (signals.mentionsByd) {
    return "如果主角是比亚迪，这往往不只是单一车型新闻，而是它在海外扩张、渠道落地和成本优势继续外溢的信号。看这类消息时，最好顺手比较当地政策、关税环境和其他车企的应对动作。";
  }
  if (signals.mentionsBattery) {
    return "如果核心点落在电池或补能，真正该问的是它会不会改善用户体验和单位成本，因为只有这两件事被解决，电动车渗透率才会继续往上走，资本市场和消费者才会持续买单。";
  }
  if (signals.mentionsPolicy) {
    return "如果这里面有政策或监管变量，那它通常不会只影响一家公司，而是会重塑整个市场的节奏。很多时候看似是一条新闻，实际上是在给未来几个月的产品投放、投资方向和利润空间划线。";
  }
  if (signals.mentionsFactory || signals.mentionsSales) {
    return "如果消息落在工厂、交付或销量，这类内容往往比概念宣传更接近经营现实。因为产能、库存和销售质量，最后都会反映到利润表，也更容易看出一家车企到底是在扩张，还是在硬撑。";
  }
  return "这类消息未必会马上改变行业方向，但它通常能帮助我们判断热度背后有没有基本面支撑。简单说，就是要看它是短期话题，还是能继续发酵成业绩、市场份额或技术壁垒的长期变量。";
}

function sourcePerspective(source) {
  if (!source) {
    return "消息源不算特别明确的时候，更要把重点放回到事件本身，先看有没有后续确认，再看市场有没有出现连续反馈，这样判断会稳很多。";
  }
  if (/reuters/i.test(source)) {
    return "如果来源是路透这类通讯社，一般意味着信息密度和行业参考价值都不低，虽然它未必会写得很热闹，但往往适合拿来当作判断行业风向的底稿。";
  }
  if (/bloomberg/i.test(source)) {
    return "如果来源偏彭博这种财经媒体，那就别只看故事感，更要看资本市场和公司经营层面有没有对应动作，因为这类报道通常更贴近钱和预期的变化。";
  }
  if (/electrek|insideevs/i.test(source)) {
    return "如果来源是新能源或汽车垂直媒体，那它的行业敏感度通常更高，适合拿来观察新技术、新车型和渠道动作，但也要记得和主流媒体交叉确认一下分量。";
  }
  return `来源是${source}，这意味着这条消息至少已经进入主流讨论视野。对读者来说，最有价值的不是背新闻本身，而是借它判断行业正在把注意力押向哪里。`;
}

function stylePerspective(title, topic) {
  return `按我们现在这套读法，这条消息不能只当成“海外又出了一条车圈新闻”。更像是行业牌桌上又翻开了一张牌，而且这张牌跟${topic}直接相关。标题里提到“${title}”，表面上是在说一个事件，实质上是在提醒我们：接下来谁会跟、谁会慢、谁会借这个机会放大自己，才是真正值得盯的部分。`;
}

function stableIndex(seed, size) {
  let total = 0;
  for (let index = 0; index < seed.length; index += 1) {
    total = (total * 33 + seed.charCodeAt(index)) % 2147483647;
  }
  return total % size;
}

function stripSourceFromTitle(value = "") {
  return value
    .replace(/\s[-–—]\s*[A-Za-z0-9 .,&()]+$/u, "")
    .replace(/\s[-–—]\s*(报道|评论|分析|快讯|外媒)$/u, "")
    .replace(/\s+/g, " ")
    .trim();
}

function shortCoreTitle(item) {
  const title = stripSourceFromTitle(item.translatedTitle || item.title || "这条消息");
  if (title.length <= 34) return title;
  return `${title.slice(0, 33)}…`;
}

function displayTitle(item, order = 0) {
  const moduleKey = moduleForItem(item);
  const topic = item.topicLabel || item.topic || "";
  const source = item.source || "外媒";
  const core = shortCoreTitle(item);
  const hookCore = `「${core}」`;
  const signals = detectSignals(`${item.translatedTitle || item.title || ""} ${item.translatedSummary || item.summary || ""}`);
  const seed = `${core}|${source}|${topic}|${order}`;

  const autoHooks = [
    `别只看热闹：${hookCore}真正的信号在后面`,
    `${hookCore}海外车圈这次可能要重新算账`,
    `这条消息别划走：${hookCore}背后有大动作`,
    `${hookCore}谁会被逼着跟？`,
    `看懂${hookCore}，才知道车圈风向变哪了`,
    `${hookCore}不是普通快讯`
  ];
  if (signals.mentionsTesla) autoHooks.push(`特斯拉又有动作：${hookCore}别只当销量新闻看`);
  if (signals.mentionsByd) autoHooks.push(`比亚迪这步棋不小：${hookCore}`);
  if (signals.mentionsRobotaxi) autoHooks.push(`自动驾驶别只看演示：${hookCore}`);
  if (signals.mentionsBattery) autoHooks.push(`电动车真正的暗线来了：${hookCore}`);
  if (signals.mentionsPolicy) autoHooks.push(`政策一变就要重算账：${hookCore}`);

  const aiHooks = [
    `${hookCore}AI圈这次可能真要换打法`,
    `别只看发布会：${hookCore}背后才是关键`,
    `这条AI消息别划走：${hookCore}`,
    `${hookCore}谁的入口要被动了？`,
    `AI热闹背后，${hookCore}更像硬信号`,
    `${hookCore}海外AI牌桌又变了`
  ];
  if (signals.mentionsChip) aiHooks.push(`算力这张牌又变了：${hookCore}`);
  if (signals.mentionsOpenAI || signals.mentionsModel) aiHooks.push(`模型大战别只看参数：${hookCore}`);
  if (signals.mentionsPolicy) aiHooks.push(`监管开始进场：${hookCore}AI圈不能只讲技术了`);

  const robotHooks = [
    `${hookCore}机器人真要开始干活了？`,
    `别只看演示：${hookCore}背后才是硬问题`,
    `这条具身智能消息别划走：${hookCore}`,
    `${hookCore}离真正落地还有多远？`,
    `机器人热闹背后，${hookCore}更值得看`,
    `${hookCore}不是炫技那么简单`
  ];
  if (signals.mentionsHumanoid) robotHooks.push(`人形机器人又热了：${hookCore}但关键是能不能干活`);
  if (signals.mentionsFactory) robotHooks.push(`工厂和仓库先动了：${hookCore}`);

  const hooks = moduleKey === "ai" ? aiHooks : moduleKey === "embodied-ai" ? robotHooks : autoHooks;
  return hooks[(stableIndex(seed, hooks.length) + order) % hooks.length];
}

function teaserText(value = "", limit = 205) {
  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length <= limit) return compact;
  const softBreak = compact.slice(0, limit).replace(/[，。；：、,.!?！？][^，。；：、,.!?！？]*$/u, "");
  const text = softBreak.length >= 150 ? softBreak : compact.slice(0, limit);
  return `${text.replace(/[，。；：、,.!?！？\s]+$/u, "")}…`;
}

function buildIntro(title, source, topic, summary, signals) {
  const seed = `${title}|${source}|${topic}`;
  const openings = [
    `先说结论，这条消息不是拿来凑热闹的。它落在${topic}这条线上，真正摆到桌面上的核心信息是：${summary}。`,
    `这件事如果只看标题，会觉得又是一条普通行业快讯；但放进${topic}里一起看，分量其实比表面大。最核心的一句就是：${summary}。`,
    `今天这条新闻有意思的地方，在于它不是空口放风，而是已经把一个方向说得比较明白了。围绕${topic}，现在最该抓住的信息是：${summary}。`,
    `别急着把这条消息当成日常资讯划过去。它之所以值得单拎出来说，是因为它在${topic}这个位置上，已经释放出比较明确的信号：${summary}。`,
    `如果把这条新闻翻成人话，它讲的不是“又有新动态”，而是${topic}这条线又往前拱了一步。眼下最值得记住的核心内容就是：${summary}。`,
    `这条来自${source}的消息，表面是在报一个新进展，实际上是在提醒大家行业节奏又动了一下。放到${topic}里看，最关键的信息是：${summary}。`
  ];

  if (signals.mentionsTesla) {
    openings.push(`一旦新闻里出现特斯拉，外面的讨论通常会自动放大一圈，所以更需要先把热度压一压，看清真正发生了什么。这次围绕${topic}，核心信息是：${summary}。`);
  }
  if (signals.mentionsWaymo || signals.mentionsRobotaxi) {
    openings.push(`自动驾驶这类消息最怕一上来就聊概念，结果把落地节奏忽略了。这条新闻真正值得看的点，放在${topic}里说，就是：${summary}。`);
  }
  if (signals.mentionsBattery || signals.mentionsPolicy) {
    openings.push(`像这种跟成本、补能或者政策边界相关的消息，通常不会只影响一天的舆论，更可能改后面的经营动作。眼下最重要的核心信息是：${summary}。`);
  }

  return openings[stableIndex(seed, openings.length)];
}

function buildPlainTalk(title, topic) {
  const seed = `${title}|${topic}|plain`;
  const lines = [
    "如果把话说得更直一点，这条新闻真正值得看的，不是标题热不热，而是它会不会实打实影响后面的产品节奏、定价动作、技术押注和市场预期。",
    "更现实一点看，这条消息的价值不在于谁先喊赢，而在于它会不会逼着别的车企跟动作，会不会让资本市场重新估值，会不会让消费者预期发生变化。",
    "换句话说，我们不是在看一条热搜，而是在看一个变量有没有开始落地。只要它能牵动车型节奏、渠道推进或者利润空间，这条消息就不轻。",
    "往下拆开看，这种新闻最该盯的从来不是表面情绪，而是它会不会进入经营层面的动作清单。只要开始影响产销、软件、工厂或者价格，它就不只是谈资。",
    "真要按行业视角去读，这条新闻有分量的地方在于它有没有能力改变接下来几个月的竞争方式。谁更主动，谁更被动，很多时候就是从这种消息里先露头。"
  ];
  return lines[stableIndex(seed, lines.length)];
}

function buildBrotherIntro(title, source, topic, summary, signals, order = 0) {
  const seed = `${title}|${source}|${topic}|brother|${order}`;
  const lines = [
    `说实话，我看${topic}这类消息，第一反应不是它热不热，而是它会不会真的改变后面的车。${source}这条新闻，核心其实就一句话：${summary}。`,
    `到了现在这个阶段，海外汽车圈很多新闻不能只当快讯看，它背后往往藏着车企的选择。今天这条放在${topic}里，最关键的信息是：${summary}。`,
    `电动兄弟先把这事翻成人话：这不是一条单纯给大家刷存在感的新闻，它真正露出来的信号是：${summary}。`,
    `我一直觉得，看车圈新闻最怕只看标题。标题会很热闹，但真正有价值的是它背后的动作。围绕${topic}，这条消息最重要的点是：${summary}。`,
    `这条来自${source}的消息，我会认真看。不是因为它写得多漂亮，而是它确实能反映${topic}这条线现在的真实水温：${summary}。`,
    `有些新闻适合扫一眼，有些新闻要停下来想一想。这条我会放到第二类，因为它讲的不是热闹，而是${topic}后面的真实变化：${summary}。`,
    `如果今天只挑一条${topic}里的信号看，我会先看这条。它没有必要被夸张解读，但也不该被轻轻放过，核心就是：${summary}。`,
    `我以前看这种新闻也容易先看品牌，现在反而更在意它背后的节奏。谁开始动，谁被迫跟，谁还在观望，这条消息给出的线索是：${summary}。`,
    `这事看着像一条普通外媒更新，但车圈很多变化就是这么开始的，先是一条消息，后面才是产品、价格和产能的连锁反应。这次的核心是：${summary}。`,
    `别被标题带着跑，我更愿意把它放回真实买车和用车场景里看。放到${topic}这条线，今天最该记住的是：${summary}。`
  ];
  if (signals.mentionsTesla) {
    lines.push(`只要新闻里带特斯拉，外面肯定会吵得很凶。但我看特斯拉新闻，通常会先把情绪放一边，先看它有没有真的影响产品和交付。这条的核心是：${summary}。`);
  }
  if (signals.mentionsRobotaxi) {
    lines.push(`自动驾驶这类新闻，最容易被讲成科幻片。但从一个长期看车的人角度，我更关心它能不能稳定跑、能不能赚钱、有没有人真的愿意长期用。这条消息的核心是：${summary}。`);
  }
  if (signals.mentionsBattery) {
    lines.push(`电池和补能这种事，表面上没有新车发布那么热闹，但它往往决定一台电车能不能长期相处。这条消息真正摆出来的是：${summary}。`);
  }
  return lines[order % lines.length];
}

function brotherTopicView(topic) {
  const map = {
    "全球车企": "全球车企这条线，我不会只看谁又发了新车、谁又讲了一个漂亮故事。我更在意的是谁在抢节奏，谁在收缩，谁的动作看起来体面但其实已经有压力。车企最后拼的不是新闻稿，而是产品能不能站住、成本能不能压住、渠道能不能跑通。",
    "电动车与电池": "电动车和电池这条线，我会看得更现实一点。续航是不是更踏实，补能是不是更顺手，成本是不是还能往下打，这些东西听起来没有那么性感，但真正决定一台车能不能卖久。用户最后不会为概念长期买单，只会为好用买单。",
    "自动驾驶与软件": "自动驾驶和软件这条线，我一直不太喜欢只看演示视频。演示能不能惊艳是一回事，长期运营能不能稳定、法规能不能接受、用户愿不愿意付钱，又是另外一回事。真正高级的技术，最后应该让人觉得自然，而不是让人一直紧张。",
    "供应链与制造": "供应链和制造的新闻通常不够热闹，但它最接近一家车企的底子。工厂、物流、零部件、产能，这些东西不在海报上发光，却会直接决定交付、价格和利润。车好不好卖，有时候先从工厂里露出答案。",
    "政策与市场": "政策和市场这条线，表面看很远，实际离每一台车都很近。一个关税、一个补贴、一个监管口径，可能就会让车企重新算账，决定车在哪里造、卖给谁、卖多少钱。很多时候，车企不是不想冲，是边界变了。"
  };
  return map[topic] || "这类消息放在汽车圈里看，我不会只盯一个点，而是看它会不会改变产品节奏、成本结构和竞争关系。只有这些东西动了，新闻才真的有分量。";
}

function brotherSignalView(signals) {
  if (signals.mentionsTesla) {
    return "如果这事跟特斯拉有关，我反而会更冷静一点。特斯拉的新闻天然带流量，但流量不是结论，关键还是看它有没有改变交付、价格、FSD 进度或者市场信心。这几个点不动，外面吵得再凶，也只是热闹。";
  }
  if (signals.mentionsByd) {
    return "如果主角是比亚迪，那就不能只当成单一品牌新闻。比亚迪现在很多动作都带着出海、成本和供应链的外溢效果，它一动，别的车企很难完全不跟。这个时代的竞争，有时候不是谁更会讲，而是谁的体系更硬。";
  }
  if (signals.mentionsRobotaxi || signals.mentionsWaymo) {
    return "如果它落在 Robotaxi 或 Waymo 这种方向，最该问的不是酷不酷，而是能不能扩大城市、能不能降低成本、监管会不会继续放行。自动驾驶最终拼的是耐力，不是短视频里的那一下惊艳。能安安静静跑几年，才是真的本事。";
  }
  if (signals.mentionsBattery) {
    return "如果它和电池、充电、储能有关，我就看两个东西：用户体验有没有更好，单位成本有没有更低。只要这两个点变好，电动车继续往上走就不是空话。技术最后一定要落到日常里，不然再先进也只是参数。";
  }
  if (signals.mentionsPolicy) {
    return "如果里面有政策变量，那它影响的通常不是一家企业，而是一整条赛道的边界。车企后面怎么投资、怎么出口、怎么定价，都会被这种变化牵着走。很多人只看车，其实车背后那张政策桌子也很关键。";
  }
  if (signals.mentionsFactory || signals.mentionsSales) {
    return "如果消息落在工厂、销量、交付这些地方，反而更值得看。因为这些不是 PPT，不是概念，是一家车企到底有没有真实经营压力的直接信号。车可以讲得很漂亮，但工厂和订单不会陪你演。";
  }
  return "如果它现在看起来还不够炸，也别急着忽略。很多行业变化一开始都不是大新闻，而是从这种小动作里慢慢露出方向。真正懂车的人，往往看的就是这些没那么吵的地方。";
}

function buildModuleIntro(moduleKey, title, source, topic, summary, signals, order = 0) {
  if (moduleKey === "overseas-auto") {
    return buildBrotherIntro(title, source, topic, summary, signals, order);
  }

  const aiLines = [
    `说实话，我看AI新闻，最怕一上来就被参数和估值带着跑。${source}这条消息放在${topic}里看，真正要抓住的是：${summary}。`,
    `现在AI圈每天都很吵，但不是每条都值得认真看。今天这条我会停一下，因为它可能影响模型、入口、算力或者商业化节奏：${summary}。`,
    `如果把这条AI消息翻成人话，它讲的不是一个新名词，而是行业又在重新分配筹码。来自${source}的核心信息是：${summary}。`,
    `我一直觉得，AI资讯不能只看谁发布了什么，更要看它会不会改变用户习惯和公司的花钱方式。这条的重点是：${summary}。`,
    `AI这东西到了现在，已经不是单纯看演示多惊艳了，而是看成本、稳定性、入口和场景。围绕${topic}，这条消息最关键的是：${summary}。`,
    `海外AI新闻我会先看两层：一层是技术，一层是生意。${source}这条消息真正值得拿出来聊，是因为它露出了这个变化：${summary}。`,
    `有些AI消息像烟花，亮一下就过去了；有些消息像地基，短期不热闹但后劲很长。今天这条我更愿意按后一种来观察：${summary}。`,
    `这条海外AI动态，我不会只看公司名字有多大，而是看它有没有牵动产品入口、算力成本和用户选择。核心信息是：${summary}。`,
    `从全球AI竞争来看，这类新闻其实很适合当温度计。它告诉我们的不是谁赢了，而是谁正在换打法：${summary}。`,
    `我看这条AI新闻的时候，脑子里先冒出来的不是“厉害”，而是“会不会变成默认选择”。来自${source}的重点是：${summary}。`
  ];

  const robotLines = [
    `具身智能这条线，我不会只看视频里机器人走得像不像人。我更在意它能不能量产、能不能干活、成本能不能下来。这条来自${source}的消息，核心是：${summary}。`,
    `说实话，机器人新闻最容易被拍成热闹，但真正有价值的永远是落地。放在${topic}里看，今天这条最值得盯的是：${summary}。`,
    `我看具身智能，第一反应不是“酷不酷”，而是它离真实工厂、仓库、家庭还有多远。${source}这条消息给出的信号是：${summary}。`,
    `这条机器人消息不要只当科技新闻看，它背后其实是硬件、算法、供应链和场景在一起较劲。核心信息很直接：${summary}。`,
    `到了这个阶段，人形机器人和具身智能已经不能只靠概念活着了。它必须回到可靠性、成本和任务闭环上，这条消息讲的就是：${summary}。`,
    `海外具身智能现在最有意思的地方，是它终于开始从实验室叙事往产业叙事挪。${source}这条消息，关键就在这里：${summary}。`,
    `机器人这条线，热闹归热闹，我更关心它有没有走到能交付、能维护、能复用的阶段。今天这条消息露出来的是：${summary}。`,
    `如果只看演示，所有机器人都像未来；如果看成本和任务，大部分机器人还在补课。放到${topic}里，这条新闻的重点是：${summary}。`,
    `这条海外机器人动态，我会把它放进真实工作场景里想：能不能替人干活，能不能稳定干，能不能算得过账。核心信息是：${summary}。`,
    `具身智能不是屏幕里的AI，它要和真实世界硬碰硬。所以这条消息我会重点看，因为它讲的是：${summary}。`
  ];

  const lines = moduleKey === "embodied-ai" ? robotLines : aiLines;
  return lines[order % lines.length];
}

function moduleTopicView(moduleKey, topic) {
  if (moduleKey === "overseas-auto") return brotherTopicView(topic);

  if (moduleKey === "ai") {
    const map = {
      "模型与应用": "AI模型和应用这条线，我会先看它有没有真正改变用户入口。一个模型更强当然重要，但如果它不能变成更低的成本、更稳定的服务、更自然的工作流，那它就只是发布会上的漂亮数字。真正有分量的AI新闻，最后一定会落到用户愿不愿意每天用、企业愿不愿意持续付钱。",
      "算力与芯片": "算力和芯片这条线，看起来离普通用户远，其实离每一个AI产品都很近。推理成本下不来，应用就很难大规模铺开；供给被卡住，模型公司就会被成本和排队时间拽住脖子。所以这类消息我会重点看，它往往比产品宣传更接近行业底层。",
      "产业与监管": "产业和监管的消息，表面没那么性感，但它决定AI能不能进公司、进学校、进政府、进真实业务。政策口径、版权边界、安全责任和资本流向一变，后面的产品节奏都会跟着变。很多AI公司不是技术不努力，而是边界突然变了。"
    };
    return map[topic] || "AI这条线现在最值得看的，不是单点能力，而是能力、成本、入口和场景有没有连起来。只有连起来，新闻才会从热闹变成生意。";
  }

  const map = {
    "具身智能": "具身智能这条线，我会把它看得更硬一点。大模型让机器会理解，机器人本体让它能行动，但中间差的不是一句口号，而是传感器、控制、数据、任务规划和安全冗余。能不能从实验室走到真实场景，这才是核心。",
    "人形机器人": "人形机器人最容易被大众注意，因为它像人，画面冲击力很强。但从产业角度看，像不像人不是第一位，能不能稳定完成任务、维修成本高不高、供应链能不能撑住量产，才是真正要看的东西。",
    "机器人产业": "机器人产业的消息，我会重点看场景。仓储、制造、物流、巡检、家庭服务，每个场景对成本和可靠性的要求都不一样。一个机器人能不能赚钱，不看视频多好看，要看它能不能替人完成重复任务，并且算得过账。"
  };
  return map[topic] || "具身智能和机器人这条线，真正有价值的不是一次演示，而是它有没有从演示走向任务、从任务走向规模、从规模走向生意。";
}

function moduleSignalView(moduleKey, signals) {
  if (moduleKey === "overseas-auto") return brotherSignalView(signals);

  if (moduleKey === "ai") {
    if (signals.mentionsChip) {
      return "如果这条落在算力、GPU或者芯片上，我会特别认真看。因为AI公司的浪漫最后都会被成本教育，训练要钱，推理也要钱，用户增长越快，账单越真实。谁能把算力供给和成本结构做稳，谁就更有机会把AI从体验变成长期服务。";
    }
    if (signals.mentionsOpenAI || signals.mentionsModel) {
      return "如果它和OpenAI、模型能力或者应用入口有关，我不会只看参数榜。模型强是一回事，产品能不能被普通人顺手用起来，企业能不能放心接进去，生态能不能形成默认入口，这些才决定它是不是下一阶段的牌桌中心。";
    }
    if (signals.mentionsPolicy) {
      return "如果里面有监管和安全变量，那就更不能只看技术。AI现在已经进到真实社会系统里了，版权、隐私、安全、责任边界都会反过来影响产品形态。很多时候，政策不是刹车，而是在重新划赛道。";
    }
    return "如果这条AI消息暂时看着不够炸，也别急着划走。AI行业很多变化一开始都像小更新，后面才慢慢变成入口迁移、成本下降和组织流程重写。真正重要的东西，经常不是第一天最吵的东西。";
  }

  if (signals.mentionsHumanoid) {
    return "如果它落在人形机器人上，我会先把情绪压下来。人形外观很容易带来想象力，但真正难的是长时间稳定工作、跌倒之后怎么恢复、维护成本怎么控制、量产之后良率如何。能把这些做扎实，才不是概念玩具。";
  }
  if (signals.mentionsRobot || signals.mentionsEmbodied) {
    return "如果它和具身智能或机器人学习有关，我会重点看数据从哪里来、动作怎么泛化、任务能不能复用。机器人不是只会回答问题，它要和物理世界打交道，桌子、箱子、门把手、地面，每一个细节都会让算法露出真实水平。";
  }
  if (signals.mentionsFactory) {
    return "如果消息落在工厂、仓储或工业场景，反而更接近商业化。因为这些地方任务明确、ROI好算，只要可靠性和成本过线，机器人就有机会先跑起来。家庭场景更性感，但工业场景更容易先赚钱。";
  }
  return "具身智能现在最该看的不是谁会说话，而是谁能干活。能不能稳定完成重复任务，能不能便宜到老板愿意买，能不能安全到员工愿意共处，这些问题比宣传片更真实。";
}

function modulePlainTalk(moduleKey, title, topic) {
  if (moduleKey === "overseas-auto") return buildPlainTalk(title, topic);

  const aiLines = [
    "更直白一点说，AI资讯真正值得看的，不是今天又多了一个新名字，而是它有没有改变成本、入口和使用习惯。只要这三件事动了，行业就会跟着动。",
    "换句话说，我们看的不是一条科技热搜，而是一个变量有没有开始变硬。模型能力、算力价格、产品入口、监管边界，任何一个点发生变化，都可能牵动后面的公司命运。",
    "我会把它放进一个更现实的问题里：用户会不会因此多用一次，企业会不会因此多付一笔钱，开发者会不会因此换一套工具。如果答案开始变清楚，这条新闻就有分量。"
  ];

  const robotLines = [
    "更直白一点说，机器人新闻真正值得看的不是表演，而是任务。它能不能在真实环境里反复干活，能不能少出错，能不能算过账，这才是具身智能从概念走向产业的关键。",
    "我会把它放进工厂和仓库里想：老板为什么买，员工怎么用，坏了谁修，一天能干多少活。如果这些问题有答案，这条新闻就不是热闹。",
    "具身智能最迷人的地方，是它终于要从屏幕里走出来。但走出来以后，世界不会对它客气，地面、光线、噪音、碰撞、成本，都会一项一项考它。"
  ];

  const lines = moduleKey === "embodied-ai" ? robotLines : aiLines;
  return lines[stableIndex(`${title}|${topic}|plain|${moduleKey}`, lines.length)];
}

function moduleStyleView(moduleKey, title) {
  if (moduleKey === "overseas-auto") {
    return `电动兄弟看这类消息，不会急着给它贴“利好”或者“利空”的标签。我更愿意把它放进一个真实的用车和买车场景里想：如果我是车主，我会不会因为它改变期待；如果我是车企，我会不会因为它调整节奏；如果我是准备买车的人，我会不会重新看待这个品牌。标题里提到“${title}”，表面上是新闻标题，实际上是一个提醒，告诉我们后面还要盯着同类动作会不会继续出现。`;
  }

  if (moduleKey === "ai") {
    return `我看AI新闻，也会尽量避开那种一惊一乍的写法。标题里提到“${title}”，表面看是一条技术或公司动态，实际上更像是在问一个现实问题：这东西会不会被更多人用起来，会不会让公司花钱的方式变化，会不会让原来的软件入口失去安全感。AI最后拼的不是谁会讲愿景，而是谁能把能力变成稳定、便宜、可复用的工具。`;
  }

  return `我看具身智能，最不想只停在“像不像人”这件事上。标题里提到“${title}”，真正该看的，是它有没有往真实任务靠近。机器人不像纯软件，不能只靠更新版本解决一切，它要面对物理世界的不确定性。越是这种新闻，越要看硬件、算法、供应链和场景是不是一起往前走。`;
}

function moduleClosing(moduleKey) {
  if (moduleKey === "overseas-auto") {
    return "所以这条新闻的正确打开方式，不是看完就完，也不是立刻下结论。先把它当成一个信号放进观察列表，后面继续看三个东西：有没有更多车企跟进，有没有价格、产能或政策上的真实变化，有没有用户端和资本市场的反馈。如果这三件事开始连起来，那它就不是普通新闻，而是趋势刚冒头；如果后面没有下文，那就当作今天车圈的一次试探。说到底，我现在看海外汽车圈，越来越少被热闹带着跑，越来越多看底子：谁的产品完整，谁的成本健康，谁的长期相处感更好，谁在牌桌上越来越有筹码。";
  }
  if (moduleKey === "ai") {
    return "所以这条AI新闻，我不会急着下一个很大的结论。先把它放进观察列表，后面看三件事：有没有更多用户真的迁移过来，成本有没有继续下降，生态里的公司有没有跟着调整。如果这三件事连起来，它就不是一条普通AI快讯，而是行业进入下一段的信号。说到底，AI圈每天都有新鲜词，但真正能留下来的，永远是能解决真实问题、能降低真实成本、能进入真实工作流的东西。";
  }
  return "所以这条具身智能新闻，我会先把它当成一个产业信号，而不是一次表演。后面继续看三件事：任务边界有没有变清楚，量产和成本有没有进展，真实客户有没有持续买单。如果这些东西能接上，它就可能从一条机器人新闻变成一个产业拐点。说到底，机器人最难的不是让人看见希望，而是让人愿意长期使用、愿意付钱、愿意把它放进真实工作现场。";
}

function readableSummary(item, order = 0) {
  const rawSummary = (item.translatedSummary || item.summary || "").trim();
  const summary = (rawSummary || "这条新闻的原始摘要较短，建议结合来源名判断事件背景。")
    .replace(/\s+/g, " ")
    .replace(/[|_-]\s*[A-Za-z0-9 .&]+$/, "")
    .replace(/(临时新闻|汽车专家|驱动\.ca)$/u, "")
    .trim();
  const title = item.translatedTitle || item.title || "这条新闻";
  const source = item.source || "外媒";
  const topic = item.topicLabel || item.topic || "汽车行业";
  const moduleKey = moduleForItem(item);
  const signals = detectSignals(`${title} ${summary}`);
  const intro = buildModuleIntro(moduleKey, title, source, topic, summary, signals, order);
  const plainTalk = modulePlainTalk(moduleKey, title, topic);
  const topicView = moduleTopicView(moduleKey, topic);
  const signalView = moduleSignalView(moduleKey, signals);
  const sourceView = sourcePerspective(source);
  const styleView = moduleStyleView(moduleKey, title);
  const closing = moduleClosing(moduleKey);
  let expanded = `${intro}${plainTalk}${topicView}${signalView}${sourceView}${styleView}${closing}`;

  if (expanded.length < 500) {
    expanded += moduleKey === "overseas-auto"
      ? "这也是为什么我会把这条放出来讲。它可能不是今天最会吸眼球的那条，但它能帮我们判断海外车圈的水温。车企每一次动作背后都是算账，算成本、算政策、算用户、算对手，新闻只是外面露出来的一角。"
      : "这也是为什么我会把这条放出来讲。它可能不是今天最会吸眼球的那条，但它能帮我们判断这条技术线的水温。每一次动作背后都是算账，算成本、算场景、算用户、算对手，新闻只是外面露出来的一角。";
  }
  if (expanded.length < 500) {
    expanded += "后面我们就盯一个问题：这件事会不会从消息变成动作，从动作变成数据，从数据变成行业压力。能走到这一步，它才是真的有分量。";
  }
  return expanded;
}

function createTopicButton(topic) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = topic.label;
  button.className = topic.key === state.topic ? "active" : "";
  button.addEventListener("click", () => {
    state.topic = topic.key;
    render();
  });
  return button;
}

function createModuleButton(module) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = module.key === state.module ? "active" : "";
  button.innerHTML = `
    <strong>${escapeHtml(module.label)}</strong>
    <span>${module.count || 0} 条</span>
  `;
  button.addEventListener("click", () => {
    state.module = module.key;
    state.topic = "全部";
    render();
  });
  return button;
}

function renderModuleTabs() {
  elements.moduleTabs.replaceChildren(...getModules().map(createModuleButton));
}

function renderFilters() {
  const moduleTopics = (state.data?.topics || [])
    .filter((topic) => !topic.module || topic.module === state.module);
  const topics = [{ key: "全部", label: "全部" }, ...moduleTopics];
  elements.topicFilters.replaceChildren(...topics.map(createTopicButton));
}

function renderHighlights() {
  const moduleHighlights = (state.data?.highlights || [])
    .filter((item) => moduleForItem(item) === state.module);
  const fallbackHighlights = (state.data?.items || [])
    .filter((item) => moduleForItem(item) === state.module)
    .slice(0, 6);
  const items = (moduleHighlights.length ? moduleHighlights : fallbackHighlights).slice(0, 6);
  elements.highlightsList.replaceChildren(...items.map((item, index) => {
    const row = document.createElement("article");
    row.className = "highlight-item";
    const summary = readableSummary(item, index + 100);
    row.innerHTML = `
      <span class="rank">${String(index + 1).padStart(2, "0")}</span>
      <div>
        <a href="${storyUrl(item)}" rel="noreferrer">${escapeHtml(displayTitle(item, index + 100))}</a>
        <p class="subcopy">${escapeHtml(teaserText(summary, 92))}</p>
        <div class="tag-row">
          <span class="topic">${escapeHtml(item.topicLabel || item.topic)}</span>
          <span>${escapeHtml(item.source)}</span>
          <span>${relativeTime(item.publishedAt)}</span>
        </div>
      </div>
    `;
    return row;
  }));
}

function getFilteredItems() {
  const query = state.query.trim().toLowerCase();
  return (state.data?.items || []).filter((item) => {
    const moduleMatch = moduleForItem(item) === state.module;
    const topicMatch = state.topic === "全部" || item.topic === state.topic;
    const queryMatch = !query || `${item.title} ${item.summary} ${item.translatedTitle || ""} ${item.translatedSummary || ""} ${item.source}`.toLowerCase().includes(query);
    return moduleMatch && topicMatch && queryMatch;
  });
}

function renderNews() {
  const items = getFilteredItems();
  elements.itemCount.textContent = `${items.length} 条`;
  elements.emptyState.textContent = state.query || state.topic !== "全部"
    ? "没有匹配的新闻。"
    : "这个模块暂时还没有抓到新闻，刷新后会自动补上。";
  elements.emptyState.hidden = items.length > 0;
  elements.newsList.replaceChildren(...items.map((item, index) => {
    const card = document.createElement("article");
    card.className = `news-card ${item.imageUrl ? "has-image" : "text-note"}`;
    const summary = readableSummary(item, index);
    card.innerHTML = `
      ${renderGallery(item, false, index)}
      <p class="note-source">DIANDONGXIONGDI.COM</p>
      <a href="${storyUrl(item)}" rel="noreferrer">${escapeHtml(displayTitle(item, index))}</a>
      <p>${escapeHtml(teaserText(summary, 205))}</p>
      <div class="card-meta">
        <span class="topic">${escapeHtml(item.topicLabel || item.topic)}</span>
        <span class="source">${escapeHtml(item.source)}</span>
        <span>${relativeTime(item.publishedAt)}</span>
      </div>
    `;
    return card;
  }));
}

function render() {
  if (!state.data) return;
  const module = currentModule();
  elements.todayLabel.textContent = dayFormatter.format(new Date());
  elements.updatedAt.textContent = formatDate(state.data.updatedAt);
  elements.nextRefresh.textContent = formatDate(state.data.nextAutoRefresh);
  document.querySelector("#briefTitle").textContent = module.label;
  document.querySelector("#briefSummary").textContent = module.description || "按模块查看重点资讯。";
  document.querySelector("#highlightsTitle").textContent = `${module.label}重点`;
  document.querySelector("#feedTitle").textContent = `${module.label}新闻流`;
  renderModuleTabs();
  renderFilters();
  renderHighlights();
  renderNews();
}

async function loadNews() {
  const response = await fetch("./data/news.json", { cache: "no-store" });
  if (!response.ok) throw new Error("新闻数据加载失败");
  state.data = await response.json();
  render();
}

async function refreshNews() {
  elements.refreshButton.disabled = true;
  elements.refreshButton.lastChild.textContent = " 载入中";
  try {
    await loadNews();
  } finally {
    elements.refreshButton.disabled = false;
    elements.refreshButton.lastChild.textContent = " 重新载入";
  }
}

elements.searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderNews();
});

elements.refreshButton.addEventListener("click", refreshNews);

loadNews().catch((error) => {
  elements.newsList.innerHTML = `<p class="empty">${escapeHtml(error.message)}，请稍后再试。</p>`;
});
