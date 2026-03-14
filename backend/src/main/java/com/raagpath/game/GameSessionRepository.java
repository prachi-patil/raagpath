package com.raagpath.game;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface GameSessionRepository extends JpaRepository<GameSession, Long> {

    /** Best score per passed level for a player. Returns [level, maxScore] pairs. */
    @Query("SELECT s.level, MAX(s.totalScore) FROM GameSession s " +
           "WHERE s.player.id = :playerId AND s.passed = true " +
           "GROUP BY s.level")
    List<Object[]> findBestScoresByPlayer(@Param("playerId") Long playerId);

    /** Highest level the player has passed (null if none). */
    @Query("SELECT MAX(s.level) FROM GameSession s " +
           "WHERE s.player.id = :playerId AND s.passed = true")
    Optional<Integer> findHighestPassedLevel(@Param("playerId") Long playerId);

    /** Best score for a specific player + level (passed sessions only). */
    @Query("SELECT MAX(s.totalScore) FROM GameSession s " +
           "WHERE s.player.id = :playerId AND s.level = :level AND s.passed = true")
    Optional<Integer> findBestScoreByPlayerAndLevel(@Param("playerId") Long playerId,
                                                    @Param("level")    int level);
}
