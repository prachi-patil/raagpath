package com.raagpath.game;

import com.raagpath.game.PlayerService.PlayerProfileResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * POST /api/players/join — create or retrieve a player by username.
 * Returns the player profile including level progression data.
 * Public endpoint — no JWT required.
 */
@RestController
@RequestMapping("/api/players")
public class PlayerController {

    private final PlayerService playerService;

    public PlayerController(PlayerService playerService) {
        this.playerService = playerService;
    }

    @PostMapping("/join")
    public ResponseEntity<PlayerProfileResponse> join(@RequestBody JoinRequest req) {
        Player player = playerService.findOrCreate(req.username());
        PlayerProfileResponse profile = playerService.buildProfile(player);
        return ResponseEntity.ok(profile);
    }

    // ── Request record ──────────────────────────────────────────────────────────

    public record JoinRequest(String username) {}
}
