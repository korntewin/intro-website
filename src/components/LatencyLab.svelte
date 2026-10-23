<script lang="ts">
  // An illustrative Little's Law-style CPU capacity calculation, not production data.
  let rps = $state(300);
  let cpuMs = $state(14);
  const targetUtilization = 0.7;

  let cpuDemand = $derived((rps * cpuMs) / 1000);
  let requiredCores = $derived(Math.max(1, Math.ceil(cpuDemand / targetUtilization)));
  let actualUtilization = $derived(Math.min(100, Math.round(100 * cpuDemand / requiredCores)));
  let spareCapacity = $derived(Math.max(0, Math.round(100 - actualUtilization)));
</script>

<div class="capacity-lab">
  <div class="lab-titlebar">
    <div class="lab-file"><span class="lab-file-dot" aria-hidden="true"></span> capacity-planner.rs <span class="lab-comment">// interactive sketch</span></div>
    <span class="lab-live"><span aria-hidden="true">●</span> LIVE CALCULATION</span>
  </div>
  <div class="lab-content">
    <div class="lab-controls">
      <p class="lab-eyebrow">INPUT / CHANGE THE WORKLOAD</p>
      <div class="lab-control">
        <div class="lab-control-head"><label for="lab-rps">Request rate</label><output for="lab-rps">{rps.toLocaleString()} <small>req/s</small></output></div>
        <input id="lab-rps" type="range" min="50" max="1200" step="25" bind:value={rps} />
        <div class="lab-range"><span>50</span><span>1,200</span></div>
      </div>
      <div class="lab-control">
        <div class="lab-control-head"><label for="lab-cpu">CPU time per request</label><output for="lab-cpu">{cpuMs} <small>ms</small></output></div>
        <input id="lab-cpu" type="range" min="2" max="40" step="1" bind:value={cpuMs} />
        <div class="lab-range"><span>2 ms</span><span>40 ms</span></div>
      </div>
      <div class="lab-assumption"><span class="lab-assumption-key">target_cpu_util</span><span>70%</span></div>
      <p class="lab-disclaimer">Simplified CPU sizing only. Assumes homogeneous requests and no other bottlenecks; not a measured benchmark or latency prediction.</p>
    </div>
    <div class="lab-result" aria-live="polite" aria-atomic="true">
      <p class="lab-eyebrow">OUTPUT / ESTIMATED CAPACITY</p>
      <div class="lab-big-number"><strong>{requiredCores}</strong><span>CPU cores<br />needed</span></div>
      <div class="lab-meter-label"><span>Estimated utilization</span><b>{actualUtilization}%</b></div>
      <div class="lab-meter" role="progressbar" aria-label="Estimated utilization" aria-valuenow={actualUtilization} aria-valuemin="0" aria-valuemax="100"><div class="lab-meter-fill" style={'width:' + actualUtilization + '%'}></div><div class="lab-meter-target" title="Target 70% utilization"></div></div>
      <div class="lab-stats"><div><span>CPU demand</span><strong>{cpuDemand.toFixed(2)} <small>cores</small></strong></div><div><span>Unused budget</span><strong>{spareCapacity}<small>%</small></strong></div></div>
    </div>
  </div>
  <div class="lab-formula"><span aria-hidden="true">⌁</span><code>cores = ceil((req/s × cpu_ms / 1000) / 0.70)</code><span class="formula-label">MODEL / 001</span></div>
</div>

