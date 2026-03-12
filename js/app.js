const details = {
  finance: {
    title: "Finance Detail",
    body: "This section would display full budget vs. actuals by department, monthly cash flow trends, reserve fund levels, Residential Services Levy collection details, and year-over-year comparisons.\n\nIn a production build, this links to the Finance module with downloadable reports and GL drill-down."
  },
  members: {
    title: "Membership & Engagement Detail",
    body: "Breakdowns by neighbourhood (Wesbrook, East Campus, Hawthorn), new vs. returning members, UNA Card usage by venue, event attendance by type, newsletter open rates, and volunteer hour trends by program area."
  },
  programs: {
    title: "Recreation & Programs Detail",
    body: "Program fill rates by category (youth, adult, senior, fitness), facility utilization by hour and day, drop-in counts by sport, camp registrations, waitlist management, and cost-recovery rates per program."
  },
  risk: {
    title: "Action Items & Risk Register",
    body: "Full list of open items with owner, due date, and status. Includes board decisions required, policy gaps, maintenance deferrals, HR flags, and insurance/liability matters."
  },
  alerts: {
    title: "Board Attention Items",
    body: "Detailed breakdown of all flagged items with supporting data, options for resolution, and recommended motions where applicable. Items are prioritized by urgency and financial impact."
  },
  governance: {
    title: "Governance & Strategic Plan Detail",
    body: "Board attendance by director, committee roster and vacancy status, strategic initiative progress by pillar, AGM preparation checklist, open resolutions log, and election timeline."
  },
  tab: {
    title: "Section Coming Soon",
    body: "In a full implementation, each tab would open a dedicated sub-dashboard with deeper analytics for that operational area. This is a prototype of the summary view."
  }
};

function showModal(key) {
  var d = details[key];
  document.getElementById('modal-title').textContent = d.title;
  document.getElementById('modal-body').textContent = d.body;
  document.getElementById('modal').classList.add('open');
}

function closeModal(e) {
  document.getElementById('modal').classList.remove('open');
}

// Animate bars on load
window.addEventListener('load', function () {
  document.querySelectorAll('.bar-fill').forEach(function (bar) {
    var w = bar.style.width;
    bar.style.width = '0%';
    setTimeout(function () { bar.style.width = w; }, 300);
  });
});
