CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

CREATE SEQUENCE question_number_seq START 1;

CREATE TABLE questions (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  number       INTEGER      UNIQUE,
  question_md  TEXT         NOT NULL,
  question_pt  TEXT         NOT NULL,
  answer_md    TEXT         NOT NULL,
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ,
  embedding    vector(1536)
);

-- published_at <= now() cannot appear in a partial index predicate (now() is not immutable);
-- queries enforce this condition at runtime instead.
CREATE INDEX idx_questions_active     ON questions (number DESC) WHERE published_at IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_questions_active_asc ON questions (number ASC)  WHERE published_at IS NOT NULL AND deleted_at IS NULL;

CREATE TABLE resources (
  id        UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  url       TEXT         NOT NULL UNIQUE CHECK (url LIKE 'https://%'),
  label     TEXT         NOT NULL,
  source    TEXT         NOT NULL,
  author    TEXT,
  embedding vector(1536)
);

CREATE TABLE question_resources (
  question_id UUID    NOT NULL REFERENCES questions (id) ON DELETE CASCADE,
  resource_id UUID    NOT NULL REFERENCES resources (id) ON DELETE CASCADE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (question_id, resource_id)
);

CREATE INDEX idx_question_resources_question_id ON question_resources (question_id);

-- Assigns the next question number when published_at is first set.
-- Guards on number IS NULL so re-publishing retains the original number.
CREATE OR REPLACE FUNCTION assign_question_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.published_at IS NOT NULL AND NEW.number IS NULL THEN
    NEW.number := nextval('question_number_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_assign_question_number
  BEFORE INSERT OR UPDATE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION assign_question_number();
