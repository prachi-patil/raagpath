package com.raagpath.game;

import java.util.List;

/**
 * Request body for POST /api/game/sessions.
 *
 * @param username  player's username (case-insensitive lookup)
 * @param level     game level 1–6
 * @param shruti    tonic note used (e.g. "C", "G#")
 * @param rounds    all rounds played in this session (includes repeated rounds on miss)
 */
public record SubmitSessionRequest(
    String           username,
    int              level,
    String           shruti,
    List<RoundResult> rounds
) {}
