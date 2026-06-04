package com.smartbankai.controller;

import com.smartbankai.dto.Dtos.AiChatRequest;
import com.smartbankai.dto.Dtos.AiChatResponse;
import com.smartbankai.service.impl.AiChatService;
import com.smartbankai.util.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
public class AiChatController {
    private final AiChatService aiChatService;
    private final CurrentUser currentUser;

    public AiChatController(AiChatService aiChatService, CurrentUser currentUser) {
        this.aiChatService = aiChatService;
        this.currentUser = currentUser;
    }

    @PostMapping("/chat")
    public AiChatResponse chat(@Valid @RequestBody AiChatRequest request) {
        return aiChatService.chat(currentUser.get(), request);
    }
}
