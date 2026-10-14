CREATE TABLE IF NOT EXISTS items (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT items_name_not_blank CHECK (length(btrim(name)) > 0),
    CONSTRAINT items_description_not_blank CHECK (length(btrim(description)) > 0)
);
