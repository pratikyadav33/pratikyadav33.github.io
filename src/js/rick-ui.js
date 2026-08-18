(() => {
  const portraitBtn = document.getElementById("rick-portrait");
  const portraitImg = document.getElementById("rick-portrait-img");
  const pickleTrigger = document.getElementById("pickle-trigger");
  const pickleToast = document.getElementById("pickle-toast");
  const agentSlider = document.getElementById("agent-count");
  const agentOutput = document.getElementById("agent-count-val");

  const PORTRAIT = "/media/rick-portrait.svg";
  const PICKLE = "/media/pickle-rick.svg";

  let pickleOn = false;
  let toastTimer = null;

  function showToast() {
    if (!pickleToast) return;
    pickleToast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      pickleToast.hidden = true;
    }, 2200);
  }

  function setPickleMode(on) {
    pickleOn = on;
    document.body.classList.toggle("pickle-mode", on);
    if (portraitImg) portraitImg.src = on ? PICKLE : PORTRAIT;
    if (window.RickLab) window.RickLab.setPickleMode(on);
    if (on) showToast();
  }

  function togglePickle() {
    setPickleMode(!pickleOn);
  }

  if (portraitBtn) portraitBtn.addEventListener("click", togglePickle);
  if (pickleTrigger) pickleTrigger.addEventListener("click", togglePickle);

  if (agentSlider && agentOutput) {
    const syncAgents = () => {
      const n = Number(agentSlider.value);
      agentOutput.textContent = String(n);
      if (window.RickLab) window.RickLab.setAgentCount(n);
    };
    agentSlider.addEventListener("input", syncAgents);
    syncAgents();
  }
})();
