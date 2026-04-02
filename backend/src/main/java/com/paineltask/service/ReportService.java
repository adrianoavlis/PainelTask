package com.paineltask.service;

import com.lowagie.text.DocumentException;
import com.paineltask.model.Task;
import com.paineltask.model.User;
import com.paineltask.model.enums.Priority;
import com.paineltask.model.enums.TaskStatus;
import com.paineltask.repository.TaskRepository;
import com.paineltask.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.xhtmlrenderer.pdf.ITextRenderer;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    private static final DateTimeFormatter BR_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter BR_DATETIME = DateTimeFormatter.ofPattern("dd/MM/yyyy 'às' HH:mm");

    @Transactional(readOnly = true)
    public byte[] generateAdminReport(User admin) throws DocumentException {
        List<Task> tasks = taskRepository.findAllWithUsers();
        List<User> users = userRepository.findAll();
        return convertToPdf(buildAdminHtml(tasks, users, admin));
    }

    @Transactional(readOnly = true)
    public byte[] generateUserReport(User user) throws DocumentException {
        List<Task> tasks = taskRepository.findByUserWithAssociations(user);
        return convertToPdf(buildUserHtml(tasks, user));
    }

    // -------------------------------------------------------------------------
    // HTML — Relatório Administrativo
    // -------------------------------------------------------------------------
    private String buildAdminHtml(List<Task> tasks, List<User> users, User admin) {
        LocalDate today = LocalDate.now();
        long total   = tasks.size();
        long todo    = count(tasks, TaskStatus.TODO);
        long doing   = count(tasks, TaskStatus.DOING);
        long done    = count(tasks, TaskStatus.DONE);
        long overdue = tasks.stream().filter(t -> isOverdue(t, today)).count();
        long high    = count(tasks, Priority.HIGH);
        long medium  = count(tasks, Priority.MEDIUM);
        long low     = count(tasks, Priority.LOW);
        double rate  = total > 0 ? (done * 100.0 / total) : 0;

        Map<Long, List<Task>> byUser = tasks.stream()
                .collect(Collectors.groupingBy(t -> t.getCreatedBy().getId()));

        StringBuilder sb = new StringBuilder();
        sb.append(htmlHead("Relatório Administrativo — PainelTask"));
        sb.append("<body>");

        // Header
        sb.append("<div class='header'>");
        sb.append("<table class='header-table'><tr>");
        sb.append("<td class='header-brand'>PainelTask</td>");
        sb.append("<td class='header-info'>");
        sb.append("<div class='header-title'>Relatório Administrativo</div>");
        sb.append("<div class='header-sub'>Visão geral completa do sistema</div>");
        sb.append("</td></tr></table>");
        sb.append("<div class='header-meta'>Gerado em: ").append(today.format(BR_DATE))
          .append(" &nbsp;|&nbsp; Por: ").append(escXml(admin.getName()))
          .append(" &nbsp;|&nbsp; Total de usuários: ").append(users.size())
          .append("</div>");
        sb.append("</div>");

        // Stats
        sb.append("<div class='section-title'>Resumo Geral</div>");
        sb.append("<table class='stats-table'><tr>");
        sb.append(statCell(total,  "Total de Tarefas", "#2563EB", "#EFF6FF"));
        sb.append(statCell(todo,   "A Fazer",           "#6B7280", "#F9FAFB"));
        sb.append(statCell(doing,  "Em Progresso",      "#2563EB", "#DBEAFE"));
        sb.append(statCell(done,   "Concluídas",        "#16A34A", "#DCFCE7"));
        sb.append("</tr><tr>");
        sb.append(statCell(overdue, "Em Atraso",        "#DC2626", "#FEE2E2"));
        sb.append(statCell(high,    "Alta Prioridade",  "#DC2626", "#FEE2E2"));
        sb.append(statCell(medium,  "Média Prioridade", "#D97706", "#FEF3C7"));
        sb.append(statCell(low,     "Baixa Prioridade", "#16A34A", "#DCFCE7"));
        sb.append("</tr></table>");

        // Completion bar
        sb.append("<div class='completion-bar-container'>");
        sb.append("<span class='completion-label'>Taxa de Conclusão: <b>").append(String.format("%.1f", rate)).append("%</b></span>");
        sb.append("<div class='progress-track'><div class='progress-fill' style='width:").append((int) rate).append("%;'></div></div>");
        sb.append("</div>");

        // Per-user distribution
        sb.append("<div class='section-title'>Distribuição por Usuário</div>");
        sb.append("<table class='data-table'>");
        sb.append("<thead><tr>");
        sb.append("<th>Usuário</th><th>Email</th><th>Perfil</th>");
        sb.append("<th style='text-align:center;'>A Fazer</th>");
        sb.append("<th style='text-align:center;'>Em Progresso</th>");
        sb.append("<th style='text-align:center;'>Concluídas</th>");
        sb.append("<th style='text-align:center;'>Total</th>");
        sb.append("</tr></thead><tbody>");

        for (int i = 0; i < users.size(); i++) {
            User u = users.get(i);
            List<Task> ut = tasks.stream()
                    .filter(t -> t.getCreatedBy().getId().equals(u.getId())
                              || (t.getAssignedTo() != null && t.getAssignedTo().getId().equals(u.getId())))
                    .collect(Collectors.toList());
            long uTodo  = ut.stream().filter(t -> t.getStatus() == TaskStatus.TODO).count();
            long uDoing = ut.stream().filter(t -> t.getStatus() == TaskStatus.DOING).count();
            long uDone  = ut.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count();
            String rowClass = i % 2 == 0 ? "" : " class='row-alt'";
            sb.append("<tr").append(rowClass).append(">");
            sb.append("<td><b>").append(escXml(u.getName())).append("</b></td>");
            sb.append("<td>").append(escXml(u.getEmail())).append("</td>");
            sb.append("<td>").append(roleLabel(u)).append("</td>");
            sb.append("<td style='text-align:center;'>").append(uTodo).append("</td>");
            sb.append("<td style='text-align:center;'>").append(uDoing).append("</td>");
            sb.append("<td style='text-align:center;'>").append(uDone).append("</td>");
            sb.append("<td style='text-align:center;'><b>").append(ut.size()).append("</b></td>");
            sb.append("</tr>");
        }
        sb.append("</tbody></table>");

        // All tasks
        sb.append("<div class='section-title' style='page-break-before:always;'>Todas as Tarefas</div>");
        sb.append("<table class='data-table'>");
        sb.append("<thead><tr>");
        sb.append("<th>#</th><th>Título</th><th>Status</th><th>Prioridade</th>");
        sb.append("<th>Responsável</th><th>Criado por</th><th>Vencimento</th><th>Tópico</th>");
        sb.append("</tr></thead><tbody>");

        for (int i = 0; i < tasks.size(); i++) {
            Task t = tasks.get(i);
            String rowClass = i % 2 == 0 ? "" : " class='row-alt'";
            String overdueStyle = isOverdue(t, today) ? " style='color:#DC2626;font-weight:bold;'" : "";
            sb.append("<tr").append(rowClass).append(">");
            sb.append("<td style='color:#6B7280;'>").append(t.getId()).append("</td>");
            sb.append("<td><b>").append(escXml(t.getTitle())).append("</b></td>");
            sb.append("<td>").append(statusBadge(t.getStatus())).append("</td>");
            sb.append("<td>").append(priorityBadge(t.getPriority())).append("</td>");
            sb.append("<td>").append(t.getAssignedTo() != null ? escXml(t.getAssignedTo().getName()) : "<span style='color:#9CA3AF;'>—</span>").append("</td>");
            sb.append("<td>").append(escXml(t.getCreatedBy().getName())).append("</td>");
            sb.append("<td").append(overdueStyle).append(">");
            sb.append(t.getDueDate() != null ? t.getDueDate().format(BR_DATE) : "<span style='color:#9CA3AF;'>—</span>");
            sb.append("</td>");
            sb.append("<td>").append(t.getTopic() != null ? escXml(t.getTopic()) : "<span style='color:#9CA3AF;'>—</span>").append("</td>");
            sb.append("</tr>");
        }
        sb.append("</tbody></table>");
        sb.append(htmlFooter());
        return sb.toString();
    }

    // -------------------------------------------------------------------------
    // HTML — Relatório do Usuário
    // -------------------------------------------------------------------------
    private String buildUserHtml(List<Task> tasks, User user) {
        LocalDate today = LocalDate.now();
        long total   = tasks.size();
        long todo    = count(tasks, TaskStatus.TODO);
        long doing   = count(tasks, TaskStatus.DOING);
        long done    = count(tasks, TaskStatus.DONE);
        long overdue = tasks.stream().filter(t -> isOverdue(t, today)).count();
        double rate  = total > 0 ? (done * 100.0 / total) : 0;

        StringBuilder sb = new StringBuilder();
        sb.append(htmlHead("Relatório de Atividades — " + user.getName()));
        sb.append("<body>");

        // Header
        sb.append("<div class='header'>");
        sb.append("<table class='header-table'><tr>");
        sb.append("<td class='header-brand'>PainelTask</td>");
        sb.append("<td class='header-info'>");
        sb.append("<div class='header-title'>Relatório de Atividades</div>");
        sb.append("<div class='header-sub'>").append(escXml(user.getName()))
          .append(" &nbsp;&bull;&nbsp; ").append(escXml(user.getEmail())).append("</div>");
        sb.append("</td></tr></table>");
        sb.append("<div class='header-meta'>Gerado em: ").append(today.format(BR_DATE)).append("</div>");
        sb.append("</div>");

        // Stats
        sb.append("<div class='section-title'>Resumo das Atividades</div>");
        sb.append("<table class='stats-table'><tr>");
        sb.append(statCell(total,   "Total de Tarefas", "#2563EB", "#EFF6FF"));
        sb.append(statCell(todo,    "A Fazer",           "#6B7280", "#F9FAFB"));
        sb.append(statCell(doing,   "Em Progresso",      "#2563EB", "#DBEAFE"));
        sb.append(statCell(done,    "Concluídas",        "#16A34A", "#DCFCE7"));
        sb.append("</tr><tr>");
        sb.append(statCell(overdue, "Em Atraso",         "#DC2626", "#FEE2E2"));
        sb.append(statCell(count(tasks, Priority.HIGH),   "Alta Prioridade",  "#DC2626", "#FEE2E2"));
        sb.append(statCell(count(tasks, Priority.MEDIUM), "Média Prioridade", "#D97706", "#FEF3C7"));
        sb.append(statCell(count(tasks, Priority.LOW),    "Baixa Prioridade", "#16A34A", "#DCFCE7"));
        sb.append("</tr></table>");

        // Completion bar
        sb.append("<div class='completion-bar-container'>");
        sb.append("<span class='completion-label'>Taxa de Conclusão: <b>").append(String.format("%.1f", rate)).append("%</b></span>");
        sb.append("<div class='progress-track'><div class='progress-fill' style='width:").append((int) rate).append("%;'></div></div>");
        sb.append("</div>");

        // Tasks table
        sb.append("<div class='section-title'>Minhas Tarefas</div>");
        sb.append("<table class='data-table'>");
        sb.append("<thead><tr>");
        sb.append("<th>#</th><th>Título</th><th>Status</th><th>Prioridade</th>");
        sb.append("<th>Tópico</th><th>Tags</th><th>Vencimento</th><th>Atualizado em</th>");
        sb.append("</tr></thead><tbody>");

        for (int i = 0; i < tasks.size(); i++) {
            Task t = tasks.get(i);
            String rowClass = i % 2 == 0 ? "" : " class='row-alt'";
            String overdueStyle = isOverdue(t, today) ? " style='color:#DC2626;font-weight:bold;'" : "";
            sb.append("<tr").append(rowClass).append(">");
            sb.append("<td style='color:#6B7280;'>").append(t.getId()).append("</td>");
            sb.append("<td><b>").append(escXml(t.getTitle())).append("</b></td>");
            sb.append("<td>").append(statusBadge(t.getStatus())).append("</td>");
            sb.append("<td>").append(priorityBadge(t.getPriority())).append("</td>");
            sb.append("<td>").append(t.getTopic() != null ? escXml(t.getTopic()) : "<span style='color:#9CA3AF;'>—</span>").append("</td>");
            sb.append("<td>").append(t.getTags() != null ? escXml(t.getTags()) : "<span style='color:#9CA3AF;'>—</span>").append("</td>");
            sb.append("<td").append(overdueStyle).append(">");
            sb.append(t.getDueDate() != null ? t.getDueDate().format(BR_DATE) : "<span style='color:#9CA3AF;'>—</span>");
            sb.append("</td>");
            sb.append("<td>").append(t.getUpdatedAt().format(BR_DATETIME)).append("</td>");
            sb.append("</tr>");
        }

        if (tasks.isEmpty()) {
            sb.append("<tr><td colspan='8' style='text-align:center;color:#9CA3AF;padding:20pt;'>Nenhuma tarefa encontrada.</td></tr>");
        }

        sb.append("</tbody></table>");
        sb.append(htmlFooter());
        return sb.toString();
    }

    // -------------------------------------------------------------------------
    // Helpers HTML
    // -------------------------------------------------------------------------
    private String htmlHead(String title) {
        return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
               "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Strict//EN\" " +
               "\"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd\">" +
               "<html xmlns=\"http://www.w3.org/1999/xhtml\"><head>" +
               "<meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\"/>" +
               "<title>" + escXml(title) + "</title>" +
               "<style type=\"text/css\">" + css() + "</style>" +
               "</head>";
    }

    private String htmlFooter() {
        return "</body></html>";
    }

    private String css() {
        return "@page { margin: 18mm 15mm; @bottom-center { content: 'PainelTask — Confidencial'; font-size:7pt; color:#9CA3AF; } @bottom-right { content: 'Pág. ' counter(page) ' / ' counter(pages); font-size:7pt; color:#6B7280; } }" +
               "body { font-family: Arial, Helvetica, sans-serif; font-size: 9pt; color: #1F2937; margin:0; padding:0; }" +
               ".header { background-color:#1E3A5F; color:white; padding:16pt 18pt 12pt 18pt; margin-bottom:14pt; }" +
               ".header-table { width:100%; border-collapse:collapse; }" +
               ".header-brand { font-size:22pt; font-weight:bold; color:#93C5FD; width:120pt; vertical-align:middle; }" +
               ".header-info { vertical-align:middle; }" +
               ".header-title { font-size:14pt; font-weight:bold; color:white; }" +
               ".header-sub { font-size:9pt; color:#BAC8E0; margin-top:3pt; }" +
               ".header-meta { font-size:8pt; color:#93C5FD; margin-top:10pt; border-top:0.5pt solid #2D5A8A; padding-top:6pt; }" +
               ".section-title { font-size:10pt; font-weight:bold; color:#1E3A5F; border-bottom:1.5pt solid #1E3A5F; padding-bottom:3pt; margin-bottom:8pt; margin-top:14pt; }" +
               ".stats-table { width:100%; border-collapse:collapse; margin-bottom:10pt; }" +
               ".stat-cell { width:25%; padding:10pt 8pt; text-align:center; border:0.5pt solid #E5E7EB; }" +
               ".stat-value { font-size:20pt; font-weight:bold; }" +
               ".stat-label { font-size:7.5pt; color:#6B7280; margin-top:3pt; }" +
               ".completion-bar-container { margin-bottom:10pt; }" +
               ".completion-label { font-size:8.5pt; color:#374151; }" +
               ".progress-track { width:100%; height:8pt; background-color:#E5E7EB; margin-top:4pt; }" +
               ".progress-fill { height:8pt; background-color:#16A34A; }" +
               ".data-table { width:100%; border-collapse:collapse; font-size:7.5pt; margin-bottom:10pt; }" +
               ".data-table thead tr { background-color:#1E3A5F; }" +
               ".data-table th { color:white; padding:5pt 7pt; text-align:left; font-weight:bold; }" +
               ".data-table td { padding:4pt 7pt; border-bottom:0.5pt solid #E5E7EB; vertical-align:middle; }" +
               ".row-alt td { background-color:#F8FAFC; }" +
               ".badge { padding:1.5pt 5pt; font-size:7pt; font-weight:bold; }" +
               ".badge-todo { background-color:#E5E7EB; color:#374151; }" +
               ".badge-doing { background-color:#DBEAFE; color:#1D4ED8; }" +
               ".badge-done { background-color:#DCFCE7; color:#15803D; }" +
               ".badge-high { background-color:#FEE2E2; color:#DC2626; }" +
               ".badge-medium { background-color:#FEF3C7; color:#B45309; }" +
               ".badge-low { background-color:#DCFCE7; color:#15803D; }";
    }

    private String statCell(long value, String label, String color, String bg) {
        return "<td class='stat-cell' style='background-color:" + bg + ";'>" +
               "<div class='stat-value' style='color:" + color + ";'>" + value + "</div>" +
               "<div class='stat-label'>" + escXml(label) + "</div>" +
               "</td>";
    }

    private String statusBadge(TaskStatus s) {
        return switch (s) {
            case TODO  -> "<span class='badge badge-todo'>A Fazer</span>";
            case DOING -> "<span class='badge badge-doing'>Em Progresso</span>";
            case DONE  -> "<span class='badge badge-done'>Conclu&#237;do</span>";
        };
    }

    private String priorityBadge(Priority p) {
        return switch (p) {
            case HIGH   -> "<span class='badge badge-high'>Alta</span>";
            case MEDIUM -> "<span class='badge badge-medium'>M&#233;dia</span>";
            case LOW    -> "<span class='badge badge-low'>Baixa</span>";
        };
    }

    private String roleLabel(User u) {
        return u.getRole().name().equals("ADMIN")
            ? "<span style='color:#2563EB;font-weight:bold;'>Admin</span>"
            : "<span style='color:#6B7280;'>Usu&#225;rio</span>";
    }

    private String escXml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                .replace("\"", "&quot;").replace("'", "&apos;");
    }

    private long count(List<Task> tasks, TaskStatus status) {
        return tasks.stream().filter(t -> t.getStatus() == status).count();
    }

    private long count(List<Task> tasks, Priority priority) {
        return tasks.stream().filter(t -> t.getPriority() == priority).count();
    }

    private boolean isOverdue(Task t, LocalDate today) {
        return t.getDueDate() != null && t.getDueDate().isBefore(today) && t.getStatus() != TaskStatus.DONE;
    }

    // -------------------------------------------------------------------------
    // PDF conversion
    // -------------------------------------------------------------------------
    private byte[] convertToPdf(String html) throws DocumentException {
        ITextRenderer renderer = new ITextRenderer();
        renderer.setDocumentFromString(html);
        renderer.layout();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        renderer.createPDF(baos);
        return baos.toByteArray();
    }
}
