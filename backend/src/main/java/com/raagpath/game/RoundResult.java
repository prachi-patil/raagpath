package com.raagpath.game;

import java.util.List;

/**
 * Per-round result sent by the frontend when submitting a session.
 *
 * @param roundNumber          1-based round index within the session
 * @param targetSwaras         swara(s) that were played (1 item for L1–L4, 2–3 for L5–L6)
 * @param firstAttemptCorrect  true if the user answered correctly on the very first tap
 * @param secondsTaken         elapsed seconds between tone playback and final answer
 * @param attempts             total taps made for this round (1 = perfect)
 */
public record RoundResult(
    int          roundNumber,
    List<String> targetSwaras,
    boolean      firstAttemptCorrect,
    double       secondsTaken,
    int          attempts
) {}
