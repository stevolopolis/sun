// A play/pause button and a slider over values, after Mike Bostock's Scrubber (ISC).
import {html} from "npm:htl";
import * as Inputs from "npm:@observablehq/inputs";

export function Scrubber(values, {format = (value) => value, initial = 0, delay = 400} = {}) {
  values = Array.from(values);
  const form = html`<form class="scrubber">
    <button name=b type=button></button>
    <input name=i type=range min=0 max=${values.length - 1} value=${initial} step=1>
    <output name=o></output>
  </form>`;
  let interval = null;
  function start() {
    form.b.textContent = "Pause";
    interval = setInterval(() => jump(form.i.valueAsNumber + 1), delay);
  }
  function stop() {
    form.b.textContent = "Play";
    clearInterval(interval);
    interval = null;
  }
  function jump(index) {
    form.i.valueAsNumber = index % values.length;
    form.i.dispatchEvent(new Event("input", {bubbles: true}));
  }
  form.i.oninput = (event) => {
    if (event?.isTrusted && interval !== null) stop(); // dragging the slider stops playback
    form.value = values[form.i.valueAsNumber];
    form.o.value = format(form.value);
  };
  form.b.onclick = () => (interval === null ? start() : stop());
  form.jump = jump;
  form.i.oninput();
  stop();
  Inputs.disposal(form).then(stop);
  return form;
}
