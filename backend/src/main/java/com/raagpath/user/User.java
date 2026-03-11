package com.raagpath.user;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "xp_total", nullable = false)
    private Integer xpTotal = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    // ── Getters & Setters ────────────────────────────────────────────────────

    public Long getId()                          { return id; }

    public String getEmail()                     { return email; }
    public void   setEmail(String email)         { this.email = email; }

    public String getPasswordHash()              { return passwordHash; }
    public void   setPasswordHash(String hash)   { this.passwordHash = hash; }

    public Integer getXpTotal()                  { return xpTotal; }
    public void    setXpTotal(Integer xp)        { this.xpTotal = xp; }

    public OffsetDateTime getCreatedAt()         { return createdAt; }
}
