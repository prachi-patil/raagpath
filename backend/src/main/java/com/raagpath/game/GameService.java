package com.raagpath.game;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class GameService {

    private static final int STREAK_TARGET = 5;

    private final PlayerService           playerService;
    private final GameSessionRepository   gameSessionRepository;
    private final ObjectMapper            objectMapper;

    public GameService(PlayerService playerService,
                       GameSessionRepository gameSessionRepository,
                       ObjectMapper objectMapper) {
        this.playerService          = playerService;
        this.gameSessionRepository  = gameSessionRepository;
        this.objectMapper           = objectMapper;
    }

    /** Submit a completed session and persist it. */
    @Transactional
    public SubmitSessionResponse submitSession(SubmitSessionRequest req) {
        Player player = playerService.findOrCreate(req.username());

        // ── Score + pass computation ───────────────────────────────────────────
        int     totalScore = computeTotalScore(req.rounds());
        boolean passed     = hasPassingStreak(req.rounds());

        // ── isNewBest — check BEFORE saving ───────────────────────────────────
        boolean isNewBest = false;
        if (passed) {
            int previousBest = gameSessionRepository
                    .findBestScoreByPlayerAndLevel(player.getId(), req.level())
                    .orElse(0);
            isNewBest = totalScore > previousBest;
        }

        // ── Persist session ───────────────────────────────────────────────────
        GameSession session = new GameSession();
        session.setPlayer(player);
        session.setLevel(req.level());
        session.setShruti(req.shruti());
        session.setTotalScore(totalScore);
        session.setPassed(passed);

        try {
            session.setRoundsJson(objectMapper.writeValueAsString(req.rounds()));
        } catch (JsonProcessingException e) {
            session.setRoundsJson("[]");
        }

        gameSessionRepository.save(session);

        return new SubmitSessionResponse(session.getId(), totalScore, passed, isNewBest);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /** max(10, 100 - (attempts - 1) * 30) */
    static int computeRoundScore(int attempts) {
        return Math.max(10, 100 - (attempts - 1) * 30);
    }

    private int computeTotalScore(List<RoundResult> rounds) {
        return rounds.stream()
                .mapToInt(r -> computeRoundScore(r.attempts()))
                .sum();
    }

    /**
     * Returns true if there are ≥ STREAK_TARGET consecutive firstAttemptCorrect
     * answers anywhere in the round list.
     */
    private boolean hasPassingStreak(List<RoundResult> rounds) {
        int streak = 0;
        for (RoundResult r : rounds) {
            if (r.firstAttemptCorrect()) {
                if (++streak >= STREAK_TARGET) return true;
            } else {
                streak = 0;
            }
        }
        return false;
    }

    // ── Response record ──────────────────────────────────────────────────────

    public record SubmitSessionResponse(
            Long    sessionId,
            int     totalScore,
            boolean passed,
            boolean isNewBest
    ) {}
}
