import pytest
from fastapi.testclient import TestClient


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "service": "library-server"}


def test_root(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "service" in data
    assert "version" in data
    assert "api_docs" in data


class TestDocumentEndpoints:
    def test_get_documents(self, client, sample_document):
        response = client.get("/api/v1/documents/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0
        assert data[0]["title"] == sample_document.title
    
    def test_get_document(self, client, sample_document):
        response = client.get(f"/api/v1/documents/{sample_document.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sample_document.id
        assert data["title"] == sample_document.title
    
    def test_get_document_not_found(self, client):
        response = client.get("/api/v1/documents/9999")
        assert response.status_code == 404
    
    def test_create_document(self, client):
        document_data = {
            "title": "New Document",
            "author": "New Author",
            "category": "Literature"
        }
        response = client.post("/api/v1/documents/", json=document_data)
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == document_data["title"]
    
    def test_update_document(self, client, sample_document):
        update_data = {"title": "Updated Title"}
        response = client.put(
            f"/api/v1/documents/{sample_document.id}",
            json=update_data
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == update_data["title"]
    
    def test_delete_document(self, client, sample_document):
        response = client.delete(f"/api/v1/documents/{sample_document.id}")
        assert response.status_code == 200
        
        response = client.get(f"/api/v1/documents/{sample_document.id}")
        assert response.status_code == 404


class TestContentEndpoints:
    def test_get_content(self, client, sample_document, sample_content):
        response = client.get(f"/api/v1/content/{sample_document.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["document_id"] == sample_document.id
        assert data["document_title"] == sample_document.title
    
    def test_get_content_section(self, client, sample_document, sample_content):
        response = client.get(f"/api/v1/content/{sample_document.id}?section=0")
        assert response.status_code == 200
        data = response.json()
        assert "section" in data
        assert data["section"]["section_number"] == 0
    
    def test_get_passage(self, client, sample_document, sample_content):
        response = client.get(
            f"/api/v1/content/{sample_document.id}/passage?start_section=0"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["document_id"] == sample_document.id
        assert "passage" in data


class TestSearchEndpoints:
    def test_quick_search(self, client, sample_document):
        response = client.get("/api/v1/search/quick?q=Test")
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert data["total"] >= 0
    
    def test_advanced_search(self, client, sample_document):
        response = client.get(
            "/api/v1/search/advanced?title=Test&category=Literature"
        )
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert data["total"] >= 0
    
    def test_search_post(self, client, sample_document):
        search_data = {
            "query": "test",
            "category": "Literature"
        }
        response = client.post("/api/v1/search/", json=search_data)
        assert response.status_code == 200
        data = response.json()
        assert data["query"] == search_data["query"]


class TestCategoryEndpoints:
    def test_get_categories(self, client, sample_document):
        response = client.get("/api/v1/categories/")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert len(data["categories"]) > 0
    
    def test_get_category_stats(self, client, sample_document):
        response = client.get("/api/v1/categories/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_documents" in data
        assert "total_categories" in data


class TestUserEndpoints:
    def test_create_user(self, client):
        user_data = {
            "user_id": "new_user_123"
        }
        response = client.post("/api/v1/users/", json=user_data)
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == user_data["user_id"]
    
    def test_get_user(self, client, sample_user):
        response = client.get(f"/api/v1/users/{sample_user.user_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == sample_user.user_id
    
    def test_update_progress(self, client, sample_user, sample_document):
        progress_data = {
            "document_id": sample_document.id,
            "progress_percentage": 50.0,
            "last_position": 100
        }
        response = client.put(
            f"/api/v1/users/{sample_user.user_id}/progress",
            json=progress_data
        )
        assert response.status_code == 200