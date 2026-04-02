auth.requireAuth();

document.getElementById('navbar').innerHTML = utils.buildNavbar('dashboard');

async function loadDashboard() {
    try {
        const res = await api.get('/dashboard/summary');
        const d = res.data;

        document.getElementById('total-tasks').textContent  = d.totalTasks;
        document.getElementById('tasks-todo').textContent   = d.byStatus.TODO;
        document.getElementById('tasks-doing').textContent  = d.byStatus.DOING;
        document.getElementById('tasks-done').textContent   = d.byStatus.DONE;
        document.getElementById('tasks-overdue').textContent = d.overdueTasks;
        document.getElementById('completion-rate').textContent = d.completionRate.toFixed(1) + '%';

        const progressBar = document.getElementById('completion-bar');
        progressBar.style.width = d.completionRate + '%';
        progressBar.setAttribute('aria-valuenow', d.completionRate);

        // Priority breakdown
        document.getElementById('priority-low').textContent    = d.byPriority.LOW;
        document.getElementById('priority-medium').textContent = d.byPriority.MEDIUM;
        document.getElementById('priority-high').textContent   = d.byPriority.HIGH;

    } catch (err) {
        utils.showToast('Erro ao carregar dashboard: ' + err.message, 'error');
    }
}

loadDashboard();

// Exibir botão admin se for ADMIN
if (auth.isAdmin()) {
    document.getElementById('btn-report-admin').classList.remove('d-none');
}

async function downloadReport(type) {
    const btn = document.getElementById(type === 'admin' ? 'btn-report-admin' : 'btn-report-me');
    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Gerando...';

    try {
        const token = auth.getToken();
        const baseUrl = API_BASE.replace('/api', '');
        const res = await fetch(`${baseUrl}/api/reports/${type}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Falha ao gerar relatório');

        const blob = await res.blob();
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = type === 'admin'
            ? `relatorio-administrativo-${new Date().toISOString().slice(0,10)}.pdf`
            : `minhas-atividades-${new Date().toISOString().slice(0,10)}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        utils.showToast('Relatório gerado com sucesso!', 'success');
    } catch (err) {
        utils.showToast('Erro ao gerar relatório: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
    }
}
