package com.raagpath.game;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

/**
 * Lightweight player identity — username only, no password.
 * username_lower enforces case-insensitive uniqueness at the DB level.
 */
@Entity
@Table(name = "players")
public class Player {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String username;

    @Column(name = "username_lower", nullable = false, unique = true, length = 50)
    private String usernameLower;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    // ── Getters & Setters ────────────────────────────────────────────────────

    public Long getId()                                { return id; }

    public String getUsername()                        { return username; }
    public void   setUsername(String username) {
        this.username      = username;
        this.usernameLower = username.toLowerCase();
    }

    public String getUsernameLower()                   { return usernameLower; }

    public OffsetDateTime getCreatedAt()               { return createdAt; }
}
