const FALLBACK_STATUS_LABELS = {
  todo: 'pendentes',
  doing: 'em andamento',
  done: 'concluídas',
  blocked: 'bloqueadas'
};

function formatDate(isoString) {
  if (!isoString) {
    return 'data indisponível';
  }
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return isoString;
  }
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function toTitleCase(value) {
  if (typeof value !== 'string') return '';
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function countBy(array, keyFn) {
  const counter = new Map();
  if (!Array.isArray(array)) {
    return counter;
  }
  for (const item of array) {
    const key = keyFn(item);
    if (!key) continue;
    counter.set(key, (counter.get(key) ?? 0) + 1);
  }
  return counter;
}

function sortEntriesDesc(counter) {
  return Array.from(counter.entries()).sort((a, b) => b[1] - a[1]);
}

function cleanSegment(segment) {
  if (typeof segment !== 'string') {
    return '';
  }
  return segment
    .replace(/\(.*?\)/g, '')
    .replace(/\s+-\s*FINALIZADA$/i, '')
    .trim();
}

function humanizeTaskTitle(title) {
  if (!title) return '';
  const segments = title.split('>').map((part) => cleanSegment(part));
  const last = segments[segments.length - 1];
  return last ? last : cleanSegment(title);
}

function humanizeTaskPath(title, depth = 2) {
  if (!title) return '';
  const segments = title
    .split('>')
    .map((part) => cleanSegment(part))
    .filter(Boolean);
  if (segments.length === 0) {
    return '';
  }
  const start = Math.max(segments.length - depth, 0);
  return segments.slice(start).join(' > ');
}

function extractAssignee(task) {
  if (!task || !Array.isArray(task.tags) || task.tags.length === 0) {
    return null;
  }
  const raw = task.tags[task.tags.length - 1];
  if (typeof raw !== 'string') return null;
  const cleaned = cleanSegment(raw);
  if (!cleaned) return null;
  const taskTitle = humanizeTaskTitle(task.title);
  if (cleaned.toLowerCase() === taskTitle.toLowerCase()) {
    return null;
  }
  return toTitleCase(cleaned);
}

function normalizeCollaboratorName(name) {
  if (!name) return null;
  const cleaned = String(name)
    .replace(/\s+-\s*FINALIZADA$/i, '')
    .replace(/\(.*?\)/g, '')
    .trim();
  if (!cleaned) return null;
  if (/^luis\s+adriano$/i.test(cleaned)) {
    return 'Adriano';
  }
  return cleaned;
}

function formatStatusLine(statusCounter, status, fallbackLabel) {
  const count = statusCounter.get(status) ?? 0;
  const label = FALLBACK_STATUS_LABELS[status] ?? fallbackLabel ?? status;
  return `${count} ${label}`;
}

export function generateReport(data = {}) {
  const topics = Array.isArray(data.topics) ? data.topics : [];
  const collaborators = Array.isArray(data.collaborators) ? data.collaborators : [];
  const tasks = Array.isArray(data.tasks) ? data.tasks : [];

  const snapshotISO = data.meta?.generatedAt ?? new Date().toISOString();
  const snapshotDate = formatDate(snapshotISO);
  const topicCount = topics.length;
  const collaboratorCount = collaborators.length;
  const normalizedCollaborators = new Set(collaborators.map(normalizeCollaboratorName).filter(Boolean));
  const uniqueCollaborators = normalizedCollaborators.size;
  const totalTasks = tasks.length;

  const statusCounter = countBy(tasks, (task) => task?.status ?? 'indefinido');
  const topicCounter = countBy(tasks, (task) => task?.topic ?? 'Sem assunto');
  const doneTasks = tasks.filter((task) => task?.status === 'done');
  const doingTasks = tasks.filter((task) => task?.status === 'doing');
  const blockedTasks = tasks.filter((task) => task?.status === 'blocked');
  const todoCount = statusCounter.get('todo') ?? 0;
  const todoPercentage = totalTasks > 0 ? Math.round((todoCount / totalTasks) * 100) : 0;

  const sortedTopics = sortEntriesDesc(topicCounter);
  const [topTopic, secondTopic, thirdTopic] = sortedTopics;
  const smallBacklogs = sortedTopics.filter(([, count]) => count <= 8 && count > 1).slice(0, 3);
  const singleTopics = sortedTopics.filter(([, count]) => count === 1).map(([topic]) => topic);

  const doneByTopic = countBy(doneTasks, (task) => task?.topic ?? 'Sem assunto');
  const sortedDoneTopics = sortEntriesDesc(doneByTopic);
  const [mainDoneTopicEntry] = sortedDoneTopics;
  const doneHighlights = mainDoneTopicEntry
    ? doneTasks
        .filter((task) => task?.topic === mainDoneTopicEntry[0])
        .slice(0, 3)
        .map((task) => `“${humanizeTaskTitle(task?.title)}”`)
    : [];

  const assigneeCounter = countBy(doneTasks, extractAssignee);
  const topAssignees = sortEntriesDesc(assigneeCounter).slice(0, 3).map(([name]) => name);

  const distributionLines = [];
  if (topTopic && secondTopic && thirdTopic) {
    distributionLines.push(
      `${topTopic[0]} concentra o maior volume (${topTopic[1]} itens), seguida por ${secondTopic[0]} (${secondTopic[1]}) e ${thirdTopic[0]} (${thirdTopic[1]}).`
    );
  }
  if (smallBacklogs.length > 0) {
    const backlogSentence = smallBacklogs
      .map(([topic, count]) => `${topic} (${count})`)
      .join(', ');
    distributionLines.push(`Backlogs menores em ${backlogSentence}.`);
  }
  if (singleTopics.length > 0) {
    const examples = singleTopics.slice(0, 3).join(', ');
    distributionLines.push(`Assuntos pontuais têm apenas 1 item cada (p. ex. ${examples}).`);
  }

  const doneLines = [];
  if (mainDoneTopicEntry) {
    const [topicName, count] = mainDoneTopicEntry;
    const highlightsSentence = doneHighlights.length > 0 ? `como ${doneHighlights.join(', ')}.` : '';
    doneLines.push(
      `Predominam entregas de “${topicName}” (${count} itens concluídos) ${highlightsSentence}`.trim()
    );
  }
  if (topAssignees.length > 0) {
    let formatted;
    if (topAssignees.length === 1) {
      formatted = topAssignees[0];
    } else if (topAssignees.length === 2) {
      formatted = `${topAssignees[0]} e ${topAssignees[1]}`;
    } else {
      const head = topAssignees.slice(0, -1).join(', ');
      formatted = `${head} e ${topAssignees[topAssignees.length - 1]}`;
    }
    doneLines.push(`Finalizadas principalmente por ${formatted}.`);
  }

  const doingLines = doingTasks.map((task) => {
    const assignee = extractAssignee(task);
    const owner = assignee ? ` – responsável: ${assignee}` : '';
    const note = task?.notes ? ` (nota: ${String(task.notes).trim()})` : '';
    return `• ${humanizeTaskPath(task?.title)} (${task?.topic})${owner}${note}`;
  });

  const blockedLines = blockedTasks.map((task) => {
    const dependencyNote = task?.notes ? ` – ${String(task.notes).trim()}` : '';
    return `• ${humanizeTaskPath(task?.title)} (${task?.topic})${dependencyNote}`;
  });

  const recommendations = [];
  if (topTopic) {
    recommendations.push(
      `Priorizar ${topTopic[0]}: revisar os ${topTopic[1]} itens com foco especial nas pendências críticas (em andamento/bloqueadas).`
    );
  }
  if (blockedTasks.length > 0) {
    recommendations.push('Desbloquear dependências: alinhar entregas correlatas (dev/Java ou pré-requisitos) para liberar os itens bloqueados.');
  }
  if (todoCount > 0) {
    recommendations.push(
      `Refinar backlog “todo”: validar relevância e prioridades dos ${todoCount} itens pendentes antes de iniciar novos ciclos.`
    );
  }
  if (doneHighlights.length > 0) {
    recommendations.push('Consolidar aprendizados das entregas: documentar padrões das tarefas concluídas para acelerar homologações futuras.');
  }

  const lines = [];
  lines.push(`# Relatório – Painel de Tarefas (snapshot ${snapshotDate})`);
  lines.push('');
  lines.push('## Visão geral');
  lines.push('');
  lines.push(
    `Base de dados gerada em ${snapshotDate} e organizada por ${topicCount} assuntos principais e ${collaboratorCount} colaboradores listados (${uniqueCollaborators} nomes únicos após normalização).`
  );
  lines.push('');
  const statusSummary = [
    formatStatusLine(statusCounter, 'done'),
    formatStatusLine(statusCounter, 'todo'),
    formatStatusLine(statusCounter, 'doing'),
    formatStatusLine(statusCounter, 'blocked')
  ].join(', ');
  lines.push(
    `Situação atual das ${totalTasks} tarefas: ${statusSummary} (~${todoPercentage}% aguardando início).`
  );
  lines.push('');
  lines.push('## Distribuição por assunto');
  lines.push('');
  lines.push(distributionLines.length > 0 ? distributionLines.join(' ') : 'Sem informações de distribuição disponíveis.');
  lines.push('');
  lines.push('## Destaques por status');
  lines.push('');
  lines.push('### Concluídas');
  lines.push('');
  lines.push(doneLines.length > 0 ? doneLines.join(' ') : 'Sem destaques no período.');
  lines.push('');
  lines.push('### Em andamento');
  lines.push('');
  lines.push(doingLines.length > 0 ? doingLines.join('\n') : 'Nenhuma tarefa em andamento registrada.');
  lines.push('');
  lines.push('### Bloqueadas');
  lines.push('');
  lines.push(blockedLines.length > 0 ? blockedLines.join('\n') : 'Nenhum bloqueio reportado.');
  lines.push('');
  lines.push('## Recomendações e próximas ações');
  lines.push('');
  lines.push(recommendations.length > 0 ? recommendations.map((item) => `- ${item}`).join('\n') : '- Nenhuma recomendação adicional.');
  lines.push('');

  const markdown = lines.join('\n');

  return {
    markdown,
    snapshotDate,
    totals: {
      totalTasks,
      todoCount,
      doingCount: doingTasks.length,
      doneCount: doneTasks.length,
      blockedCount: blockedTasks.length
    }
  };
}

export { formatDate };
