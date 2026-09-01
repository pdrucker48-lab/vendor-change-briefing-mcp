const button = document.querySelector('#brief');
const conversation = document.querySelector('#conversation');
const summary = document.querySelector('#summary');
const changes = document.querySelector('#changes');

button.addEventListener('click', async () => {
  button.disabled = true;
  conversation.hidden = false;
  const response = await fetch('/api/demo-briefing');
  const briefing = await response.json();
  summary.textContent = briefing.summary;
  changes.replaceChildren(...briefing.changes.map((change) => {
    const card = document.createElement('article');
    card.className = `card ${change.materiality}`;
    const heading = document.createElement('h2');
    heading.textContent = `${change.vendor} · ${change.document}`;
    const evidence = document.createElement('p');
    evidence.textContent = change.evidence;
    const action = document.createElement('p');
    action.className = 'action';
    action.textContent = change.recommendedAction;
    const followUp = document.createElement('button');
    followUp.className = 'follow-up';
    followUp.textContent = `Why does ${change.vendor} matter?`;
    const answer = document.createElement('p');
    answer.className = 'follow-up-answer';
    answer.hidden = true;
    followUp.addEventListener('click', async () => {
      followUp.disabled = true;
      const response = await fetch(`/api/demo-follow-up?vendor=${encodeURIComponent(change.vendor)}`);
      const detail = await response.json();
      answer.textContent = `${detail.whyItMatters} ${detail.recommendedAction}`;
      answer.hidden = false;
      followUp.textContent = 'Follow-up answered';
    });
    card.append(heading, evidence, action, followUp, answer);
    return card;
  }));
  button.textContent = 'Briefing ready';
});
