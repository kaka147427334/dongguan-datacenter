/* ============================================================
   零跑汽车 · 东莞区域数据中心 — 共享脚本
   负责注入顶部导航与页脚，并提供通用小工具
   ============================================================ */
(function () {
  const NAV = [
    { key: "home", label: "数据中心", href: "index.html" },
    { key: "process_ext", label: "过程指标", href: "https://420408ff824544f1af0b277e7a0c4859.app.workbuddy.link", ext: true },
    { key: "sales_ext", label: "销售日报", href: "https://a9d72b7f2e1b4c99ac17bfba931f7a07.app.codebuddy.work/", ext: true },
    { key: "annual_ext", label: "年度分析", href: "https://f47801f24a134f728a61cdded459194e.app.workbuddy.link", ext: true },
    { key: "inventory_ext", label: "库存", href: "https://974a140778c749d188c2ce6cbdd34405.app.workbuddy.link", ext: true },
    { key: "leads_ext", label: "线索", href: "https://01e43646424c46049c0281f954b5d6d5.bj3.agentos-app.net/", ext: true },
    { key: "model4wd_ext", label: "四轮驱动", href: "https://dorameimeimon.github.io/leapmotor-south-dashboard/", ext: true },
    { key: "testdrive_ext", label: "试驾勤勉度", href: "https://dorameimeimon.github.io/leapmotor-test-drive-dashboard/", ext: true },
    { key: "poster_ext", label: "晨夕会", href: "https://dorameimeimon.github.io/leapmotor-poster/", ext: true },
  ];

  const PAGE = window.PAGE_KEY || "home";

  function buildTopbar() {
    const root = document.getElementById("topbar-root");
    if (!root) return;
    const links = NAV.map(
      (n) =>
        n.ext
          ? `<a href="${n.href}" target="_blank" rel="noopener">${n.label} ↗</a>`
          : `<a href="${n.href}" class="${n.key === PAGE ? "active" : ""}">${n.label}</a>`
    ).join("");
    root.innerHTML = `
      <div class="topbar">
        <div class="topbar-inner">
          <div class="brand">
            <div class="logo">零</div>
            <div>零跑汽车 · 东莞数据中心<small>LEAPMOTOR DONGGUAN HUB</small></div>
          </div>
          <nav class="nav">${links}</nav>
        </div>
      </div>`;
  }

  function buildFooter() {
    const root = document.getElementById("footer-root");
    if (!root) return;
    const now = new Date();
    const d = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    root.innerHTML = `
      <div class="footer">
        零跑汽车 · 东莞区域数据中心 ｜ 全部为外部报表入口 ｜ 最近构建：${d}
      </div>`;
  }

  document.addEventListener("DOMContentLoaded", function () {
    buildTopbar();
    buildFooter();
    wireDimToggles();
  });

  /* ============================================================
     分集团 / 分门店 底座
     5 个经销商集团（来自销售日报「合作伙伴」与库存看板门店归属）
     ============================================================ */
  const GROUPS = ["东唐", "一维", "东富", "华跃", "骏威"];
  // 14 家零售门店（归一化后的核心名）→ 集团
  const STORE_GROUP = {
    "寮步车城": "东富", "莞太路": "一维", "虎门车城": "华跃",
    "常朗路": "东唐", "石排大道": "东唐", "松山湖": "东唐", "东城": "东唐",
    "长安振安东路": "一维", "厚街": "一维", "大岭山": "一维",
    "塘厦车城": "骏威", "企石": "东唐", "高胜车城": "东唐", "高埗车城": "骏威"
  };
  const PREFIX = ["东莞零跑中心", "东莞体验中心", "东莞零跑", "东莞体验", "零跑中心", "体验中心", "零跑", "体验", "东莞"];
  // 交付 Excel 按「母公司简称」命名，与零售门店工商实体一致（已交叉验证）：
  // 零零后=寮步车城(东富)、骋力=莞太路(一维)、华鑫达=虎门车城(华跃) 等
  const COMPANY_GROUP = {
    "零零后": "东富", "骋力": "一维", "华鑫达": "华跃", "东朋": "东唐", "东程": "东唐",
    "东领": "东唐", "宏维": "一维", "力维领跑": "一维", "东金": "东唐", "智威": "骏威",
    "挚维": "一维", "骏远": "骏威", "东新": "东唐", "东锦": "东唐"
  };
  window.COMPANY_GROUP = COMPANY_GROUP;

  window.GROUPS = GROUPS;
  window.STORE_GROUP = STORE_GROUP;
  // 各集团主色（白底可读）
  window.GROUP_COLOR = { "东唐": "#00B42A", "一维": "#2563EB", "东富": "#F59E0B", "华跃": "#8B5CF6", "骏威": "#EF4444" };

  // 把各板块不一致的门店名归一化到核心名（如「东莞零跑中心寮步车城店」「寮步车城店」→「寮步车城」）
  window.normStore = function (n) {
    n = String(n == null ? "" : n).trim();
    for (const p of PREFIX) { if (n.startsWith(p)) { n = n.slice(p.length); break; } }
    n = n.replace(/店$/, "").replace(/镇$/, "");
    return n;
  };
  window.groupOf = function (n) {
    return STORE_GROUP[window.normStore(n)] || COMPANY_GROUP[String(n || "").trim()] || "未分组";
  };

  // 把 [{name, value, ...}] 或 [name, value, ...] 形式按集团聚合
  // getName/getVal 为取值函数；返回 { rows:[{name, sum, items}], other }
  window.aggByGroup = function (items, getName, getVal) {
    const m = {};
    GROUPS.forEach((g) => (m[g] = { name: g, sum: 0, items: [] }));
    let other = 0;
    items.forEach((it) => {
      const g = window.groupOf(getName(it));
      const v = Number(getVal(it)) || 0;
      if (m[g]) { m[g].sum += v; m[g].items.push(it); }
      else { other += v; }
    });
    return { rows: GROUPS.map((g) => m[g]), other };
  };

  // 维度状态：优先 ?dim= 参数，其次 localStorage，默认 store
  window.getDim = function () {
    const p = new URLSearchParams(location.search).get("dim");
    if (p === "group" || p === "store") return p;
    const s = localStorage.getItem("dim");
    return s === "group" || s === "store" ? s : "store";
  };
  window.setDim = function (d) {
    if (d !== "group" && d !== "store") return;
    localStorage.setItem("dim", d);
    const u = new URL(location.href);
    u.searchParams.set("dim", d);
    history.replaceState(null, "", u);
    document.querySelectorAll(".dim-toggle .dt-btn").forEach((b) =>
      b.classList.toggle("active", b.dataset.dim === d)
    );
    window.dispatchEvent(new CustomEvent("dimchange", { detail: { dim: d } }));
  };
  // 各板块在加载后设置 window.onDimChange = function(dim){...} 即可响应切换
  function wireDimToggles() {
    const d = window.getDim();
    document.querySelectorAll(".dim-toggle .dt-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.dim === d);
      b.addEventListener("click", () => window.setDim(b.dataset.dim));
    });
    window.addEventListener("dimchange", (e) => {
      if (typeof window.onDimChange === "function") window.onDimChange(e.detail.dim);
    });
  }

  // 通用：千分位
  window.fmt = function (n) {
    return Number(n).toLocaleString("zh-CN");
  };
  // 通用：中国习惯涨跌着色（涨红跌绿）
  window.deltaHTML = function (v, unit) {
    const up = v >= 0;
    const cls = up ? "up" : "down";
    const sign = up ? "▲ " : "▼ ";
    return `<span class="delta ${cls}">${sign}${up ? "+" : ""}${v}${unit || ""}</span>`;
  };
})();
