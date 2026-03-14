package com.raagpath.game;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
public class PlayerService {

    private final PlayerRepository        playerRepository;
    private final GameSessionRepository   gameSessionRepository;

    public PlayerService(PlayerRepository playerRepository,
                         GameSessionRepository gameSessionRepository) {
        this.playerRepository      = playerRepository;
        this.gameSessionRepository = gameSessionRepository;
    }

    /**
     * Return existing player with this username (case-insensitive),
     * or create a new one if it doesn't exist.
     */
    @Transactional
    public Player findOrCreate(String username) {
        String lower = username.toLowerCase();
        return playerRepository.findByUsernameLower(lower).orElseGet(() -> {
            Player p = new Player();
            p.setUsername(username);   // also sets usernameLower via setter
            return playerRepository.save(p);
        });
    }

    /** Build the player profile response including level progression data. */
    public PlayerProfileResponse buildProfile(Player player) {
        // Highest level they have passed (default to 1 if none)
        int currentLevel = gameSessionRepository
                .findHighestPassedLevel(player.getId())
                .orElse(1);

        // Best score per level (0 if not played / not passed)
        Map<String, Integer> levelBestScores = new HashMap<>();
        for (int lvl = 1; lvl <= 6; lvl++) {
            levelBestScores.put(String.valueOf(lvl), 0);
        }
        gameSessionRepository.findBestScoresByPlayer(player.getId())
                .forEach(row -> {
                    int    lvl   = ((Number) row[0]).intValue();
                    int    score = ((Number) row[1]).intValue();
                    levelBestScores.put(String.valueOf(lvl), score);
                });

        return new PlayerProfileResponse(
                player.getId(),
                player.getUsername(),
                currentLevel,
                levelBestScores
        );
    }

    // ── Inner response record ──────────────────────────────────────────────────

    public record PlayerProfileResponse(
            Long                 id,
            String               username,
            int                  currentLevel,
            Map<String, Integer> levelBestScores
    ) {}
}
