package com.raagpath.game;

import com.raagpath.game.GameService.SubmitSessionResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * POST /api/game/sessions — submit a completed game session.
 * Returns total score, passed flag, and isNewBest flag.
 * Public endpoint — no JWT required.
 */
@RestController
@RequestMapping("/api/game")
public class GameController {

    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @PostMapping("/sessions")
    public ResponseEntity<SubmitSessionResponse> submitSession(
            @RequestBody SubmitSessionRequest req) {
        SubmitSessionResponse result = gameService.submitSession(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }
}
