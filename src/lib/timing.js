async function delay(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

async function waitFor(test) {
  if (test()) return null;
  await delay(10);
  return waitFor(test);
}

async function nextTick() {
  return delay(0);
}

module.exports = {delay, waitFor, nextTick};
