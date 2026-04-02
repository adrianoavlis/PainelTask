package com.paineltask.controller;

import com.paineltask.model.User;
import com.paineltask.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> adminReport(@AuthenticationPrincipal User admin) throws Exception {
        byte[] pdf = reportService.generateAdminReport(admin);
        String filename = "relatorio-administrativo-" + today() + ".pdf";
        return pdfResponse(pdf, filename);
    }

    @GetMapping("/me")
    public ResponseEntity<byte[]> myReport(@AuthenticationPrincipal User user) throws Exception {
        byte[] pdf = reportService.generateUserReport(user);
        String filename = "minhas-atividades-" + today() + ".pdf";
        return pdfResponse(pdf, filename);
    }

    private ResponseEntity<byte[]> pdfResponse(byte[] pdf, String filename) {
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate")
                .body(pdf);
    }

    private String today() {
        return LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
    }
}