<style>
  .capacity-lab { --lab-bg: #101c23; --lab-border: #304149; --lab-ink: #f4f7f4; --lab-muted: #9dadaf; --lab-accent: #ff905b; color:var(--lab-ink); background:var(--lab-bg); border:1px solid #2d3b43; border-radius:24px; overflow:hidden; box-shadow:0 26px 60px rgba(9,26,29,.12); }
  .lab-titlebar { min-height:62px; display:flex; align-items:center; justify-content:space-between; gap:12px; padding:14px 28px; border-bottom:1px solid var(--lab-border); font:600 .76rem/1.4 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
  .lab-file { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  .lab-file-dot { height:10px; width:10px; border-radius:50%; background:var(--lab-accent); box-shadow:0 0 0 4px rgba(255,144,91,.12); }
  .lab-comment { color:var(--lab-muted); font-weight:400; }
  .lab-live { color:#a4dfc7; font-size:.69rem; letter-spacing:.07em; white-space:nowrap; }
  .lab-live span { margin-right:6px; }
  .lab-content { display:grid; grid-template-columns:1.08fr 1fr; }
  .lab-controls { padding:36px 38px 30px; border-right:1px solid var(--lab-border); }
  .lab-eyebrow { font:700 .7rem/1.4 ui-monospace, Menlo, Consolas, monospace; letter-spacing:.1em; color:var(--lab-muted); margin:0 0 34px; }
  .lab-control { margin:0 0 34px; }
  .lab-control-head { display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:15px; }
  label { font-size:.92rem; font-weight:650; }
  output { color:var(--lab-accent); font:700 1.35rem/1 ui-monospace, Menlo, monospace; }
  output small { color:var(--lab-muted); font-size:.7rem; font-weight:500; }
  input[type="range"] { display:block; width:100%; cursor:pointer; accent-color:var(--lab-accent); background:transparent; }
  input[type="range"]:focus-visible { outline:2px solid var(--lab-accent); outline-offset:5px; border-radius:10px; }
  .lab-range { display:flex; justify-content:space-between; font:500 .72rem/1.5 ui-monospace, Menlo, monospace; color:var(--lab-muted); margin-top:8px; }
  .lab-assumption { display:flex; justify-content:space-between; gap:10px; padding:12px 14px; background:#1b2b32; border-radius:10px; font-size:.85rem; }
  .lab-assumption-key { color:#b4d9ce; font-family:ui-monospace, Menlo, monospace; }
  .lab-disclaimer { margin:17px 0 0; font-size:.79rem; line-height:1.7; color:var(--lab-muted); }
  .lab-result { display:flex; flex-direction:column; padding:36px 38px; background: radial-gradient(ellipse at 88% 20%,rgba(255,121,65,.11),transparent 57%), #14232b; }
  .lab-big-number { display:flex; align-items:baseline; gap:18px; margin:-10px 0 26px; }
  .lab-big-number strong { font-size:clamp(4.8rem,8vw,7.8rem); line-height:1; font-weight:800; letter-spacing:-.09em; color:var(--lab-accent); font-variant-numeric:tabular-nums; }
  .lab-big-number span { font-size:1rem; font-weight:600; line-height:1.5; }
  .lab-meter-label { display:flex; justify-content:space-between; font-size:.82rem; gap:10px; color:var(--lab-muted); margin-top:auto; }
  .lab-meter-label b { color:var(--lab-ink); }
  .lab-meter { height:13px; width:100%; position:relative; border-radius:99px; background:#293c42; overflow:hidden; margin:12px 0 24px; }
  .lab-meter-fill { height:100%; background:linear-gradient(90deg,#f96c37,#ffbd7b); border-radius:inherit; transition:width .24s ease; }
  .lab-meter-target { position:absolute; height:100%; width:2px; left:70%; top:0; background:white; opacity:.85; }
  .lab-stats { display:grid; grid-template-columns:1fr 1fr; border-top:1px solid var(--lab-border); padding-top:20px; gap:20px; }
  .lab-stats div { display:flex; flex-direction:column; gap:7px; }
  .lab-stats span { font-size:.74rem; color:var(--lab-muted); }
  .lab-stats strong { font:700 1.38rem ui-monospace, Menlo, monospace; }
  .lab-stats small { font-size:.72rem; color:var(--lab-muted); }
  .lab-formula { padding:15px 28px; display:flex; align-items:center; gap:12px; border-top:1px solid var(--lab-border); color:#b1c9c9; }
  .lab-formula code { background:transparent; font:500 .76rem ui-monospace, Menlo, Consolas, monospace; overflow-wrap:anywhere; }
  .formula-label { margin-left:auto; white-space:nowrap; color:#788f94; font:.66rem ui-monospace, Menlo, monospace; }
  @media (max-width:730px) {
    .lab-titlebar{padding:14px 20px;}
    .lab-content{grid-template-columns:1fr;}
    .lab-controls{border-right:0;border-bottom:1px solid var(--lab-border);padding:28px 25px;}
    .lab-result{padding:28px 25px;}
    .lab-eyebrow{margin-bottom:25px;}
    .lab-big-number{margin:0 0 26px;}
    .lab-formula{padding:15px 20px;}
  }
  @media (max-width:450px) {
    .lab-titlebar{align-items:flex-start;flex-direction:column;}
    .formula-label{display:none;}
    .lab-stats{gap:10px;}
  }
  @media (prefers-reduced-motion: reduce) { .lab-meter-fill { transition:none; } }
</style>
