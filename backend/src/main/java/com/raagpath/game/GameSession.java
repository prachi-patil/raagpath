package com.raagpath.game;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.OffsetDateTime;

/**
 * A single game session — one level attempt by one player.
 * rounds_json stores the per-round results as a JSONB array.
 */
@Entity
@Table(name = "game_sessions")
public class GameSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "player_id", nullable = false)
    private Player player;

    @Column(nullable = false)
    private Integer level;

    @Column(nullable = false, length = 3)
    private String shruti;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "rounds_json", nullable = false, columnDefinition = "jsonb")
    private String roundsJson = "[]";

    @Column(name = "total_score", nullable = false)
    private Integer totalScore = 0;

    @Column(nullable = false)
    private Boolean passed = false;

    @Column(name = "played_at", nullable = false)
    private OffsetDateTime playedAt = OffsetDateTime.now();

    // ── Getters & Setters ────────────────────────────────────────────────────

    public Long getId()                            { return id; }

    public Player getPlayer()                      { return player; }
    public void   setPlayer(Player player)         { this.player = player; }

    public Integer getLevel()                      { return level; }
    public void    setLevel(Integer level)         { this.level = level; }

    public String getShruti()                      { return shruti; }
    public void   setShruti(String shruti)         { this.shruti = shruti; }

    public String getRoundsJson()                  { return roundsJson; }
    public void   setRoundsJson(String roundsJson) { this.roundsJson = roundsJson; }

    public Integer getTotalScore()                 { return totalScore; }
    public void    setTotalScore(Integer score)    { this.totalScore = score; }

    public Boolean getPassed()                     { return passed; }
    public void    setPassed(Boolean passed)       { this.passed = passed; }

    public OffsetDateTime getPlayedAt()            { return playedAt; }
    public void           setPlayedAt(OffsetDateTime t) { this.playedAt = t; }
}
