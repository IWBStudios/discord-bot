CREATE TABLE moderation_logs (
    id BIGSERIAL PRIMARY KEY,
    target_id VARCHAR(32) NOT NULL,
    target_tag VARCHAR(37) NOT NULL,
    moderator_id VARCHAR(32) NOT NULL,
    moderator_tag VARCHAR(37) NOT NULL,
    action VARCHAR(16) NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);