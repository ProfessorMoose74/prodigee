import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import Base, get_db
from app.models import Document, Content, User


SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture
def sample_document(db):
    document = Document(
        title="Test Document",
        author="Test Author",
        category="Literature",
        subcategory="Fiction",
        language="en",
        word_count=1000,
        description="A test document for testing"
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


@pytest.fixture
def sample_content(db, sample_document):
    content = Content(
        document_id=sample_document.id,
        section_title="Chapter 1",
        section_number=0,
        content_text="This is the first chapter of the test document.",
        word_count=10
    )
    db.add(content)
    db.commit()
    db.refresh(content)
    return content


@pytest.fixture
def sample_user(db):
    user = User(
        user_id="test_user_123",
        session_token="test_token"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user