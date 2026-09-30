"""Cliente mínimo da API do GitHub para o `nexus vigiar` (espelho de frontend/src/data/github)."""

from __future__ import annotations

import base64
from dataclasses import dataclass
from typing import Any

import httpx

API = "https://api.github.com"


class GitHubApiError(RuntimeError):
    def __init__(self, status: int, message: str) -> None:
        super().__init__(f"GitHub {status}: {message}")
        self.status = status


@dataclass(frozen=True)
class Repo:
    owner: str
    name: str
    branch: str = "main"

    @classmethod
    def parse(cls, value: str, branch: str = "main") -> Repo:
        owner, _, name = value.strip().partition("/")
        if not owner or not name or "/" in name:
            raise ValueError(f"repositório inválido (usa dono/nome): {value}")
        return cls(owner, name, branch)


class GitHub:
    def __init__(self, token: str, client: httpx.Client | None = None) -> None:
        self.http = client or httpx.Client(base_url=API, timeout=120)
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }

    def _request(self, method: str, path: str, **kwargs: Any) -> httpx.Response:
        response = self.http.request(method, path, headers={**self.headers,
                                                            **kwargs.pop("headers", {})},
                                     **kwargs)
        if response.status_code >= 400:
            try:
                message = response.json().get("message", response.text)
            except ValueError:
                message = response.text
            raise GitHubApiError(response.status_code, str(message))
        return response

    def user(self) -> str:
        return str(self._request("GET", "/user").json()["login"])

    def repo_info(self, repo: Repo) -> dict[str, Any]:
        data: dict[str, Any] = self._request("GET", f"/repos/{repo.owner}/{repo.name}").json()
        return data

    def list_dir(self, repo: Repo, path: str) -> list[str] | None:
        """Nomes dentro de `path` no ramo, ou None se não existir."""
        try:
            data = self._request("GET", f"/repos/{repo.owner}/{repo.name}/contents/{path}",
                                 params={"ref": repo.branch}).json()
        except GitHubApiError as exc:
            if exc.status == 404:
                return None
            raise
        return [item["name"] for item in data] if isinstance(data, list) else [data["name"]]

    def commit_files(self, repo: Repo, files: dict[str, bytes], message: str,
                     attempts: int = 5) -> str:
        """Um commit com todos os ficheiros; repete se o ramo avançar (não é fast-forward)."""
        base = f"/repos/{repo.owner}/{repo.name}/git"
        blobs = {
            path: self._request("POST", f"{base}/blobs", json={
                "content": base64.b64encode(data).decode(), "encoding": "base64"}).json()["sha"]
            for path, data in files.items()
        }
        last: GitHubApiError | None = None
        for _ in range(attempts):
            head = self._request("GET", f"{base}/ref/heads/{repo.branch}").json()["object"]["sha"]
            tree = self._request("GET", f"{base}/commits/{head}").json()["tree"]["sha"]
            new_tree = self._request("POST", f"{base}/trees", json={
                "base_tree": tree,
                "tree": [{"path": p, "mode": "100644", "type": "blob", "sha": s}
                         for p, s in blobs.items()],
            }).json()["sha"]
            commit = self._request("POST", f"{base}/commits", json={
                "message": message, "tree": new_tree, "parents": [head]}).json()["sha"]
            try:
                self._request("PATCH", f"{base}/refs/heads/{repo.branch}",
                              json={"sha": commit, "force": False})
                return str(commit)
            except GitHubApiError as exc:
                if exc.status != 422:
                    raise
                last = exc
        raise last or GitHubApiError(422, "não foi possível gravar")
